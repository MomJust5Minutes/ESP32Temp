#include <Arduino.h>
#include <SPIFFS.h>
#include <WiFi.h>

// Path to config file
const char* configFile = "/config.env";

// Buffer for serial input
String inputBuffer = "";
bool inputComplete = false;

void setup() {
  Serial.begin(115200);
  
  // Wait for serial connection
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("\n\n==== ESP32 Configuration Manager ====");
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("Failed to mount SPIFFS. Formatting...");
    SPIFFS.format();
    if (!SPIFFS.begin()) {
      Serial.println("Failed to mount SPIFFS even after formatting!");
      while (1) { delay(1000); }
    }
  }
  
  // Check if config file exists
  if (SPIFFS.exists(configFile)) {
    Serial.println("\nCurrent configuration:");
    printCurrentConfig();
  } else {
    Serial.println("\nNo configuration file found. Creating default...");
    createDefaultConfig();
    Serial.println("\nDefault configuration created:");
    printCurrentConfig();
  }
  
  printMenu();
}

void loop() {
  // Check for serial input
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    // If newline, set the flag
    if (inChar == '\n' || inChar == '\r') {
      if (inputBuffer.length() > 0) {
        inputComplete = true;
      }
    } else {
      // Add character to input buffer
      inputBuffer += inChar;
    }
  }
  
  // Process complete input
  if (inputComplete) {
    processCommand(inputBuffer);
    inputBuffer = "";
    inputComplete = false;
  }
}

void printMenu() {
  Serial.println("\n==== Menu ====");
  Serial.println("1 - Show current configuration");
  Serial.println("2 - Update WiFi SSID");
  Serial.println("3 - Update WiFi Password");
  Serial.println("4 - Update Server URL");
  Serial.println("5 - Test WiFi connection with current settings");
  Serial.println("6 - Reset to default configuration");
  Serial.println("7 - Help");
  Serial.print("\nEnter choice (1-7): ");
}

void processCommand(String command) {
  command.trim();
  
  if (command == "1") {
    Serial.println("\nCurrent configuration:");
    printCurrentConfig();
  } else if (command == "2") {
    updateWifiSSID();
  } else if (command == "3") {
    updateWifiPassword();
  } else if (command == "4") {
    updateServerUrl();
  } else if (command == "5") {
    testWifiConnection();
  } else if (command == "6") {
    resetToDefault();
  } else if (command == "7") {
    printHelp();
  } else {
    Serial.println("Invalid command. Please try again.");
  }
  
  printMenu();
}

void printCurrentConfig() {
  if (!SPIFFS.exists(configFile)) {
    Serial.println("No configuration file found!");
    return;
  }
  
  File file = SPIFFS.open(configFile, "r");
  if (!file) {
    Serial.println("Failed to open config file");
    return;
  }
  
  Serial.println("--------------------------");
  while (file.available()) {
    String line = file.readStringUntil('\n');
    Serial.println(line);
  }
  Serial.println("--------------------------");
  
  file.close();
}

bool updateConfig(String key, String value) {
  // Read all lines from the config file
  File file = SPIFFS.open(configFile, "r");
  if (!file) {
    Serial.println("Failed to open config file for reading");
    return false;
  }
  
  // Store all lines
  String lines[10]; // Assume max 10 lines
  int lineCount = 0;
  
  while (file.available() && lineCount < 10) {
    lines[lineCount] = file.readStringUntil('\n');
    lineCount++;
  }
  
  file.close();
  
  // Update the line with the specified key
  bool found = false;
  for (int i = 0; i < lineCount; i++) {
    String line = lines[i];
    if (line.startsWith(key + "=") || line.startsWith(key + " =")) {
      lines[i] = key + "=\"" + value + "\"";
      found = true;
      break;
    }
  }
  
  // Write the updated content back to the file
  file = SPIFFS.open(configFile, "w");
  if (!file) {
    Serial.println("Failed to open config file for writing");
    return false;
  }
  
  for (int i = 0; i < lineCount; i++) {
    file.println(lines[i]);
  }
  
  // If the key wasn't found, add it
  if (!found) {
    file.println(key + "=\"" + value + "\"");
  }
  
  file.close();
  return true;
}

void updateWifiSSID() {
  Serial.print("\nEnter new WiFi SSID: ");
  while (!inputComplete) {
    // Wait for input
    while (Serial.available()) {
      char inChar = (char)Serial.read();
      
      // If newline, set the flag
      if (inChar == '\n' || inChar == '\r') {
        if (inputBuffer.length() > 0) {
          inputComplete = true;
        }
      } else {
        // Add character to input buffer
        inputBuffer += inChar;
      }
    }
  }
  
  String ssid = inputBuffer;
  inputBuffer = "";
  inputComplete = false;
  
  if (updateConfig("WIFI_SSID", ssid)) {
    Serial.println("WiFi SSID updated successfully!");
  } else {
    Serial.println("Failed to update WiFi SSID");
  }
}

void updateWifiPassword() {
  Serial.print("\nEnter new WiFi Password: ");
  while (!inputComplete) {
    // Wait for input
    while (Serial.available()) {
      char inChar = (char)Serial.read();
      
      // If newline, set the flag
      if (inChar == '\n' || inChar == '\r') {
        if (inputBuffer.length() > 0) {
          inputComplete = true;
        }
      } else {
        // Add character to input buffer
        inputBuffer += inChar;
      }
    }
  }
  
  String password = inputBuffer;
  inputBuffer = "";
  inputComplete = false;
  
  if (updateConfig("WIFI_PASSWORD", password)) {
    Serial.println("WiFi Password updated successfully!");
  } else {
    Serial.println("Failed to update WiFi Password");
  }
}

void updateServerUrl() {
  Serial.print("\nEnter new Server URL: ");
  while (!inputComplete) {
    // Wait for input
    while (Serial.available()) {
      char inChar = (char)Serial.read();
      
      // If newline, set the flag
      if (inChar == '\n' || inChar == '\r') {
        if (inputBuffer.length() > 0) {
          inputComplete = true;
        }
      } else {
        // Add character to input buffer
        inputBuffer += inChar;
      }
    }
  }
  
  String url = inputBuffer;
  inputBuffer = "";
  inputComplete = false;
  
  if (updateConfig("SERVER_URL", url)) {
    Serial.println("Server URL updated successfully!");
  } else {
    Serial.println("Failed to update Server URL");
  }
}

void testWifiConnection() {
  Serial.println("\nTesting WiFi connection with current settings...");
  
  // Read current WiFi settings
  String ssid = "", password = "";
  
  if (!SPIFFS.exists(configFile)) {
    Serial.println("No configuration file found!");
    return;
  }
  
  File file = SPIFFS.open(configFile, "r");
  if (!file) {
    Serial.println("Failed to open config file");
    return;
  }
  
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    
    // Skip empty lines and comments
    if (line.length() == 0 || line.startsWith("#")) {
      continue;
    }
    
    int separatorPos = line.indexOf('=');
    if (separatorPos <= 0) {
      continue;
    }
    
    String key = line.substring(0, separatorPos);
    key.trim();
    
    String value = line.substring(separatorPos + 1);
    value.trim();
    
    // Remove quotes if present
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = value.substring(1, value.length() - 1);
    }
    
    if (key == "WIFI_SSID") {
      ssid = value;
    } else if (key == "WIFI_PASSWORD") {
      password = value;
    }
  }
  
  file.close();
  
  if (ssid == "" || ssid == "COLOQUE_SEU_SSID_AQUI") {
    Serial.println("SSID not configured! Please update WiFi SSID first.");
    return;
  }
  
  // Disconnect if already connected
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    delay(1000);
  }
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid.c_str(), password.c_str());
  
  // Wait for connection with timeout
  int timeout = 20; // 20 seconds timeout
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(1000);
    Serial.print(".");
    timeout--;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect!");
    Serial.print("Status code: ");
    Serial.println(WiFi.status());
    
    // Print status code meaning
    switch (WiFi.status()) {
      case WL_IDLE_STATUS:
        Serial.println("WiFi is in process of changing status");
        break;
      case WL_NO_SSID_AVAIL:
        Serial.println("SSID not available");
        break;
      case WL_CONNECT_FAILED:
        Serial.println("Connection failed");
        break;
      case WL_CONNECTION_LOST:
        Serial.println("Connection lost");
        break;
      case WL_DISCONNECTED:
        Serial.println("Disconnected");
        break;
      default:
        Serial.println("Unknown status");
        break;
    }
  }
  
  // Disconnect after test
  WiFi.disconnect();
  Serial.println("WiFi disconnected after test");
}

void resetToDefault() {
  Serial.println("\nResetting to default configuration...");
  createDefaultConfig();
  Serial.println("Default configuration restored:");
  printCurrentConfig();
}

void createDefaultConfig() {
  File file = SPIFFS.open(configFile, "w");
  if (!file) {
    Serial.println("Failed to create config file");
    return;
  }
  
  // Write default configuration
  file.println("# WiFi Configuration");
  file.println("WIFI_SSID=\"COLOQUE_SEU_SSID_AQUI\"");
  file.println("WIFI_PASSWORD=\"COLOQUE_SUA_SENHA_AQUI\"");
  file.println("");
  file.println("# Server Configuration");
  file.println("SERVER_URL=\"http://SEU_IP_SERVIDOR:3001/api/temperature\"");
  
  file.close();
}

void printHelp() {
  Serial.println("\n==== Help ====");
  Serial.println("This tool helps you manage the configuration for your ESP32 temperature sensor.");
  Serial.println("");
  Serial.println("1. Show current configuration - Displays the current settings");
  Serial.println("2. Update WiFi SSID - Change the name of your WiFi network");
  Serial.println("3. Update WiFi Password - Change your WiFi password");
  Serial.println("4. Update Server URL - Change the server address (format: http://IP:PORT/api/temperature)");
  Serial.println("5. Test WiFi connection - Tests if your ESP32 can connect to WiFi with current settings");
  Serial.println("6. Reset to default - Resets all settings to default values");
  Serial.println("7. Help - Displays this help message");
  Serial.println("");
  Serial.println("After making changes, you can flash your ESP32 with your main program");
  Serial.println("(DHT11, BME280, or LM35DZ) and it will use these settings automatically.");
} 