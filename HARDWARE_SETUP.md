# SMART AMBULANCE TRAFFIC MANAGEMENT SYSTEM USING IOT & SOUND DETECTION HARDWARE IMPLEMENTATION GUIDE (AUDIO-BASED)

This document provides the technical blueprint for building the physical "Sensing Node" using an ESP32 and a Microphone for real-time siren detection.

## 1. WIRING CONNECTIONS

| Component | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **Microphone (MAX9814)** | GPIO 34 | Siren Sensor |
| **North LED** | GPIO 2 | North Green Light |
| **South LED** | GPIO 4 | South Green Light |
| **East LED** | GPIO 5 | East Green Light |
| **West LED** | GPIO 18 | West Green Light |

---

## 2. ESP32 ARDUINO CODE (4-WAY SYNC)

```cpp
#include <WiFi.h>
#include <SocketIoClient.h>

// --- PINS ---
#define N_LED 2
#define S_LED 4
#define E_LED 5
#define W_LED 18
#define MIC_PIN 34

SocketIoClient webSocket;

void onTrafficState(const char * payload, size_t length) {
    // Expected Payload: {"signals":{"north":"green","south":"green","east":"red","west":"red"}, ...}
    Serial.printf("Traffic Update: %s\n", payload);
    
    // Simple JSON Parsing for 4 Directions
    digitalWrite(N_LED, strstr(payload, "\"north\":\"green\"") ? HIGH : LOW);
    digitalWrite(S_LED, strstr(payload, "\"south\":\"green\"") ? HIGH : LOW);
    digitalWrite(E_LED, strstr(payload, "\"east\":\"green\"") ? HIGH : LOW);
    digitalWrite(W_LED, strstr(payload, "\"west\":\"green\"") ? HIGH : LOW);
}

void setup() {
    Serial.begin(115200);
    pinMode(N_LED, OUTPUT); pinMode(S_LED, OUTPUT);
    pinMode(E_LED, OUTPUT); pinMode(W_LED, OUTPUT);
    
    // Connect to WiFi and Server... (See full code in Setup Guide)
    webSocket.on("traffic-state", onTrafficState);
    webSocket.begin("YOUR_SERVER_IP", 3000);
}

void loop() {
    webSocket.loop();
    // Siren detection logic...
}
```

void loop() {
    webSocket.loop();
    
    // Simple Siren Detection Logic (Simulated FFT)
    int sensorValue = analogRead(MIC_PIN);
    if (sensorValue > 2500) { // Threshold for loud siren
        webSocket.emit("siren-detected", "{\"nodeId\": \"JUNC-01\", \"direction\": \"south\"}");
        Serial.println("SIREN DETECTED!");
        delay(5000); // Cooldown
    }
}
```

---

## 3. HOW TO DEMO
1.  Connect your ESP32 to your laptop's WiFi hotspot.
2.  Start the **Node.js Server** (`npm start`).
3.  Open the **Admin Dashboard** in your browser.
4.  Play an ambulance siren sound near the ESP32 Microphone.
5.  **Watch the Magic**: The Map will update automatically, and your hardware LEDs will flip to Green!
