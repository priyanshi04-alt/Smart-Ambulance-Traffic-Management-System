#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// --------------------------- Wi-Fi Credentials ---------------------------
const char* ssid     = "CHITKARA";
const char* password = "Chitkara@123";

// ---------------------------- Server config ----------------------------
const char* serverIp   = "10.20.24.228"; 
const int   serverPort = 3000;

WebSocketsClient webSocket;

// --------------------------- PIN DEFINITIONS ---------------------------
const int N_RED = 12, N_YLW = 14, N_GRN = 27; // North
const int S_RED = 26, S_YLW = 25, S_GRN = 33; // South
const int E_RED = 32, E_YLW = 18, E_GRN = 19; // East
const int W_RED = 21, W_YLW = 22, W_GRN = 23; // West

unsigned long disconnectTime   = 0;
bool          isConnected      = false;
bool          inFailSafeMode   = false;
unsigned long flashTimer       = 0;
bool          flashState       = false;

void setLight(int redPin, int ylwPin, int grnPin, const String& color) {
  digitalWrite(redPin, LOW);
  digitalWrite(ylwPin, LOW);
  digitalWrite(grnPin, LOW);
  if (color == "red")    digitalWrite(redPin, HIGH);
  else if (color == "yellow") digitalWrite(ylwPin, HIGH);
  else if (color == "green")  digitalWrite(grnPin, HIGH);
}

void triggerFailSafeFlashing() {
  inFailSafeMode = true;
}

void processFailSafeLoop() {
  if (inFailSafeMode && (millis() - flashTimer > 500)) {
    flashTimer = millis();
    flashState = !flashState;
    digitalWrite(N_YLW, flashState); digitalWrite(N_RED, LOW); digitalWrite(N_GRN, LOW);
    digitalWrite(S_YLW, flashState); digitalWrite(S_RED, LOW); digitalWrite(S_GRN, LOW);
    digitalWrite(E_YLW, flashState); digitalWrite(E_RED, LOW); digitalWrite(E_GRN, LOW);
    digitalWrite(W_YLW, flashState); digitalWrite(W_RED, LOW); digitalWrite(W_GRN, LOW);
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected!");
      isConnected = false;
      disconnectTime = millis();
      break;
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Server!");
      isConnected = true;
      inFailSafeMode = false;
      break;
    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.println("[WS] Received: " + msg);
      DynamicJsonDocument doc(2048);
      DeserializationError err = deserializeJson(doc, msg);
      if (!err) {
        String eventName = doc["event"].as<String>();
        if (eventName == "traffic-state") {
          JsonObject data    = doc["data"].as<JsonObject>();
          JsonObject signals = data["signals"].as<JsonObject>();
          if (!signals.isNull() && !inFailSafeMode) {
            setLight(N_RED, N_YLW, N_GRN, signals["north"].as<String>());
            setLight(S_RED, S_YLW, S_GRN, signals["south"].as<String>());
            setLight(E_RED, E_YLW, E_GRN, signals["east"].as<String>());
            setLight(W_RED, W_YLW, W_GRN, signals["west"].as<String>());
            Serial.println("Lights Updated!");
          }
        }
      }
      break;
    }
  }
}

void setup() {
  Serial.begin(115200);

  int pins[] = {N_RED,N_YLW,N_GRN, S_RED,S_YLW,S_GRN, E_RED,E_YLW,E_GRN, W_RED,W_YLW,W_GRN};
  for (int p : pins) {
    pinMode(p, OUTPUT);
    digitalWrite(p, LOW);
  }

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  webSocket.begin(serverIp, serverPort, "/hardware-ws");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  if (!isConnected && (millis() - disconnectTime > 10000)) {
    if (!inFailSafeMode) triggerFailSafeFlashing();
    processFailSafeLoop();
  }
}
