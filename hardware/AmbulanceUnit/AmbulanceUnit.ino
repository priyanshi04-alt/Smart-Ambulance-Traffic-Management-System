#include <WiFi.h>
#include <HTTPClient.h>
#include <arduinoFFT.h> 

const char* ssid = "S25 ultra";
const char* password = "25100903";
const char* serverUrl = "http://10.154.86.215:3000/api/iot/ambulance-detected";

const int micPin = 32;

// Accuracy badhane ke liye Samples badha diye hain
#define SAMPLES 128            
#define SAMPLING_FREQUENCY 4000 
unsigned int sampling_period_us;
unsigned long microSeconds;
double vReal[SAMPLES];
double vImag[SAMPLES];

ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, SAMPLES, SAMPLING_FREQUENCY);

int positiveDetects = 0;
unsigned long lastTriggerTime = 0;
const unsigned long COOLDOWN_MS = 10000; 

void setup() {
  Serial.begin(115200);
  pinMode(micPin, INPUT);
  sampling_period_us = round(1000000 * (1.0 / SAMPLING_FREQUENCY));

  WiFi.begin(ssid, password);
  Serial.print("Connecting...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nREADY!");
}

void loop() {
  if (millis() - lastTriggerTime < COOLDOWN_MS) { return; }

  for (int i = 0; i < SAMPLES; i++) {
    microSeconds = micros();
    vReal[i] = analogRead(micPin);
    vImag[i] = 0;
    while(micros() - microSeconds < sampling_period_us) {}
  }

  FFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();

  double peakFrequency = FFT.majorPeak();
  double maxAmplitude = 0;
  
  // Bins check (Ignoring first few low freq bins)
  for (int i = 4; i < (SAMPLES/2); i++) { 
    if (vReal[i] > maxAmplitude) maxAmplitude = vReal[i];
  }

  Serial.print("Freq: "); Serial.print(peakFrequency);
  Serial.print(" Hz | Amp: "); Serial.println(maxAmplitude);

  // SIREN DETECTION
  if (peakFrequency >= 500 && peakFrequency <= 1800 && maxAmplitude > 100) {
    positiveDetects++;
  } else {
    if(positiveDetects > 0) positiveDetects--; 
  }

  if (positiveDetects >= 2) {
    positiveDetects = 0;
    Serial.println(">>> SIREN DETECTED!");
    
    if(WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      String jsonPayload = "{\"direction\":\"north\",\"active\":true}";
      http.POST(jsonPayload);
      http.end();
      lastTriggerTime = millis(); 
    }
  }
  delay(30);
}
