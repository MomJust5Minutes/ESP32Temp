#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
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

// DHT sensor setup
#define DHTPIN 5      // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11 // DHT 11
DHT dht(DHTPIN, DHTTYPE);

// Configuration
EnvConfig config;

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  Serial.println("\nESP32 with DHT11 sensor starting up...");
  
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
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  const char* ssid = config.getSSID();
  const char* password = config.getPassword();
  
  Serial.println("Connecting to WiFi");
  Serial.print("SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    if(WiFi.status() == WL_CONNECT_FAILED)
    {
      Serial.println("Not connected, leaving.");
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
      // Read temperature from DHT sensor
      float temperature = dht.readTemperature();
      
      // Check if reading is valid
      if (isnan(temperature)) {
        Serial.println("Failed to read from DHT sensor!");
      } else {
        // Send temperature data to server
        sendTemperatureData(temperature);
      }
    } else {
      Serial.println("WiFi Disconnected");
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
