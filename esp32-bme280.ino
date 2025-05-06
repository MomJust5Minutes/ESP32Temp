#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
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

// BME280 sensor setup
#define SEALEVELPRESSURE_HPA (1013.25)
Adafruit_BME280 bme; // I2C

// Configuration
EnvConfig config;

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  Serial.println("\nESP32 with BME280 sensor starting up...");
  
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
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize BME280 sensor
  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor at address 0x76, trying 0x77...");
    if (!bme.begin(0x77)) {
      Serial.println("Could not find a valid BME280 sensor, check wiring!");
      while (1) delay(10);
    } else {
      Serial.println("BME280 found at address 0x77!");
    }
  } else {
    Serial.println("BME280 found at address 0x76!");
  }
  
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
    while (1) delay(1000); // Halt program
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

void loop() {
  // Check if it's time to send a new reading
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED) {
      // Read data from BME280 sensor
      float temperature = bme.readTemperature();
      float humidity = bme.readHumidity();
      float pressure = bme.readPressure() / 100.0F;
      float altitude = bme.readAltitude(SEALEVELPRESSURE_HPA);
      
      // Send data to server
      sendSensorData(temperature, humidity, pressure, altitude);
    } else {
      Serial.println("WiFi Disconnected");
      // Try to reconnect
      WiFi.begin(config.getSSID(), config.getPassword());
    }
    lastTime = millis();
  }
}

void sendSensorData(float temperature, float humidity, float pressure, float altitude) {
  HTTPClient http;
  
  // Your Domain name with URL path or IP address with path
  const char* serverUrl = config.getServerUrl();
  http.begin(serverUrl);
  
  // Specify content-type header
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON document
  StaticJsonDocument<300> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["altitude"] = altitude;
  doc["timestamp"] = millis();
  
  // Serialize JSON to string
  String requestBody;
  serializeJson(doc, requestBody);
  
  // Send HTTP POST request
  int httpResponseCode = http.POST(requestBody);
  
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C, Humidity: ");
  Serial.print(humidity);
  Serial.print("%, Pressure: ");
  Serial.print(pressure);
  Serial.print("hPa, Altitude: ");
  Serial.print(altitude);
  Serial.print("m - HTTP Response code: ");
  Serial.println(httpResponseCode);
  
  // Free resources
  http.end();
}