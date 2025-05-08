// Simulador de dados de sensores BME280 com diferentes padrões
import fetch from "node-fetch"

// ==========================================
// CONFIGURAÇÃO DO SERVIDOR - ALTERE AQUI
// ==========================================

// URL do servidor (altere para o endereço do seu servidor)
const SERVER_URL = "http://localhost:3000/api/temperature"

// Temperatura limite para ativar o ventilador automaticamente (em Celsius)
const FAN_TEMPERATURE_THRESHOLD = 25.0

// ==========================================
// FIM DA CONFIGURAÇÃO DO SERVIDOR
// ==========================================

// Estado do ventilador
let fanState = false
let autoControl = true // Controle automático ativado por padrão

// Base values for different sensors
const BASE_TEMP = 25      // Temperatura base (°C)
const BASE_HUMIDITY = 50  // Umidade base (%)
const BASE_PRESSURE = 1013.25  // Pressão base (hPa)
const BASE_ALTITUDE = 800      // Altitude base (m)

// Variation ranges
const TEMP_VARIATION = 5     // Variação máxima de temperatura
const HUMIDITY_VARIATION = 10  // Variação máxima de umidade
const PRESSURE_VARIATION = 5    // Variação máxima de pressão
const ALTITUDE_VARIATION = 10   // Variação máxima de altitude

// Current values
let currentTemp = BASE_TEMP
let currentHumidity = BASE_HUMIDITY
let currentPressure = BASE_PRESSURE
let currentAltitude = BASE_ALTITUDE

// Padrões de simulação
const PATTERNS = {
  NORMAL: "NORMAL",    // Variação aleatória suave
  RISING: "RISING",    // Valores subindo
  FALLING: "FALLING",  // Valores caindo
  STABLE: "STABLE",    // Valores estáveis com pequenas variações
}

let currentPattern = PATTERNS.NORMAL
let patternDuration = 0
const MAX_PATTERN_DURATION = 10 // Duração máxima de cada padrão em ciclos

// Função para controlar o ventilador com base na temperatura
function checkTemperatureAndControlFan(temperature) {
  if (!autoControl) {
    return // Não faz nada se o controle automático estiver desativado
  }
  
  const oldFanState = fanState
  
  if (temperature > FAN_TEMPERATURE_THRESHOLD) {
    // Ativar o ventilador se temperatura acima do limite
    fanState = true
  } else {
    // Desativar o ventilador se temperatura abaixo do limite
    fanState = false
  }
  
  // Exibir mensagem apenas se o estado do ventilador mudou
  if (oldFanState !== fanState) {
    console.log(`[Auto] Ventilador ${fanState ? 'LIGADO' : 'DESLIGADO'} - Temperatura: ${temperature.toFixed(1)}°C (limite: ${FAN_TEMPERATURE_THRESHOLD}°C)`)
  }
  
  // Efeito do ventilador na temperatura (quando ligado)
  if (fanState && temperature > 22) {
    // O ventilador faz a temperatura cair um pouco mais rápido
    currentTemp -= 0.2
  }
}

function getNextSensorValues() {
  // Decide se é hora de mudar o padrão
  if (patternDuration >= MAX_PATTERN_DURATION) {
    const patterns = Object.values(PATTERNS)
    currentPattern = patterns[Math.floor(Math.random() * patterns.length)]
    patternDuration = 0
    console.log(`\nMudando para padrão: ${currentPattern}`)
  }

  // Calcula os próximos valores baseados no padrão atual
  switch (currentPattern) {
    case PATTERNS.RISING:
      currentTemp += 0.5 + Math.random() * 0.5
      currentHumidity += 1 + Math.random() * 0.5
      currentPressure += 0.5 + Math.random() * 0.2
      currentAltitude -= 0.5 + Math.random() * 0.5 // Altitude diminui quando pressão aumenta
      break
    case PATTERNS.FALLING:
      currentTemp -= 0.5 + Math.random() * 0.5
      currentHumidity -= 1 + Math.random() * 0.5
      currentPressure -= 0.5 + Math.random() * 0.2
      currentAltitude += 0.5 + Math.random() * 0.5 // Altitude aumenta quando pressão diminui
      break
    case PATTERNS.STABLE:
      currentTemp += (Math.random() - 0.5) * 0.2
      currentHumidity += (Math.random() - 0.5) * 0.5
      currentPressure += (Math.random() - 0.5) * 0.1
      currentAltitude += (Math.random() - 0.5) * 0.2
      break
    case PATTERNS.NORMAL:
    default:
      currentTemp += (Math.random() - 0.5) * 2
      currentHumidity += (Math.random() - 0.5) * 4
      currentPressure += (Math.random() - 0.5) * 1
      currentAltitude += (Math.random() - 0.5) * 2
  }

  // Mantém os valores dentro dos limites realistas
  currentTemp = Math.max(BASE_TEMP - TEMP_VARIATION, Math.min(BASE_TEMP + TEMP_VARIATION, currentTemp))
  currentHumidity = Math.max(20, Math.min(90, currentHumidity)) // Umidade entre 20% e 90%
  currentPressure = Math.max(BASE_PRESSURE - PRESSURE_VARIATION, Math.min(BASE_PRESSURE + PRESSURE_VARIATION, currentPressure))
  currentAltitude = Math.max(BASE_ALTITUDE - ALTITUDE_VARIATION, Math.min(BASE_ALTITUDE + ALTITUDE_VARIATION, currentAltitude))
  
  patternDuration++

  // Verificar temperatura e controlar ventilador
  checkTemperatureAndControlFan(currentTemp)

  return {
    temperature: Number(currentTemp.toFixed(1)),
    humidity: Number(currentHumidity.toFixed(1)),
    pressure: Number(currentPressure.toFixed(1)),
    altitude: Number(currentAltitude.toFixed(1)),
    fan_state: fanState ? "on" : "off",
    auto_control: autoControl
  }
}

async function sendSensorData() {
  const sensorData = getNextSensorValues()

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...sensorData,
        sensor: "BME280 (Simulado)",
        timestamp: Date.now(),
      }),
    })

    const data = await response.json()
    console.log(
      `[${currentPattern}] Temp: ${sensorData.temperature}°C | Humidity: ${sensorData.humidity}% | ` +
      `Pressure: ${sensorData.pressure}hPa | Fan: ${sensorData.fan_state} | ` +
      `Auto: ${sensorData.auto_control ? "sim" : "não"} (${patternDuration}/${MAX_PATTERN_DURATION})`
    )
  } catch (error) {
    console.error("Erro ao enviar dados do sensor:", error)
  }
}

console.log("Iniciando simulação de sensor BME280...")
console.log(`Temperatura base: ${BASE_TEMP}°C (±${TEMP_VARIATION}°C)`)
console.log(`Umidade base: ${BASE_HUMIDITY}% (±${HUMIDITY_VARIATION}%)`)
console.log(`Pressão base: ${BASE_PRESSURE}hPa (±${PRESSURE_VARIATION}hPa)`)
console.log(`Altitude base: ${BASE_ALTITUDE}m (±${ALTITUDE_VARIATION}m)`)
console.log(`Temperatura limite para ativação do ventilador: ${FAN_TEMPERATURE_THRESHOLD}°C`)
console.log("Padrões disponíveis:", Object.values(PATTERNS).join(", "))
console.log("\nEnviando dados...")

// Envia dados a cada 5 segundos
sendSensorData()
setInterval(sendSensorData, 5000)
