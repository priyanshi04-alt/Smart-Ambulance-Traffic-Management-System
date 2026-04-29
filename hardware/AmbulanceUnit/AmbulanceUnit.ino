#include <WiFi.h>
#include <HTTPClient.h>
#include <arduinoFFT.h> 

// Wi-Fi Credentials
const char* ssid = "moto g34 5G_3702";
const char* password = "98712356";

// Server API Endpoint
const char* serverUrl = "http://10.239.10.215:3000/api/iot/ambulance-detected";

const int micPin = 34;

// FFT Configuration (UPDATED FOR VERSION 2.0+)
#define SAMPLES 64             
#define SAMPLING_FREQUENCY 4000 
unsigned int sampling_period_us;
unsigned long microSeconds;
double vReal[SAMPLES];
double vImag[SAMPLES];

// New v2.0 syntax
ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, SAMPLES, SAMPLING_FREQUENCY);

// Validation Buffer & Cooldown
int positiveDetects = 0;
unsigned long lastTriggerTime = 0;
const unsigned long COOLDOWN_MS = 20000; 

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
  int rawValue = analogRead(micPin);
  Serial.print("RAW MIC VALUE: ");
  Serial.println(rawValue);
  delay(200); // Thoda slow print karne ke liye
}
