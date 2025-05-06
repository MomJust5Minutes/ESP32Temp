#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include "lib/EnvConfig/EnvConfig.h"

// ==========================================
// CONFIGURAÇÕES DO USUÁRIO - ALTERE AQUI
// ==========================================

// WiFi credentials - ALTERE PARA SUA REDE
const char* ssid = "COLOQUE_SEU_SSID_AQUI";
const char* password = "COLOQUE_SUA_SENHA_AQUI";

// Server details - ALTERE PARA O IP DO SEU SERVIDOR
const char* serverUrl = "http://SEU_IP_SERVIDOR:3001/api/temperature";

// ==========================================
// FIM DAS CONFIGURAÇÕES DO USUÁRIO
// ==========================================

// LM35DZ sensor setup
#define LM35PIN 34  // Analog pin connected to the LM35DZ sensor

// Configuration
EnvConfig config;

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

// Variables for smoothing readings
const int numReadings = 10;
float readings[numReadings];      // readings from the analog input
int readIndex = 0;                // the index of the current reading
float total = 0;                  // the running total
float average = 0;                // the average

void setup() {
  Serial.begin(115200);
  
  Serial.println("\nESP32 with LM35DZ sensor starting up...");
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("Failed to mount SPIFFS");
    Serial.println("Using default WiFi and server settings");
  } else {
    Serial.println("SPIFFS mounted successfully");
  }
  
  // Initialize configuration
  if (!config.begin()) {
    Serial.println("Failed to initialize configuration");
    Serial.println("Using default WiFi and server settings");
  }
  
  // Load configuration
  if (!config.load()) {
    Serial.println("No configuration file found or error loading file");
    Serial.println("Creating default configuration file");
    config.createDefaultConfig();
    Serial.println("Using default WiFi and server settings");
    Serial.println("Please upload the EnvConfigManager sketch to configure your settings");
  } else {
    Serial.println("Configuration loaded successfully");
  }
  
  // Initialize readings array
  for (int i = 0; i < numReadings; i++) {
    readings[i] = 0;
  }
  
  // Configure ADC
  analogSetWidth(12);         // 12-bit resolution (0-4095)
  analogSetAttenuation(ADC_11db);  // 11dB attenuation for full range
  
  // Connect to WiFi
  const char* ssid = config.getSSID();
  const char* password = config.getPassword();
  
  Serial.println("Connecting to WiFi");
  Serial.print("SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("");
    Serial.println("Failed to connect to WiFi after multiple attempts");
    Serial.println("Please check your WiFi credentials in the config file");
    return;
  }
  
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  // Test server connection
  testServerConnection();
}

void testServerConnection() {
  Serial.println("\n--- Testing Server Connection ---");
  const char* serverUrl = config.getServerUrl();
  
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

float readTemperature() {
  // Read from LM35DZ and apply smoothing
  
  // Subtract the last reading
  total = total - readings[readIndex];
  
  // Read from the sensor
  int adcVal = analogRead(LM35PIN);
  
  // Convert ADC value to voltage (0-3.3V range with 12-bit ADC)
  float voltage = adcVal * (3.3 / 4095.0);
  
  // Convert voltage to temperature (LM35DZ outputs 10mV per degree C)
  float tempC = voltage * 100.0;
  
  // Store in array for smoothing
  readings[readIndex] = tempC;
  
  // Add the reading to the total
  total = total + readings[readIndex];
  
  // Advance to the next position in the array
  readIndex = (readIndex + 1) % numReadings;
  
  // Calculate the average
  average = total / numReadings;
  
  // Debug output
  Serial.print("ADC Value: ");
  Serial.print(adcVal);
  Serial.print(", Voltage: ");
  Serial.print(voltage, 3);
  Serial.print("V, Raw Temp: ");
  Serial.print(tempC, 1);
  Serial.print("°C, Smoothed: ");
  Serial.print(average, 1);
  Serial.println("°C");
  
  return average;
}

void loop() {
  // Check if it's time to send a new reading
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED) {
      // Read temperature from LM35DZ sensor
      float temperature = readTemperature();
      
      // Send temperature data to server
      sendTemperatureData(temperature);
    } else {
      Serial.println("WiFi Disconnected");
      // Try to reconnect
      WiFi.begin(config.getSSID(), config.getPassword());
    }
    lastTime = millis();
  }
}

void sendTemperatureData(float temperature) {
  HTTPClient http;
  
  // Your Domain name with URL path or IP address with path
  const char* serverUrl = config.getServerUrl();
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