import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Configuração do simulador
const PORT = 3001;
const UPDATE_INTERVAL = 5000; // Intervalo para gerar novos dados (5 segundos)

// Estado inicial do simulador
let simulatorState = {
  fanState: false,
  temperature: 25.0,
  humidity: 60.0,
  pressure: 1013.25,
  altitude: 540.0,
  timestamp: Date.now(),
  sensor: 'BME280 (Simulado)'
};

// Criar aplicação Express
const app = express();

// Middleware
app.use(cors()); // Permitir CORS para integração com frontend
app.use(bodyParser.json());

// Endpoint para obter o estado atual do ventilador
app.get('/api/fan', (req, res) => {
  console.log('[Simulador] Solicitação GET para /api/fan');
  res.json({
    fan_state: simulatorState.fanState ? 'on' : 'off'
  });
});

// Endpoint para controlar o ventilador
app.post('/api/fan', (req, res) => {
  const command = req.body;
  
  console.log('[Simulador] Solicitação POST para /api/fan:', command);
  
  if (command && command.value) {
    if (command.value === 'on') {
      simulatorState.fanState = true;
      console.log('[Simulador] Ventilador LIGADO');
    } else if (command.value === 'off') {
      simulatorState.fanState = false;
      console.log('[Simulador] Ventilador DESLIGADO');
    } else {
      return res.status(400).json({
        error: 'Comando inválido. Use {"value":"on"} ou {"value":"off"}'
      });
    }
    
    res.json({
      success: true,
      fan_state: simulatorState.fanState ? 'on' : 'off'
    });
  } else {
    res.status(400).json({
      error: 'Formato inválido. Use {"value":"on"} ou {"value":"off"}'
    });
  }
});

// Endpoint para obter todos os dados do sensor
app.get('/api/sensor', (req, res) => {
  console.log('[Simulador] Solicitação para obter dados do sensor');
  res.json({
    temperature: simulatorState.temperature,
    humidity: simulatorState.humidity,
    pressure: simulatorState.pressure,
    altitude: simulatorState.altitude,
    fan_state: simulatorState.fanState ? 'on' : 'off',
    timestamp: simulatorState.timestamp,
    sensor: simulatorState.sensor
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[Simulador ESP32] Servidor rodando em http://localhost:${PORT}`);
  console.log('[Simulador ESP32] Endpoints disponíveis:');
  console.log(`  - GET  http://localhost:${PORT}/api/fan`);
  console.log(`  - POST http://localhost:${PORT}/api/fan`);
  console.log(`  - GET  http://localhost:${PORT}/api/sensor`);
  console.log('\nUse os seguintes comandos para testar:');
  console.log(`  - curl http://localhost:${PORT}/api/fan`);
  console.log(`  - curl -X POST -H "Content-Type: application/json" -d '{"value":"on"}' http://localhost:${PORT}/api/fan`);
  console.log(`  - curl -X POST -H "Content-Type: application/json" -d '{"value":"off"}' http://localhost:${PORT}/api/fan`);
  
  // Iniciar simulação de dados
  startDataSimulation();
});

// Função para simular alterações nos dados do sensor
function startDataSimulation() {
  console.log('[Simulador] Iniciando simulação de dados do sensor');
  
  setInterval(() => {
    // Simular flutuações na temperatura (±1°C)
    simulatorState.temperature = simulatorState.temperature + (Math.random() * 2 - 1) * 0.5;
    // Manter temperatura dentro de limites razoáveis
    simulatorState.temperature = Math.max(15, Math.min(35, simulatorState.temperature));
    
    // Simular flutuações na umidade (±2%)
    simulatorState.humidity = simulatorState.humidity + (Math.random() * 2 - 1) * 2;
    // Manter umidade dentro de limites razoáveis
    simulatorState.humidity = Math.max(30, Math.min(90, simulatorState.humidity));
    
    // Simular pequenas flutuações na pressão
    simulatorState.pressure = simulatorState.pressure + (Math.random() * 2 - 1) * 0.2;
    
    // Atualizar timestamp
    simulatorState.timestamp = Date.now();
    
    // Efeito do ventilador na temperatura (quando ligado)
    if (simulatorState.fanState && simulatorState.temperature > 22) {
      // O ventilador faz a temperatura cair mais rapidamente
      simulatorState.temperature -= 0.2;
    }
    
    // Exibir dados atualizados no console
    console.log('[Simulador] Dados atualizados:');
    console.log(`  - Temperatura: ${simulatorState.temperature.toFixed(1)}°C`);
    console.log(`  - Umidade: ${simulatorState.humidity.toFixed(1)}%`);
    console.log(`  - Pressão: ${simulatorState.pressure.toFixed(1)} hPa`);
    console.log(`  - Ventilador: ${simulatorState.fanState ? 'LIGADO' : 'DESLIGADO'}`);
  }, UPDATE_INTERVAL);
} 