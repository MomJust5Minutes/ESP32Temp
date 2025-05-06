# Dashboard de Temperatura (&outros) ESP32

Um dashboard de monitoramento de temperatura em tempo real que exibe dados de um sensor de temperatura conectado a um microcontrolador ESP32. O sistema suporta vários tipos de sensores, incluindo DHT11, BME280 e LM35DZ, permitindo que você escolha o sensor que melhor atenda às suas necessidades.

## Funcionalidades

- Atualizações de temperatura em tempo real via WebSockets
- Gráfico visual de histórico de temperatura com até 20 leituras mais recentes
- Design responsivo para desktop e dispositivos móveis
- Indicador de status de conexão
- Suporte para vários tipos de sensores de temperatura (escolha um tipo de sensor por vez)
- Leituras opcionais de umidade, pressão e altitude (dependendo do sensor)
- Modo de simulação de dados para testes sem hardware físico
- Sistema de configuração via arquivo .env para fácil configuração do WiFi e servidor

## Pré-requisitos

### Requisitos do Servidor
- Node.js (v14 ou posterior)
- Gerenciador de pacotes NPM ou PNPM
- Conexão com a internet para configuração inicial (download de dependências)

### Requisitos de Hardware
- Placa de desenvolvimento ESP32
- UM dos seguintes sensores de temperatura (escolha com base em suas necessidades):
  - Sensor de temperatura e umidade DHT11
  - Sensor de temperatura, umidade, pressão e altitude BME280
  - Sensor de temperatura analógico LM35DZ
- Cabos jumper
- Protoboard (recomendado)
- Cabo Micro USB para programação e alimentação do ESP32

### Ferramentas de Desenvolvimento
- Arduino IDE (1.8.x ou posterior) com suporte à placa ESP32
- Navegador web (Chrome, Firefox, Edge ou Safari)

## Instalação

### Configuração do Servidor

1. Clone este repositório ou baixe e extraia o arquivo ZIP
   ```
   git clone https://github.com/MomJust5Minutes/ESP32Temp
   cd ESP32Temp
   ```

2. Execute o script de configuração automática:
   ```
   npm run setup
   ```
   Este script irá:
   - Criar um arquivo .env para configuração do servidor (se ainda não existir)
   - Instalar todas as dependências necessárias
   - Criar diretórios necessários
   - Fornecer instruções para os próximos passos

   Alternativamente, você pode instalar as dependências manualmente:
   ```
   npm install
   ```

3. (Opcional) Edite o arquivo .env na raiz do projeto para personalizar a porta do servidor:
   ```
   PORT=3001
   HOST=0.0.0.0
   ```

4. Inicie o servidor:
   ```
   npm run server
   ```
   ou usando o comando Node.js diretamente:
   ```
   node server.js
   ```

5. Uma vez em execução, o servidor exibirá:
   ```
   Server running on port 3001
   Server accessible at:
     http://192.168.1.100:3001
     WebSocket available at ws://192.168.1.100:3001/ws
   ```

6. Abra seu navegador e acesse a URL fornecida na saída do console

### Simulação de Dados (Opcional)

Se você ainda não tiver o hardware físico configurado, pode simular dados do sensor:

1. Em uma janela de terminal separada (com o servidor em execução):
   ```
   npm run simulate
   ```
   ou:
   ```
   node simulate-data.js
   ```

2. A simulação enviará dados de temperatura aleatórios com diferentes padrões (subindo, caindo, estável, normal) para o servidor

### Configuração do ESP32

#### Configuração via Interface de Configuração

Este projeto inclui um sistema de configuração via arquivo .env que elimina a necessidade de editar o código-fonte para configurar o WiFi e o endereço do servidor. Para usar este sistema:

1. Primeiro, faça o upload do sketch de configuração para o ESP32:
   - Abra o arquivo `lib/EnvConfig/EnvConfigManager.ino` no Arduino IDE
   - Faça o upload para o ESP32
   - Abra o Monitor Serial (configure para 115200 baud)

2. Você verá um menu de configuração:
   ```
   ==== ESP32 Configuration Manager ====
   
   Current configuration:
   --------------------------
   # WiFi Configuration
   WIFI_SSID="COLOQUE_SEU_SSID_AQUI"
   WIFI_PASSWORD="COLOQUE_SUA_SENHA_AQUI"
   
   # Server Configuration
   SERVER_URL="http://SEU_IP_SERVIDOR:3001/api/temperature"
   --------------------------
   
   ==== Menu ====
   1 - Show current configuration
   2 - Update WiFi SSID
   3 - Update WiFi Password
   4 - Update Server URL
   5 - Test WiFi connection with current settings
   6 - Reset to default configuration
   7 - Help
   
   Enter choice (1-7):
   ```

3. Use as opções do menu para configurar:
   - Opção 2: Configure o nome da sua rede WiFi
   - Opção 3: Configure a senha da sua rede WiFi
   - Opção 4: Configure o URL do servidor (ex: `http://192.168.0.100:3001/api/temperature`)
   - Opção 5: Teste se as configurações de WiFi estão corretas
   
4. Após configurar, carregue o sketch apropriado para o seu sensor (esp32-dht11.ino, esp32-bme280.ino ou esp32-lm35dz.ino)

5. O ESP32 usará automaticamente as configurações salvas, sem necessidade de modificar o código.

#### Configuração Manual (Método Alternativo)

Se preferir, você ainda pode configurar diretamente no código conforme instruções abaixo:

1. Abra o sketch do sensor que você está usando (esp32-dht11.ino, esp32-bme280.ino ou esp32-lm35dz.ino)

2. Localize a seção de configurações do usuário no início do arquivo:
   ```cpp
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
   ```

3. Substitua:
   - `COLOQUE_SEU_SSID_AQUI` pelo nome da sua rede WiFi
   - `COLOQUE_SUA_SENHA_AQUI` pela senha da sua rede WiFi
   - `SEU_IP_SERVIDOR` pelo endereço IP do computador onde o servidor está sendo executado
   
   Por exemplo:
   ```cpp
   const char* ssid = "MinhaRedeWiFi";
   const char* password = "MinhaS3nh@Segura";
   const char* serverUrl = "http://192.168.0.100:3001/api/temperature";
   ```

4. Salve o arquivo antes de fazer o upload para o ESP32

> **IMPORTANTE**: Nunca compartilhe o código com suas credenciais WiFi. Por segurança, sempre restaure os placeholders antes de compartilhar seu código.

#### Instalando as Bibliotecas Arduino Necessárias

1. Abra o Arduino IDE
2. Vá para **Sketch > Include Library > Manage Libraries**
3. Pesquise e instale as bibliotecas para seu sensor escolhido:
   - Para o sensor DHT11:
     - "DHT sensor library" da Adafruit
     - "Adafruit Unified Sensor" da Adafruit
   - Para o sensor BME280:
     - "Adafruit BME280 Library" da Adafruit
     - "Adafruit Unified Sensor" da Adafruit
   - Para todos os sketches do ESP32 (necessário independentemente da escolha do sensor):
     - "ArduinoJson" (versão 6.x ou posterior)

#### Instalando o Suporte à Placa ESP32

1. No Arduino IDE, vá para **File > Preferences**
2. Em "Additional Boards Manager URLs" adicione:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Vá para **Tools > Board > Boards Manager**
4. Pesquise por "esp32" e instale "ESP32 by Espressif Systems"

#### Conexões de Hardware

Escolha UMA das seguintes configurações de sensor:

##### Sensor DHT11
- Pino VCC para ESP32 3.3V
- Pino GND para ESP32 GND
- Pino DATA para ESP32 GPIO5 (D5) (configurável no código)

##### Sensor BME280 (Conexão I2C)
- Pino VCC para ESP32 3.3V
- Pino GND para ESP32 GND
- Pino SCL para ESP32 GPIO22 (D22)
- Pino SDA para ESP32 GPIO21 (D21)

##### Sensor LM35DZ
- Pino VCC para ESP32 3.3V
- Pino GND para ESP32 GND
- Pino de saída para ESP32 GPIO34 (D34) (entrada analógica)

#### Upload do Código para o ESP32

1. Escolha o sketch apropriado para seu sensor escolhido no diretório do projeto:
   - `esp32-dht11.ino` para o sensor DHT11
   - `esp32-bme280.ino` para o sensor BME280
   - `esp32-lm35dz.ino` para o sensor LM35DZ

2. Abra o sketch no Arduino IDE

3. Atualize as seguintes variáveis no código:
   - Credenciais WiFi:
     ```cpp
     const char* ssid = "SEU_SSID_WIFI";
     const char* password = "SUA_SENHA_WIFI";
     ```
   - URL do servidor (substitua pelo endereço IP do seu servidor):
     ```cpp
     const char* serverUrl = "http://IP_DO_SEU_SERVIDOR:3001/api/temperature";
     ```

4. Opcional: Ajuste o pino do sensor se necessário:
   - Para DHT11: `#define DHTPIN 5` (D5)
   - Para LM35DZ: `#define LM35PIN 34` (D34)
   - Para BME280, o endereço I2C pode ser 0x76 ou 0x77 (o código tenta ambos por padrão) (SCL = D21 & SDA = D22)

5. Selecione sua placa ESP32 no Arduino IDE:
   - Vá para **Tools > Board > ESP32 Arduino** e selecione o modelo específico da sua placa ESP32
   - Configure a porta correta em **Tools > Port**

6. Clique no botão Upload (ícone de seta para a direita) para compilar e enviar o código para seu ESP32

7. Após o upload, abra o Monitor Serial (**Tools > Serial Monitor**) e configure o baud rate para 115200 para ver informações de depuração

## Como Funciona

1. O ESP32 lê a temperatura (e outros dados dependendo do sensor escolhido) em intervalos regulares
2. Ele envia esses dados para o servidor Node.js via requisições HTTP POST em formato JSON
3. O servidor armazena os dados (últimas 20 leituras) e os transmite para todos os clientes conectados usando WebSockets
4. A interface web atualiza em tempo real para exibir as leituras atuais e o gráfico de histórico

## Solução de Problemas

### Problemas no Servidor
- Certifique-se de que o Node.js esteja instalado corretamente: `node --version`
- Verifique se todas as dependências estão instaladas: `npm install`
- Verifique se o servidor está em execução e acessível a partir da sua rede
- Se o servidor mostrar "Address already in use", outro processo está usando a porta 3001. Você pode encerrar esse processo ou alterar a porta no server.js

### Problemas de Conexão do ESP32
- Verifique se as credenciais WiFi estão corretas
- Certifique-se de que o ESP32 e o servidor estão na mesma rede
- Verifique o Monitor Serial para mensagens de erro
- Verifique se a URL do servidor no código do ESP32 corresponde ao endereço IP real do seu servidor
- Use a função de teste de conexão no código do ESP32 para diagnosticar problemas de rede

### Problemas com o Sensor
- Verifique as conexões dos cabos
- Verifique se as bibliotecas apropriadas estão instaladas
- Para o BME280, verifique o endereço I2C (0x76 ou 0x77)
- Para o LM35DZ, verifique os valores de leitura analógica no Monitor Serial

### Problemas com a Configuração .env
- Se o ESP32 não estiver usando as configurações corretas, tente usar o gerenciador de configuração (EnvConfigManager.ino) para redefinir e reconfigurar
- Verifique se o sistema de arquivos SPIFFS está funcionando corretamente
- Se receber erros sobre SPIFFS, talvez seja necessário formatar a memória flash do ESP32 e tentar novamente
- Certifique-se de que o URL do servidor está no formato correto (http://IP:PORTA/api/temperature)

## Configurações Avançadas

### Alterando a Porta do Servidor
Edite o arquivo `server.js` e modifique o número da porta (padrão 3001):
```javascript
const PORT = process.env.PORT || 3001;
```

### Ajustando o Intervalo de Leitura do Sensor
Em cada sketch do ESP32, modifique a variável `timerDelay` (padrão 5000ms):
```cpp
unsigned long timerDelay = 5000; // Enviar leituras a cada 5 segundos
```

### Alterando o Caminho do WebSocket
Se necessário, modifique o caminho do WebSocket em `server.js`:
```javascript
const wss = new WebSocketServer({ 
  server,
  path: "/ws",
  clientTracking: true
})
```

## Licença

MIT

## Colaboradores

- Luigi Bertoli Menezes
- Beatriz Cupa Newman
- Julia Machado Duran

## Agradecimentos

- [Adafruit](https://www.adafruit.com/) por suas excelentes bibliotecas de sensores
- [ESP32 Community](https://www.espressif.com/) pelo suporte ao hardware e desenvolvimento
