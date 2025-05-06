#ifndef ENV_CONFIG_H
#define ENV_CONFIG_H

#include <Arduino.h>
#include <SPIFFS.h>

class EnvConfig {
  private:
    // Buffer to store values
    char ssidBuffer[32];
    char passwordBuffer[64];
    char serverUrlBuffer[128];
    
    // Default values
    const char* defaultSsid = "COLOQUE_SEU_SSID_AQUI";
    const char* defaultPassword = "COLOQUE_SUA_SENHA_AQUI";
    const char* defaultServerUrl = "http://SEU_IP_SERVIDOR:3001/api/temperature";
    
    // Path to config file
    const char* configFile = "/config.env";
    
    // Parse a line from the config file
    bool parseLine(const String& line, String& key, String& value) {
      int separatorPos = line.indexOf('=');
      if (separatorPos <= 0) {
        return false;
      }
      
      key = line.substring(0, separatorPos);
      key.trim();
      
      value = line.substring(separatorPos + 1);
      value.trim();
      
      // Remove quotes if present
      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.substring(1, value.length() - 1);
      }
      
      return true;
    }
    
  public:
    EnvConfig() {
      // Initialize with default values
      strncpy(ssidBuffer, defaultSsid, sizeof(ssidBuffer));
      strncpy(passwordBuffer, defaultPassword, sizeof(passwordBuffer));
      strncpy(serverUrlBuffer, defaultServerUrl, sizeof(serverUrlBuffer));
    }
    
    // Initialize SPIFFS
    bool begin() {
      if (!SPIFFS.begin(true)) {
        Serial.println("Failed to mount SPIFFS");
        return false;
      }
      return true;
    }
    
    // Load configuration from file
    bool load() {
      if (!SPIFFS.exists(configFile)) {
        Serial.println("Config file not found, using default values");
        return false;
      }
      
      File file = SPIFFS.open(configFile, "r");
      if (!file) {
        Serial.println("Failed to open config file");
        return false;
      }
      
      Serial.println("Reading configuration from file:");
      
      while (file.available()) {
        String line = file.readStringUntil('\n');
        line.trim();
        
        // Skip empty lines and comments
        if (line.length() == 0 || line.startsWith("#")) {
          continue;
        }
        
        String key, value;
        if (parseLine(line, key, value)) {
          if (key == "WIFI_SSID") {
            strncpy(ssidBuffer, value.c_str(), sizeof(ssidBuffer) - 1);
            Serial.println("WIFI_SSID loaded");
          } else if (key == "WIFI_PASSWORD") {
            strncpy(passwordBuffer, value.c_str(), sizeof(passwordBuffer) - 1);
            Serial.println("WIFI_PASSWORD loaded");
          } else if (key == "SERVER_URL") {
            strncpy(serverUrlBuffer, value.c_str(), sizeof(serverUrlBuffer) - 1);
            Serial.println("SERVER_URL loaded");
          }
        }
      }
      
      file.close();
      return true;
    }
    
    // Get SSID
    const char* getSSID() {
      return ssidBuffer;
    }
    
    // Get Password
    const char* getPassword() {
      return passwordBuffer;
    }
    
    // Get Server URL
    const char* getServerUrl() {
      return serverUrlBuffer;
    }
    
    // Create a default config file if it doesn't exist
    bool createDefaultConfig() {
      if (SPIFFS.exists(configFile)) {
        Serial.println("Config file already exists");
        return true;
      }
      
      File file = SPIFFS.open(configFile, "w");
      if (!file) {
        Serial.println("Failed to create config file");
        return false;
      }
      
      // Write default configuration
      file.println("# WiFi Configuration");
      file.println("WIFI_SSID=\"COLOQUE_SEU_SSID_AQUI\"");
      file.println("WIFI_PASSWORD=\"COLOQUE_SUA_SENHA_AQUI\"");
      file.println("");
      file.println("# Server Configuration");
      file.println("SERVER_URL=\"http://SEU_IP_SERVIDOR:3001/api/temperature\"");
      
      file.close();
      Serial.println("Default config file created");
      return true;
    }
};

#endif // ENV_CONFIG_H 