#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "OvniNetwork";
const char* password = "et@galaxia";

// Server details
const char* serverUrl = "http://192.168.15.91:3001/api/temperature";

// LM35DZ sensor setup
#define LM35PIN 34  // Analog pin connected to the LM35DZ sensor
const float voltageReference = 3.3; // ESP32 ADC reference voltage (typically 3.3V)
const int adcResolution = 4095;    // ESP32 ADC resolution (12-bit = 4095)

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    if(WiFi.status() == WL_CONNECT_FAILED)
    {
      Serial.print("Not connected, leaving.");
      return;
    }
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  // Test server connection
  testServerConnection();
}

void testServerConnection() {
  Serial.println("\n--- Testing Server Connection ---");
  Serial.print("Attempting to connect to: ");
  Serial.println(serverUrl);
  
  HTTPClient http;
  http.begin(serverUrl);
  
  // Set timeout to 10 seconds
  http.setTimeout(10000);
  
  Serial.println("Sending GET request...");
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.print("Connection successful! Response code: ");
    Serial.println(httpCode);
    String payload = http.getString();
    Serial.println("Response:");
    Serial.println(payload);
  } else {
    Serial.print("Connection failed! Error: ");
    Serial.println(http.errorToString(httpCode).c_str());
    
    // Additional debugging
    Serial.print("ESP32 IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("ESP32 subnet mask: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("ESP32 gateway: ");
    Serial.println(WiFi.gatewayIP());
  }
  
  http.end();
  Serial.println("--- End of Test ---\n");
}

float readLM35Temperature() {
  // Read the analog value from LM35DZ - take multiple readings for stability
  int rawValue = 0;
  for(int i = 0; i < 10; i++) {
    rawValue += analogRead(LM35PIN);
    delay(10);
  }
  int adcValue = rawValue / 10;
  
  // Debug raw ADC value
  Serial.print("Raw ADC value: ");
  Serial.println(adcValue);
  
  // ESP32 has 12-bit ADC (0-4095) with 3.3V reference
  // LM35DZ outputs 10mV per °C
  float voltage = (adcValue * voltageReference) / adcResolution;
  float temperature_celsius = voltage * 100.0;
  
  // Debug voltage and calculation
  Serial.print("Voltage: ");
  Serial.print(voltage, 4);
  Serial.print("V, Temperature: ");
  Serial.print(temperature_celsius);
  Serial.println("°C");
  
  // Sanity check for reasonable values
  if (temperature_celsius < 0 || temperature_celsius > 100) {
    Serial.println("Warning: Temperature out of expected range (0-100°C)");
  }
  
  return temperature_celsius;
}

void loop() {
  // Check if it's time to send a new reading
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED) {
      // Read temperature from LM35DZ sensor
      float temperature = readLM35Temperature();
      
      // Send temperature data to server
      sendTemperatureData(temperature);
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}

void sendTemperatureData(float temperature) {
  HTTPClient http;
  
  // Your Domain name with URL path or IP address with path
  http.begin(serverUrl);
  
  // Specify content-type header
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["timestamp"] = millis();
  
  // Serialize JSON to string
  String requestBody;
  serializeJson(doc, requestBody);
  
  // Send HTTP POST request
  int httpResponseCode = http.POST(requestBody);
  
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C - HTTP Response code: ");
  Serial.println(httpResponseCode);
  
  // Free resources
  http.end();
} 