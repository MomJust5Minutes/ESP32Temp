#include <Wire.h>

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  Serial.println("I2C Scanner");
  
  // Default ESP32 I2C pins
  Wire.begin(); // SDA=21, SCL=22 by default on ESP32
}

void loop() {
  byte error, address;
  int deviceCount = 0;
  
  Serial.println("Scanning I2C bus...");
  
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.print(address, HEX);
      Serial.println(" !");
      
      deviceCount++;
    } else if (error == 4) {
      Serial.print("Unknown error at address 0x");
      if (address < 16) {
        Serial.print("0");
      }
      Serial.println(address, HEX);
    }
  }
  
  if (deviceCount == 0) {
    Serial.println("No I2C devices found!");
  } else {
    Serial.print("Found ");
    Serial.print(deviceCount);
    Serial.println(" device(s).");
  }
  
  delay(5000); // Wait 5 seconds before scanning again
} 