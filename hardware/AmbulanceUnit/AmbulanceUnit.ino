#include <WiFi.h>
#include <HTTPClient.h>
#include <arduinoFFT.h> 

const char* ssid = "S25 ultra";
const char* password = "25100903";
const char* serverUrl = "http://10.20.26.10:3000/api/iot/ambulance-detected";

const int micPin = 32;

#define SAMPLES 256            
#define SAMPLING_FREQUENCY 6000 
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
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
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
  
  // Center signal
  mean /= SAMPLES;
  for (int i = 0; i < SAMPLES; i++) { vReal[i] -= mean; }

  FFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();

  double peakFrequency = FFT.majorPeak();
  double maxAmplitude = 0;
  
  // Ignore noise bins
  for (int i = 15; i < (SAMPLES/2); i++) { 
    if (vReal[i] > maxAmplitude) maxAmplitude = vReal[i];
  }

  if (maxAmplitude < 35) { peakFrequency = 0; maxAmplitude = 0; }

  Serial.print("Freq: "); Serial.print(peakFrequency);
  Serial.print(" Hz | Amp: "); Serial.println(maxAmplitude);

  // Siren Detection Logic (Balanced for Distance)
  // 600Hz to 2100Hz range, with 90+ Amplitude
  if (peakFrequency >= 600 && peakFrequency <= 2100 && maxAmplitude > 90) {
    positiveDetects++;
  } else {
    if(positiveDetects > 0) positiveDetects--; 
  }

  // Confirm after 4 consecutive hits
  if (positiveDetects >= 4) {
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
