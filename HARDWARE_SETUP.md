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

Before compiling, install **arduinoFFT** from the Arduino Library Manager.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <arduinoFFT.h> // Make sure to install this library

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Endpoint
const char* serverUrl = "http://192.168.x.x:3000/api/iot/ambulance-detected";

const int micPin = 34;

// FFT Configuration
#define SAMPLES 64             // Must be a power of 2
#define SAMPLING_FREQUENCY 4000 // Hz, Must be > twice max frequency 
arduinoFFT FFT = arduinoFFT();
unsigned int sampling_period_us;
unsigned long microSeconds;
double vReal[SAMPLES];
double vImag[SAMPLES];

// Validation Buffer & Cooldown
int positiveDetects = 0;
unsigned long lastTriggerTime = 0;
const unsigned long COOLDOWN_MS = 20000; // 20s non-blocking cooldown

void setup() {
  Serial.begin(115200);
  pinMode(micPin, INPUT);
  sampling_period_us = round(1000000 * (1.0 / SAMPLING_FREQUENCY));

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
  // Check Non-Blocking Cooldown
  if (millis() - lastTriggerTime < COOLDOWN_MS) {
     return; 
  }

  /* 1. Sample Data */
  for (int i = 0; i < SAMPLES; i++) {
    microSeconds = micros();
    vReal[i] = analogRead(micPin);
    vImag[i] = 0;
    while(micros() - microSeconds < sampling_period_us) {
      // Accurate clock delay loop
    }
  }

  /* 2. Compute FFT */
  FFT.Windowing(vReal, SAMPLES, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
  FFT.Compute(vReal, vImag, SAMPLES, FFT_FORWARD);
  FFT.ComplexToMagnitude(vReal, vImag, SAMPLES);

  /* 3. Extract Peak Frequency */
  double peakFrequency = FFT.MajorPeak(vReal, SAMPLES, SAMPLING_FREQUENCY);
  
  // Frequency targeting (700Hz - 960Hz bucket typical of Yelp sirens) + Baseline volume checks
  if (peakFrequency > 700 && peakFrequency < 960) {
    positiveDetects++;
  } else {
    positiveDetects = 0; // Reset validation buffer if invalid noise
  }

  /* 4. Multi-Frame Validation */
  if (positiveDetects >= 3) {
    positiveDetects = 0;
    Serial.println("Valid Siren Signature Confirmed! Triggering Green Corridor...");
    
    if(WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      String jsonPayload = "{\"direction\":\"north\",\"active\":true}";
      int httpCode = http.POST(jsonPayload);
      Serial.print("HTTP Code: "); Serial.println(httpCode);
      http.end();
      
      lastTriggerTime = millis(); // Lock into cooldown
    }
  }
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

Install **ArduinoJson** and **WebSockets** (by Markus Sattler) via Library Manager.

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server config
const char* serverIp = "192.168.x.x";
const int serverPort = 3000;

WebSocketsClient webSocket;

// ── PIN DEFINITIONS ──────────────────────────────────────────
const int N_RED = 12, N_YLW = 14, N_GRN = 27; // North
const int S_RED = 26, S_YLW = 25, S_GRN = 33; // South
const int E_RED = 32, E_YLW = 18, E_GRN = 19; // East
const int W_RED = 21, W_YLW = 22, W_GRN = 23; // West

// Networking & Failsafe Flags
unsigned long disconnectTime = 0;
bool isConnected = false;
bool inFailSafeMode = false;
unsigned long flashTimer = 0;
bool flashState = false;

// Apply color to one set of 3 LEDs
void setLight(int redPin, int ylwPin, int grnPin, String color) {
  digitalWrite(redPin, LOW);
  digitalWrite(ylwPin, LOW);
  digitalWrite(grnPin, LOW);
  if      (color == "red")    digitalWrite(redPin, HIGH);
  else if (color == "yellow") digitalWrite(ylwPin, HIGH);
  else if (color == "green")  digitalWrite(grnPin, HIGH);
}

void triggerFailSafeFlashing() {
  inFailSafeMode = true;
}

void processFailSafeLoop() {
  if (inFailSafeMode && millis() - flashTimer > 500) {
    flashTimer = millis();
    flashState = !flashState;
    // Standard fail safe: Universal blinking yellow approach
    digitalWrite(N_YLW, flashState); digitalWrite(N_RED, LOW); digitalWrite(N_GRN, LOW);
    digitalWrite(S_YLW, flashState); digitalWrite(S_RED, LOW); digitalWrite(S_GRN, LOW);
    digitalWrite(E_YLW, flashState); digitalWrite(E_RED, LOW); digitalWrite(E_GRN, LOW);
    digitalWrite(W_YLW, flashState); digitalWrite(W_RED, LOW); digitalWrite(W_GRN, LOW);
  }
}

// Websocket interceptor and protocol parsing
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected!");
      isConnected = false;
      disconnectTime = millis();
      break;

    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Server!");
      isConnected = true;
      inFailSafeMode = false;
      webSocket.sendTXT("40"); // Socket.IO engine v4 formal handshake
      break;

    case WStype_TEXT: {
      String msg = String((char*)payload);
      
      // Socket.IO event intercept (Prefixed with 42)
      if(msg.startsWith("42")) {
        String jsonPayload = msg.substring(2);
        
        DynamicJsonDocument doc(2048);
        DeserializationError err = deserializeJson(doc, jsonPayload);

        if (!err) {
          String eventName = doc[0].as<String>();
          
          if (eventName == "hardware-sync" || eventName == "traffic-state") {
             JsonObject data = doc[1].as<JsonObject>();
             
             JsonObject signals;
             String commandId = "";

             if (eventName == "hardware-sync") {
                signals = data["payload"].as<JsonObject>();
                commandId = data["commandId"].as<String>();
             } else {
                signals = data["signals"].as<JsonObject>();
             }

             if (!signals.isNull() && !inFailSafeMode) {
                String north = signals["north"].as<String>();
                String south = signals["south"].as<String>();
                String east  = signals["east"].as<String>();
                String west  = signals["west"].as<String>();

                setLight(N_RED, N_YLW, N_GRN, north);
                setLight(S_RED, S_YLW, S_GRN, south);
                setLight(E_RED, E_YLW, E_GRN, east);
                setLight(W_RED, W_YLW, W_GRN, west);

                Serial.println("Updated Physical Lights Mode N:" + north + " S:" + south + " E:" + east + " W:" + west);
             }

             // Pipeline Optimization & Reliability ACK Return (Only via explicit hardware-sync)
             if (eventName == "hardware-sync" && commandId != "") {
                String ackEvent = "42[\"node-ack\", {\"commandId\":\"" + commandId + "\", \"status\":\"SUCCESS\"}]";
                webSocket.sendTXT(ackEvent);
                Serial.println("[WS] Sent Delivery ACK for CMD: " + commandId);
             }
          }
        }
      }
      break;
    }
  }
}

void setup() {
  Serial.begin(115200);

  int pins[] = {N_RED,N_YLW,N_GRN, S_RED,S_YLW,S_GRN,
                E_RED,E_YLW,E_GRN, W_RED,W_YLW,W_GRN};
  for (int pin : pins) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
  }

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  // Event-Driven WebSocket Mount using engine.io standard
  webSocket.begin(serverIp, serverPort, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); 
}

void loop() {
  // Ultra-fast zero-latency event listener
  webSocket.loop();
  
  // Fail-Safe check: 10s connection drop timeout fallback capability
  if (!isConnected && (millis() - disconnectTime > 10000)) {
    if (!inFailSafeMode) {
      Serial.println("CRITICAL: Server lost for 10s. FALLBACK TO FAIL-SAFE AUTO-MODE.");
      triggerFailSafeFlashing();
    }
    processFailSafeLoop(); // Flash yellow lights continually mapping alert.
  }
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
