// Simulador de dados de temperatura com diferentes padrões
import fetch from "node-fetch"

// Use the correct API endpoint
const SERVER_URL = "http://localhost:3001/api/temperature"
const BASE_TEMP = 25 // Temperatura base
const VARIATION = 5 // Variação máxima
let currentTemp = BASE_TEMP // Temperatura atual

// Padrões de simulação
const PATTERNS = {
  NORMAL: "NORMAL", // Variação aleatória suave
  RISING: "RISING", // Temperatura subindo
  FALLING: "FALLING", // Temperatura caindo
  STABLE: "STABLE", // Temperatura estável com pequenas variações
}

let currentPattern = PATTERNS.NORMAL
let patternDuration = 0
const MAX_PATTERN_DURATION = 10 // Duração máxima de cada padrão em ciclos

function getNextTemperature() {
  // Decide se é hora de mudar o padrão
  if (patternDuration >= MAX_PATTERN_DURATION) {
    const patterns = Object.values(PATTERNS)
    currentPattern = patterns[Math.floor(Math.random() * patterns.length)]
    patternDuration = 0
    console.log(`\nMudando para padrão: ${currentPattern}`)
  }

  // Calcula a próxima temperatura baseada no padrão atual
  switch (currentPattern) {
    case PATTERNS.RISING:
      currentTemp += 0.5 + Math.random() * 0.5
      break
    case PATTERNS.FALLING:
      currentTemp -= 0.5 + Math.random() * 0.5
      break
    case PATTERNS.STABLE:
      currentTemp += (Math.random() - 0.5) * 0.2
      break
    case PATTERNS.NORMAL:
    default:
      currentTemp += (Math.random() - 0.5) * 2
  }

  // Mantém a temperatura dentro dos limites realistas
  currentTemp = Math.max(BASE_TEMP - VARIATION, Math.min(BASE_TEMP + VARIATION, currentTemp))
  patternDuration++

  return Number(currentTemp.toFixed(1))
}

async function sendTemperature() {
  const temperature = getNextTemperature()

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature,
        timestamp: Date.now(),
      }),
    })

    const data = await response.json()
    console.log(
      `[${currentPattern}] Temperatura: ${temperature}°C (${patternDuration}/${MAX_PATTERN_DURATION})`
    )
  } catch (error) {
    console.error("Erro ao enviar temperatura:", error)
  }
}

console.log("Iniciando simulação de temperatura...")
console.log(`Temperatura base: ${BASE_TEMP}°C`)
console.log(`Variação máxima: ±${VARIATION}°C`)
console.log("Padrões disponíveis:", Object.values(PATTERNS).join(", "))
console.log("\nEnviando dados...")

// Envia temperatura a cada 5 segundos
sendTemperature()
setInterval(sendTemperature, 5000)
