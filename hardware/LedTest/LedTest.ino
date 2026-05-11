int pins[] = {12, 14, 27, 26, 25, 33, 32, 18, 19, 21, 22, 23};

void setup() {
  for (int p : pins) {
    pinMode(p, OUTPUT);
  }
}

void loop() {
  for (int p : pins) {
    digitalWrite(p, HIGH);
    delay(1000);   // 1 second tak light jalegi
    digitalWrite(p, LOW);
  }
}
