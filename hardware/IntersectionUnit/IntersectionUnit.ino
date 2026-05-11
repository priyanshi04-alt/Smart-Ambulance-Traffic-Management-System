#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// --------------------------- Wi-Fi Credentials ---------------------------
const char* ssid     = "S25 ultra";
const char* password = "25100903";

// ---------------------------- Server config ----------------------------
const char* serverIp   = "10.154.86.215"; 
const int   serverPort = 3000;

WebSocketsClient webSocket;

// --------------------------- PIN DEFINITIONS ---------------------------
const int N_RED = 12, N_YLW = 15, N_GRN = 27; // North
const int S_RED = 26, S_YLW = 25, S_GRN = 33; // South
const int E_RED = 32, E_YLW = 18, E_GRN = 19; // East
const int W_RED = 21, W_YLW = 22, W_GRN = 23; // West

unsigned long disconnectTime   = 0;
bool          isConnected      = false;
bool          inFailSafeMode   = false;
unsigned long flashTimer       = 0;
bool          flashState       = false;

// --------------------------- HELPER FUNCTIONS ---------------------------
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
  Serial.println("[FAILSAFE] Triggered due to disconnect!");
}

void processFailSafeLoop() {
  // Blinks Yellow lights for all directions every 500ms
  if (inFailSafeMode && (millis() - flashTimer > 500)) {
    flashTimer = millis();
    flashState = !flashState;
    digitalWrite(N_YLW, flashState); digitalWrite(N_RED, LOW); digitalWrite(N_GRN, LOW);
    digitalWrite(S_YLW, flashState); digitalWrite(S_RED, LOW); digitalWrite(S_GRN, LOW);
    digitalWrite(E_YLW, flashState); digitalWrite(E_RED, LOW); digitalWrite(E_GRN, LOW);
    digitalWrite(W_YLW, flashState); digitalWrite(W_RED, LOW); digitalWrite(W_GRN, LOW);
  }
}

// --------------------------- WEBSOCKET EVENT ---------------------------
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from Server!");
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
      DynamicJsonDocument doc(2048);
      DeserializationError err = deserializeJson(doc, msg);
      
      if (!err) {
        String eventName = doc["event"].as<String>();
        if (eventName == "traffic-state") {
          JsonObject data    = doc["data"].as<JsonObject>();
          JsonObject signals = data["signals"].as<JsonObject>();
          
          if (!signals.isNull() && !inFailSafeMode) {
            // SYNC NORTH WITH SOUTH
            String southState = signals["south"].as<String>();
            setLight(N_RED, N_YLW, N_GRN, southState);
            setLight(S_RED, S_YLW, S_GRN, southState);
            setLight(E_RED, E_YLW, E_GRN, signals["east"].as<String>());
            setLight(W_RED, W_YLW, W_GRN, signals["west"].as<String>());
            Serial.println("Lights Updated via Server Command!");
          }
        }
      }
      break;
    }
  }
}

// --------------------------- SETUP ---------------------------
void setup() {
  Serial.begin(115200);

  // Initialize all 12 LEDs AND TURN THEM ON FOR TESTING
  int pins[] = {N_RED,N_YLW,N_GRN, S_RED,S_YLW,S_GRN, E_RED,E_YLW,E_GRN, W_RED,W_YLW,W_GRN};
  for (int p : pins) {
    pinMode(p, OUTPUT);
    digitalWrite(p, HIGH); // FORCE SAB ON HONGI
  }
  
  Serial.println("=========================================");
  Serial.println("HARDWARE TEST: Saari 12 LEDs 3 second ke liye jal rahi hain!");
  Serial.println("Agar nahi jal rahi, toh WIRING mein dikkat hai!");
  Serial.println("=========================================");
  
  delay(3000); // 3 seconds wait
  
  // Wapas turn off karo taaki WebSocket apna kaam kar sake
  for (int p : pins) {
    digitalWrite(p, LOW); 
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: ");
  Serial.println(WiFi.localIP());

  // Connect to Node.js Server WebSocket
  webSocket.begin(serverIp, serverPort, "/hardware-ws");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

// --------------------------- LOOP ---------------------------
void loop() {
  webSocket.loop();

  // If server connection is lost for 10 seconds, enter failsafe mode
  if (!isConnected && (millis() - disconnectTime > 10000)) {
    if (!inFailSafeMode) triggerFailSafeFlashing();
    processFailSafeLoop();
  }
}
