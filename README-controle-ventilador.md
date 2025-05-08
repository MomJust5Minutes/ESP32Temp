# Controle de Ventilador com ESP32 e BME280

Este documento explica as modificações feitas para adicionar controle de ventilador ao projeto ESP32 com sensor BME280.

## Modificações no ESP32

O arquivo `esp32-bme280.ino` foi modificado para:

1. Controlar um ventilador conectado ao pino 5 do ESP32
2. Criar uma API HTTP para ligar/desligar o ventilador
3. Incluir o estado do ventilador no envio de dados de temperatura

### Endpoints da API

O ESP32 agora fornece os seguintes endpoints HTTP:

1. **GET /api/fan**: Retorna o estado atual do ventilador
   - Exemplo de resposta: `{"fan_state":"on"}` ou `{"fan_state":"off"}`

2. **POST /api/fan**: Liga ou desliga o ventilador
   - Corpo da requisição: `{"value":"on"}` ou `{"value":"off"}`
   - Exemplo de resposta: `{"success":true,"fan_state":"on"}`

## Integrando com a Interface Web

Para usar estas modificações com sua interface web, você tem duas opções:

### Opção 1: Continuar usando WebSockets (Recomendado)

Se você já tem um servidor WebSocket funcionando:

1. Modifique seu servidor Node.js para receber comandos via WebSocket
2. O servidor então faz requisições HTTP para o ESP32 quando recebe comandos de controle do ventilador

### Opção 2: Usar HTTP Diretamente

Se preferir não usar WebSockets:

1. Inclua o arquivo `fan-control-example.js` no seu projeto
2. Substitua as funções relacionadas ao ventilador no arquivo `app.js` com as versões do arquivo de exemplo
3. Substitua `SEU_IP_DO_ESP32` pelo endereço IP real do seu ESP32

## Conexão Física

1. Conecte um relé ou transistor para controlar o ventilador no pino 5 do ESP32
2. Certifique-se de usar um circuito de proteção apropriado (diodo, resistor, etc.)
3. Para ventiladores de 12V ou maior potência, use uma fonte de alimentação separada

## Resolução de Problemas

1. **Ventilador não liga/desliga**: 
   - Verifique o pino 5 com um multímetro
   - Verifique a conexão física do relé
   - Teste com o comando `curl -X POST -H "Content-Type: application/json" -d '{"value":"on"}' http://IP-DO-ESP32/api/fan`

2. **Não consegue acessar a API**:
   - Verifique se o ESP32 está conectado à rede
   - Tente acessar o endpoint via navegador: `http://IP-DO-ESP32/api/fan`
   - Verifique se há conflitos de porta ou firewall

3. **CORS errors**:
   - Se estiver tendo problemas com CORS ao acessar a API diretamente do navegador, você precisará configurar o ESP32 para suportar CORS ou usar um proxy no seu servidor 