#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

// WiFi credentials
const char* ssid = "OvniNetwork";
const char* password = "et@galaxia";

// Server details
const char* serverUrl = "http://192.168.15.91:3001/api/temperature";

// BME280 sensor setup
Adafruit_BME280 bme; // I2C interface
const float seaLevelPressure = 1013.25; // Standard sea-level pressure in hPa

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize BME280 sensor
  if (!bme.begin(0x76)) { // Try address 0x76 (common for BME280 modules)
    Serial.println("Could not find a valid BME280 sensor at address 0x76, trying 0x77...");
    
    if (!bme.begin(0x77)) { // Alternative address 0x77
      Serial.println("Could not find a valid BME280 sensor! Check wiring and I2C address.");
      while (1) delay(10); // Don't proceed if sensor not found
    }
  }
  
  Serial.println("BME280 sensor initialized successfully!");
  
  // Configure BME280 settings
  bme.setSampling(Adafruit_BME280::MODE_NORMAL,     // Operating Mode
                  Adafruit_BME280::SAMPLING_X2,     // Temperature oversampling
                  Adafruit_BME280::SAMPLING_X16,    // Pressure oversampling
                  Adafruit_BME280::SAMPLING_X1,     // Humidity oversampling
                  Adafruit_BME280::FILTER_X16,      // Filtering
                  Adafruit_BME280::STANDBY_MS_500); // Standby time
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    if (WiFi.status() == WL_CONNECT_FAILED) {
      Serial.println("Connection failed, leaving.");
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

void readBME280Data(float &temperature, float &humidity, float &pressure, float &altitude) {
  // Read temperature, humidity, pressure, and calculated altitude
  temperature = bme.readTemperature();
  humidity = bme.readHumidity();
  pressure = bme.readPressure() / 100.0F; // Convert Pa to hPa
  altitude = bme.readAltitude(seaLevelPressure);
  
  // Debug output
  Serial.println("BME280 Readings:");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  
  Serial.print("Pressure: ");
  Serial.print(pressure);
  Serial.println(" hPa");
  
  Serial.print("Approximate altitude: ");
  Serial.print(altitude);
  Serial.println(" m");
  
  // Sanity check for reasonable temperature values
  if (temperature < -40 || temperature > 85) {
    Serial.println("Warning: Temperature out of BME280 specified range (-40 to 85°C)");
  }
  
  // Sanity check for humidity values
  if (humidity < 0 || humidity > 100) {
    Serial.println("Warning: Humidity out of range (0-100%)");
  }
}

void loop() {
  // Check if it's time to send a new reading
  if ((millis() - lastTime) > timerDelay) {
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED) {
      // Read data from BME280 sensor
      float temperature, humidity, pressure, altitude;
      readBME280Data(temperature, humidity, pressure, altitude);
      
      // Send sensor data to server
      sendSensorData(temperature, humidity, pressure, altitude);
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}

void sendSensorData(float temperature, float humidity, float pressure, float altitude) {
  HTTPClient http;
  
  // Your Domain name with URL path or IP address with path
  http.begin(serverUrl);
  
  // Specify content-type header
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure; 
  doc["altitude"] = altitude;
  doc["sensor"] = "BME280";
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
  Serial.print("% - HTTP Response code: ");
  Serial.println(httpResponseCode);
  
  // Free resources
  http.end();
}