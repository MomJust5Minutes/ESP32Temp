#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <WebServer.h>

// ==========================================
// CONFIGURAÇÕES DO USUÁRIO - ALTERE AQUI
// ==========================================

// WiFi credentials - ALTERE PARA SUA REDE
const char* ssid = "COLOQUE_SEU_SSID_AQUI";
const char* password = "COLOQUE_SUA_SENHA_AQUI";

// Server details - ALTERE PARA O IP DO SEU SERVIDOR
const char* serverUrl = "http://SEU_IP_SERVIDOR:3000/api/temperature";

// ==========================================
// FIM DAS CONFIGURAÇÕES DO USUÁRIO
// ==========================================

// Definição do pino do ventilador
const int FAN_PIN = 5;
bool fanState = false;

// Servidor HTTP local
WebServer server(80);

// BME280 sensor setup
Adafruit_BME280 bme; // I2C interface
const float seaLevelPressure = 1013.25; // Standard sea-level pressure in hPa

// Timing variables
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Send readings every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Inicializar o pino do ventilador como saída
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW); // Desliga o ventilador inicialmente
  
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

  // Configurar rotas do servidor HTTP
  server.on("/api/fan", HTTP_POST, handleFanControl);
  server.on("/api/fan", HTTP_GET, getFanStatus);
  
  // Iniciar o servidor HTTP
  server.begin();
  Serial.println("Servidor HTTP iniciado na porta 80");
  
  // Test server connection
  testServerConnection();
}

// Função para lidar com controle do ventilador
void handleFanControl() {
  String message = "";
  bool newFanState = false;
  bool validCommand = false;
  
  if (server.hasArg("plain")) {
    message = server.arg("plain");
    
    // Analisar o JSON recebido
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error) {
      if (doc.containsKey("value")) {
        String command = doc["value"];
        if (command == "on") {
          newFanState = true;
          validCommand = true;
        } else if (command == "off") {
          newFanState = false;
          validCommand = true;
        }
      }
    }
  }
  
  if (validCommand) {
    // Atualizar o estado do ventilador
    fanState = newFanState;
    digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
    
    StaticJsonDocument<100> response;
    response["success"] = true;
    response["fan_state"] = fanState ? "on" : "off";
    
    String responseJson;
    serializeJson(response, responseJson);
    
    server.send(200, "application/json", responseJson);
    Serial.print("Ventilador ");
    Serial.println(fanState ? "LIGADO" : "DESLIGADO");
  } else {
    // Comando inválido
    server.send(400, "application/json", "{\"error\":\"Comando inválido. Use {\\\"value\\\":\\\"on\\\"} ou {\\\"value\\\":\\\"off\\\"}\"}");
  }
}

// Função para obter o status atual do ventilador
void getFanStatus() {
  StaticJsonDocument<100> response;
  response["fan_state"] = fanState ? "on" : "off";
  
  String responseJson;
  serializeJson(response, responseJson);
  
  server.send(200, "application/json", responseJson);
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
  // Handle HTTP requests
  server.handleClient();
  
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
  doc["fan_state"] = fanState ? "on" : "off"; // Incluir estado atual do ventilador
  
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