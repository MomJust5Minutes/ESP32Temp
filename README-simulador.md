# Simulador de ESP32 com BME280 e Controle de Ventilador

Este simulador permite testar a interface web e os comandos de controle do ventilador sem precisar de hardware real. O simulador cria um servidor HTTP local que simula os endpoints do ESP32.

## Requisitos

Para executar este simulador, você precisa ter o Node.js instalado. Se ainda não tiver, baixe e instale o Node.js de [nodejs.org](https://nodejs.org/).

## Instalação

1. Instale as dependências necessárias executando o seguinte comando no terminal:

```bash
npm install express cors body-parser
```

## Como executar o simulador

1. Abra um terminal na pasta do projeto
2. Execute o simulador com o comando:

```bash
node esp32-simulator.js
```

> **Nota:** Este simulador usa módulos ES6 (com sintaxe import/export) em vez de CommonJS (require). Se encontrar erros relacionados a módulos, verifique se seu arquivo package.json contém `"type": "module"`.

3. Você verá uma mensagem indicando que o simulador está rodando em http://localhost:3001

## Testando o simulador

Há três maneiras de testar o simulador:

### 1. Usando a página de teste HTML

1. Abra o arquivo `teste-simulador.html` em um navegador web
2. A página se conectará automaticamente ao simulador e exibirá os dados
3. Use os botões "Ligar Ventilador" e "Desligar Ventilador" para controlar o ventilador simulado

### 2. Usando comandos curl

Para verificar o estado do ventilador:
```bash
curl http://localhost:3001/api/fan
```

Para ligar o ventilador:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"value":"on"}' http://localhost:3001/api/fan
```

Para desligar o ventilador:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"value":"off"}' http://localhost:3001/api/fan
```

Para obter todos os dados do sensor:
```bash
curl http://localhost:3001/api/sensor
```

### 3. Integrando com a aplicação web

1. Abra o arquivo `public/app.js` e localize a função `sendFanCommand`
2. Modifique a função para usar o endpoint HTTP do simulador
3. Você pode usar o arquivo `fan-control-example.js` como referência, substituindo `SEU_IP_DO_ESP32` por `localhost:3001`

## Comportamento do simulador

- O simulador gera dados aleatórios de temperatura, umidade e pressão a cada 5 segundos
- Quando o ventilador está ligado, a temperatura simulada diminui gradualmente
- Todas as requisições são registradas no console do terminal

## Personalizando o simulador

Você pode ajustar os seguintes parâmetros no início do arquivo `esp32-simulator.js`:

- `PORT`: A porta em que o servidor será executado (padrão: 3001)
- `UPDATE_INTERVAL`: O intervalo para atualização dos dados simulados (padrão: 5000ms)
- Os valores iniciais de temperatura, umidade, pressão e altitude

## Resolução de problemas

- **Erro "require is not defined"**: O projeto está configurado para usar módulos ES6. O simulador já está usando a sintaxe de importação correta (import/export).
- **Erro "EADDRINUSE"**: A porta 3001 já está em uso. Mude a constante `PORT` no arquivo do simulador.
- **Erro de conexão na página web**: Verifique se o simulador está rodando e se não há bloqueios de CORS no navegador.
- **Comandos não funcionam**: Verifique o formato correto do JSON nos comandos. 