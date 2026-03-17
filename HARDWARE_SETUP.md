# Smart Ambulance Traffic Control System - Hardware Integration Guide

This document provides the complete wiring instructions and C++ Arduino code for integrating your physical hardware into the Node.js backend system.

As per your design, the system utilizes **two ESP32 microcontrollers**:
1. **Ambulance Unit ESP32:** Uses a KY-037 Microphone Sound Sensor to detect the siren and sends Wi-Fi alerts.
2. **Intersection Unit ESP32:** Controls Red, Yellow, and Green 5mm LEDs for all **4 directions** based on commands received from the server.

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
const char* serverUrl = "http://192.168.x.x:3000/api/iot/ambulance-detected"; // Correct endpoint

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
      
      // Payload must match server: { direction: "north", active: true }
      // Change "north" to whichever direction the ambulance is coming FROM
      String jsonPayload = "{\"direction\":\"north\",\"active\":true}";
      int httpResponseCode = http.POST(jsonPayload);
      
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      http.end();
      
      // Wait 10 seconds before being able to trigger again
      delay(10000); 
    }
  }
  delay(100);
}
```

---

## 2. The Traffic Intersection Unit — 4 Directions (12 LEDs)

This single ESP32 controls **all 4 traffic lights** at the intersection (North, South, East, West).  
Each direction has 3 LEDs (Red, Yellow, Green) = **12 LEDs total**.

It polls `/api/iot/signal-status` every second and lights up all 4 signal sets simultaneously.

### Component List:
- 1× ESP32 Dev Board
- 12× 5mm LEDs (3 Red, 3 Yellow, 3 Green)
- 12× 220Ω resistors (one per LED)
- 1× Breadboard + Jumper wires

### Wiring Table:
*(Connect each LED's **longer leg (+)** through a 220Ω resistor to the ESP32 pin. The **shorter leg (−)** goes to GND.)*

| Direction | Color  | ESP32 Pin |
|-----------|--------|-----------|
| North     | Red    | Pin 12    |
| North     | Yellow | Pin 14    |
| North     | Green  | Pin 27    |
| South     | Red    | Pin 26    |
| South     | Yellow | Pin 25    |
| South     | Green  | Pin 33    |
| East      | Red    | Pin 32    |
| East      | Yellow | Pin 18    |
| East      | Green  | Pin 19    |
| West      | Red    | Pin 21    |
| West      | Yellow | Pin 22    |
| West      | Green  | Pin 23    |

### Intersection Unit Code (ESP32) — 4 Directions:

Install **ArduinoJson** first: `Sketch → Include Library → Manage Libraries → search "ArduinoJson" by Benoit Blanchon → Install`

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint — returns live signal state for all 4 directions
// Change 192.168.x.x to your PC's local IP (run ipconfig on Windows)
const char* serverUrl = "http://192.168.x.x:3000/api/iot/signal-status";

// ── PIN DEFINITIONS ──────────────────────────────────────────
const int N_RED = 12, N_YLW = 14, N_GRN = 27; // North
const int S_RED = 26, S_YLW = 25, S_GRN = 33; // South
const int E_RED = 32, E_YLW = 18, E_GRN = 19; // East
const int W_RED = 21, W_YLW = 22, W_GRN = 23; // West

// Helper: apply a color to one set of 3 LEDs
void setLight(int redPin, int ylwPin, int grnPin, String color) {
  digitalWrite(redPin, LOW);
  digitalWrite(ylwPin, LOW);
  digitalWrite(grnPin, LOW);
  if      (color == "red")    digitalWrite(redPin, HIGH);
  else if (color == "yellow") digitalWrite(ylwPin, HIGH);
  else if (color == "green")  digitalWrite(grnPin, HIGH);
}

void setup() {
  Serial.begin(115200);

  // Set all 12 LED pins as OUTPUT
  int pins[] = {N_RED,N_YLW,N_GRN, S_RED,S_YLW,S_GRN,
                E_RED,E_YLW,E_GRN, W_RED,W_YLW,W_GRN};
  for (int pin : pins) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();

      // Response shape: { "signals": { "north":"green", "south":"green", "east":"red", "west":"red" }, ... }
      DynamicJsonDocument doc(1024);
      DeserializationError err = deserializeJson(doc, payload);

      if (!err) {
        String north = doc["signals"]["north"].as<String>();
        String south = doc["signals"]["south"].as<String>();
        String east  = doc["signals"]["east"].as<String>();
        String west  = doc["signals"]["west"].as<String>();

        // Apply colors to all 4 physical traffic lights
        setLight(N_RED, N_YLW, N_GRN, north);
        setLight(S_RED, S_YLW, S_GRN, south);
        setLight(E_RED, E_YLW, E_GRN, east);
        setLight(W_RED, W_YLW, W_GRN, west);

        Serial.println("N:" + north + " S:" + south + " E:" + east + " W:" + west);
      } else {
        Serial.println("JSON parse error!");
      }
    } else {
      Serial.println("HTTP GET failed. Is the server running?");
    }
    http.end();
  }

  delay(1000); // Poll server every 1 second
}
```

---

## How to Test:
1. Make sure your Node.js server and both ESP32s are on the **same Wi-Fi network**.
2. Find your PC's IP: run `ipconfig` on Windows → look for **IPv4 Address** → replace `192.168.x.x`.
3. Start the server: `node server.js` in the project folder.
4. Upload code to both ESP32s via Arduino IDE.
5. Open `http://localhost:3000` to see the dashboard.
6. **Clap near the KY-037** — all 4 physical traffic lights react to the emergency mode instantly!
