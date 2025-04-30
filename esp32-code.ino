#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Configurações do WiFi
const char* ssid = "SUA_REDE_WIFI";      // Substitua pelo nome da sua rede WiFi
const char* password = "SUA_SENHA_WIFI";  // Substitua pela senha da sua rede WiFi

// Configurações do servidor
const char* serverUrl = "http://172.20.10.11:3001/api/temperature";  // IP do seu computador na rede local

// Configuração do sensor DHT11
#define DHTPIN 4       // Pino digital conectado ao DHT11
#define DHTTYPE DHT11  // Tipo do sensor (DHT11)
DHT dht(DHTPIN, DHTTYPE);

// Variáveis de tempo
unsigned long lastTime = 0;
unsigned long timerDelay = 5000;  // Intervalo de 5 segundos entre as leituras

void setup() {
  Serial.begin(115200);
  delay(1000); // Aguarda a inicialização da serial
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("Sensor DHT11 iniciado!");
  
  // Conecta ao WiFi
  WiFi.mode(WIFI_STA); // Configura explicitamente como station mode
  WiFi.begin(ssid, password);
  Serial.println("\nConectando ao WiFi...");
  
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) { // Timeout após 20 tentativas
    delay(500);
    Serial.print(".");
    tentativas++;
    
    // A cada 5 tentativas, mostra o status
    if (tentativas % 5 == 0) {
      Serial.println();
      Serial.print("Status WiFi: ");
      switch(WiFi.status()) {
        case WL_NO_SHIELD: Serial.println("Nenhum shield WiFi encontrado"); break;
        case WL_IDLE_STATUS: Serial.println("Idle"); break;
        case WL_NO_SSID_AVAIL: Serial.println("SSID não encontrado"); break;
        case WL_SCAN_COMPLETED: Serial.println("Scan completo"); break;
        case WL_CONNECT_FAILED: Serial.println("Falha na conexão"); break;
        case WL_CONNECTION_LOST: Serial.println("Conexão perdida"); break;
        case WL_DISCONNECTED: Serial.println("Desconectado"); break;
        default: Serial.println("Status desconhecido");
      }
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConexão WiFi estabelecida!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Força do sinal (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nFalha ao conectar ao WiFi!");
    Serial.println("Reiniciando o ESP32...");
    delay(2000);
    ESP.restart();
  }
}

void loop() {
  // Verifica se é hora de fazer uma nova leitura
  if ((millis() - lastTime) > timerDelay) {
    // Verifica a conexão WiFi
    if (WiFi.status() == WL_CONNECTED) {
      float temperature = dht.readTemperature();
      
      // Verifica se a leitura foi bem-sucedida
      if (isnan(temperature)) {
        Serial.println("Falha ao ler o sensor DHT11!");
      } else {
        Serial.print("Temperatura: ");
        Serial.print(temperature);
        Serial.println("°C");
        
        // Envia os dados para o servidor
        sendTemperatureData(temperature);
      }
    } else {
      Serial.println("WiFi Desconectado");
      // Tenta reconectar
      WiFi.reconnect();
    }
    lastTime = millis();
  }
}

void sendTemperatureData(float temperature) {
  HTTPClient http;
  
  // Inicia a conexão com o servidor
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Cria o JSON com os dados
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  // Envia a requisição POST
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode > 0) {
    Serial.print("Resposta HTTP: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.print("Erro no envio: ");
    Serial.println(httpResponseCode);
  }
  
  // Libera os recursos
  http.end();
}
