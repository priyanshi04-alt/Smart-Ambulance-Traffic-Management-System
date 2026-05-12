#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid     = "S25 ultra";
const char* password = "25100903";
const char* serverIp   = "10.85.57.215"; 
const int   serverPort = 3000;

WebSocketsClient webSocket;

const int N_RED = 12, N_YLW = 15, N_GRN = 27;
const int S_RED = 26, S_YLW = 25, S_GRN = 33;
const int E_RED = 32, E_YLW = 18, E_GRN = 19;
const int W_RED = 21, W_YLW = 22, W_GRN = 23;

void setLight(int redPin, int ylwPin, int grnPin, const String& color) {
  digitalWrite(redPin, LOW); digitalWrite(ylwPin, LOW); digitalWrite(grnPin, LOW);
  if (color == "red") digitalWrite(redPin, HIGH);
  else if (color == "yellow") digitalWrite(ylwPin, HIGH);
  else if (color == "green") digitalWrite(grnPin, HIGH);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String msg = String((char*)payload);
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, msg);
    if (doc["event"] == "traffic-state") {
      JsonObject signals = doc["data"]["signals"];
      setLight(N_RED, N_YLW, N_GRN, signals["north"].as<String>());
      setLight(S_RED, S_YLW, S_GRN, signals["south"].as<String>());
      setLight(E_RED, E_YLW, E_GRN, signals["east"].as<String>());
      setLight(W_RED, W_YLW, W_GRN, signals["west"].as<String>());
      Serial.println("Lights Updated!");
    }
  }
}

void setup() {
  Serial.begin(115200);
  int pins[] = {N_RED,N_YLW,N_GRN, S_RED,S_YLW,S_GRN, E_RED,E_YLW,E_GRN, W_RED,W_YLW,W_GRN};
  for (int p : pins) { pinMode(p, OUTPUT); digitalWrite(p, HIGH); }
  delay(3000); // 3 sec hardware test
  for (int p : pins) { digitalWrite(p, LOW); }
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("WiFi Connected!");

  webSocket.begin(serverIp, serverPort, "/hardware-ws");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() { webSocket.loop(); }
