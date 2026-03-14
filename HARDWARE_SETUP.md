# Smart Ambulance Traffic Control System - Hardware Integration Guide

This document provides the complete wiring instructions and C++ Arduino code for integrating your physical hardware into the Node.js backend system.

As per your design, the system utilizes **two ESP32 microcontrollers**:
1. **Ambulance Unit ESP32:** Uses a KY-037 Microphone Sound Sensor to detect the siren and sends Wi-Fi alerts.
2. **Intersection Unit ESP32:** Controls Red, Yellow, and Green 5mm LEDs based on commands received from the server.

---

## 1. The Ambulance Unit (Siren Detection)

This ESP32 is placed on the ambulance (or acts as the listening node). It listens to the KY-037 Microphone Sound Sensor. When a loud siren is detected, it sends an HTTP POST request to the server to trigger the Emergency Green Corridor.

### Wiring:
- **KY-037 VCC** -> ESP32 3.3V
- **KY-037 GND** -> ESP32 GND
- **KY-037 AO (Analog Out)** -> ESP32 Pin 34

### Ambulance Unit Code (ESP32):
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Endpoint (Change 192.168.x.x to your computer's local IP running Node.js)
const char* serverUrl = "http://192.168.x.x:3000/api/iot/sound-sensor";

const int micPin = 34; // Analog pin connected to KY-037
const int threshold = 2500; // Adjust this based on your KY-037 sensitivity potentiometer

void setup() {
  Serial.begin(115200);
  pinMode(micPin, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
}

void loop() {
  int sensorValue = analogRead(micPin);
  
  if (sensorValue > threshold) {
    Serial.println("Siren Detected! Sending Emergency Signal...");
    
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      
      // Sending JSON Payload: {"nodeId": "I1", "detected": true}
      String jsonPayload = "{\"nodeId\":\"I1\",\"detected\":true}";
      int httpResponseCode = http.POST(jsonPayload);
      
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      http.end();
      
      // Wait 10 seconds before being able to trigger again
      delay(10000); 
    }
  }
  delay(100); // Small delay to prevent spamming
}
```

---

## 2. The Traffic Intersection Unit (LED Controller)

This ESP32 is installed at the physical traffic intersection. It connects to the Wi-Fi and constantly asks the Node.js server *"What color should the lights be?"* 
It then lights up the 5mm LEDs based on the server's response.

### Wiring:
*(Remember to use a 220Ω or 330Ω resistor between the ESP32 pins and the longer leg (Anode) of each LED to prevent them from burning out. The shorter leg (Cathode) goes to GND on the breadboard).*

- **Red LED** -> Resistor -> ESP32 Pin 12
- **Yellow LED** -> Resistor -> ESP32 Pin 14
- **Green LED** -> Resistor -> ESP32 Pin 27

### Intersection Unit Code (ESP32):
To parse the JSON response easily, install the **ArduinoJson** library in your Arduino IDE (Sketch -> Include Library -> Manage Libraries -> Search "ArduinoJson" by Benoit Blanchon).

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Endpoint (Change 192.168.x.x to your computer's local IP)
// This endpoint returns the current global traffic state.
const char* serverUrl = "http://192.168.x.x:3000/api/admin/traffic";

// LED Pins
const int redPin = 12;
const int yellowPin = 14;
const int greenPin = 27;

void setup() {
  Serial.begin(115200);
  
  pinMode(redPin, OUTPUT);
  pinMode(yellowPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverUrl);
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String payload = http.getString();
      
      // Parse JSON
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        // We will read the "south" node for this physical intersection's color
        // Example response: { "signals": { "south": "green", "north": "red" } }
        String color = doc["signals"]["south"].as<String>();
        
        // Turn off all LEDs first
        digitalWrite(redPin, LOW);
        digitalWrite(yellowPin, LOW);
        digitalWrite(greenPin, LOW);
        
        // Turn on the correct LED based on the server
        if (color == "red") {
          digitalWrite(redPin, HIGH);
        } else if (color == "yellow") {
          digitalWrite(yellowPin, HIGH);
        } else if (color == "green") {
          digitalWrite(greenPin, HIGH);
        }
      }
    }
    http.end();
  }
  
  // Wait 1 second before asking the server again (Polling)
  delay(1000);
}
```

## How to Test This:
1. Make sure your computer running the Node.js server and both ESP32 microcontrollers are connected to the exact same Wi-Fi network.
2. Find your computer's IP address (Run `ipconfig` on Windows or `ifconfig` on Mac/Linux) and replace `192.168.x.x` in the Arduino code.
3. Open the Dashboard in your browser (e.g., `http://localhost:3000`).
4. Clap loudly near the KY-037 sensor. The Ambulance Unit ESP32 will send the POST request.
5. The Node.js server receives it, triggers the Emergency state.
6. The Intersection Unit ESP32 pulls the new state from the server, and the Red LED will physically switch to Green!
