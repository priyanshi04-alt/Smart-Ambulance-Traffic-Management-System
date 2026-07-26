void setup() {
  Serial.begin(115200);
  pinMode(32, INPUT); // Is baar hum D32 use kar rahe hain test ke liye
}

void loop() {
  int rawValue = analogRead(32);
  Serial.println(rawValue);
  delay(10);
}
