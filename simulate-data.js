// Run this script to simulate temperature data for testing
import fetch from "node-fetch"

const SERVER_URL = "http://localhost:3000/api/temperature"
const MIN_TEMP = 20
const MAX_TEMP = 30

function getRandomTemperature() {
  return MIN_TEMP + Math.random() * (MAX_TEMP - MIN_TEMP)
}

async function sendTemperature() {
  const temperature = getRandomTemperature()

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature: Number.parseFloat(temperature.toFixed(1)),
        timestamp: Date.now(),
      }),
    })

    const data = await response.json()
    console.log(`Sent temperature: ${temperature.toFixed(1)}°C - Response:`, data)
  } catch (error) {
    console.error("Error sending temperature:", error)
  }
}

// Send temperature data every 5 seconds
console.log("Starting temperature simulation...")
sendTemperature()
setInterval(sendTemperature, 5000)
