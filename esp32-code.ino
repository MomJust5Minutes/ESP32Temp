#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/temperature";

// DHT sensor setup
#define DHTPIN 4      // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11 // DHT 11
DHT dht(DHTPIN, DHTTYPE);

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
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
  // Check if temperature reading is valid
  if (isnan(temperature)) {
    Serial.println("Failed to read valid temperature data!");
    return;
  }
  
  HTTPClient http;
  
  // Your Domain name with URL path or IP address with path
  http.begin(serverUrl);
  
  // Specify content-type header
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON document with proper formatting
  String requestBody = "{\"temperature\":" + String(temperature, 1) + ",\"timestamp\":" + String(millis()) + "}";
  
  Serial.print("Sending temperature data: ");
  Serial.println(requestBody);
  
  // Send HTTP POST request
  int httpResponseCode = http.POST(requestBody);
  
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C - HTTP Response code: ");
  Serial.println(httpResponseCode);
  
  // Free resources
  http.end();
}
