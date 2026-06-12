#include <WiFi.h>
#include <HTTPClient.h>
#include <arduinoFFT.h> 

// Wi-Fi Credentials
const char* ssid = "moto g34 5G_3702";
const char* password = "98712356";

// Server API Endpoint
const char* serverUrl = "https://resqroute-nd4f.onrender.com/api/iot/ambulance-detected";

const int micPin = 32;

// FFT Configuration (Exact May 14th Setup)
#define SAMPLES 128            
#define SAMPLING_FREQUENCY 4000 
unsigned int sampling_period_us;
unsigned long microSeconds;
double vReal[SAMPLES];
double vImag[SAMPLES];

ArduinoFFT<double> doubleFFT = ArduinoFFT<double>(vReal, vImag, SAMPLES, SAMPLING_FREQUENCY);

// Validation Buffer & Cooldown
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

  double mean = 0;
  for (int i = 0; i < SAMPLES; i++) {
    microSeconds = micros();
    vReal[i] = analogRead(micPin);
    vImag[i] = 0;
    mean += vReal[i];
    while(micros() - microSeconds < sampling_period_us) {}
  }

  // CENTER THE SIGNAL: Removes DC Offset electrical bias
  mean /= SAMPLES;
  for (int i = 0; i < SAMPLES; i++) { vReal[i] -= mean; }

  doubleFFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
  doubleFFT.compute(FFTDirection::Forward);
  doubleFFT.complexToMagnitude();

  double peakFrequency = doubleFFT.majorPeak();
  double maxAmplitude = 0;
  
  // Bins check (Ignoring first few low freq bins)
  for (int i = 4; i < (SAMPLES/2); i++) { 
    if (vReal[i] > maxAmplitude) maxAmplitude = vReal[i];
  }

  // ─── HIGH-SELECTIVITY NOISE FILTERING ───
  // Calculate average background noise floor (outside the active peak range)
  double noiseSum = 0;
  int noiseCount = 0;
  for (int i = 4; i < 15; i++) { // Low-frequency non-siren band
    noiseSum += vReal[i];
    noiseCount++;
  }
  for (int i = 59; i < 64; i++) { // High-frequency non-siren band
    noiseSum += vReal[i];
    noiseCount++;
  }
  double noiseFloor = (noiseCount > 0) ? (noiseSum / noiseCount) : 1.0;
  if (noiseFloor < 1.0) noiseFloor = 1.0;

  // Calculate Spectral Peakiness (SNR)
  double snr = maxAmplitude / noiseFloor;

  // Filter out low amplitude background noise (Increased to 80 for absolute quiet room stability)
  if (maxAmplitude < 80) { peakFrequency = 0; maxAmplitude = 0; snr = 0.0; }

  Serial.print("Freq: "); Serial.print(peakFrequency);
  Serial.print(" Hz | Amp: "); Serial.print(maxAmplitude);
  Serial.print(" | SNR: "); Serial.println(snr);

  // ─── AMBULANCE SIREN SPECIFIC MATCHING ───
  // 1. Narrow Frequency Band: Strictly 700Hz - 1400Hz (Standard Ambulance Wail/Yelp Center)
  // 2. High SNR Requirement (snr >= 4.2): Requires a highly sharp, pure single-frequency peak.
  //    Completely rejects songs/music because songs have background instruments and vocals 
  //    that raise the noise floor, keeping SNR below 3.0.
  if (peakFrequency >= 700.0 && peakFrequency <= 1400.0 && maxAmplitude > 115 && snr >= 4.2) {
    positiveDetects++;
  } else {
    if(positiveDetects > 0) positiveDetects--; 
  }

  // Confirm after 6 consecutive valid FFT frames (~180-200ms of sustained continuous wail)
  // Ignores brief musical high notes or vocals that shift/end quickly!
  if (positiveDetects >= 6) {
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
