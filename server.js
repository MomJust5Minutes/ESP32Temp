import express from "express"
import { createServer } from "http"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import cors from "cors"
import { WebSocketServer } from "ws"
import { WebSocket } from "ws"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Express app
const app = express()
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}))
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ 
  server,
  path: "/ws",
  clientTracking: true
})

// Store temperature readings (last 20 readings)
const temperatureReadings = []
const MAX_READINGS = 20

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Add a GET endpoint for testing connection
app.get("/api/temperature", (req, res) => {
  res.status(200).json({
    message: "Temperature API is working!",
    readings: temperatureReadings,
    timestamp: Date.now(),
  })
})

// Add this near your other routes
app.get("/api/test", (req, res) => {
  res.status(200).json({
    message: "ESP32 connection test successful!",
    timestamp: Date.now(),
    status: "online",
  })
})

// Route to receive temperature data from ESP32
app.post("/api/temperature", (req, res) => {
  const { temperature } = req.body
  
  if (temperature === undefined) {
    return res.status(400).json({ error: "Temperature data is required" })
  }

  const reading = {
    temperature: parseFloat(temperature),
    timestamp: Date.now(),
    type: "temperature-update"
  }

  temperatureReadings.push(reading)
  if (temperatureReadings.length > MAX_READINGS) {
    temperatureReadings.shift()
  }

  // Enviar para todos os clientes WebSocket conectados
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(reading))
      } catch (error) {
        console.error("Erro ao enviar dados para cliente WebSocket:", error)
      }
    }
  })

  res.status(200).json({ success: true })
})

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  console.log("Novo cliente WebSocket conectado")
  console.log("Endereço IP:", req.socket.remoteAddress)
  
  // Enviar histórico de leituras para o novo cliente
  try {
    ws.send(JSON.stringify({
      type: "temperature-history",
      data: temperatureReadings
    }))
  } catch (error) {
    console.error("Erro ao enviar histórico para novo cliente:", error)
  }

  // Tratamento de erros do WebSocket
  ws.on("error", (error) => {
    console.error("Erro no WebSocket:", error)
  })

  ws.on("close", () => {
    console.log("Cliente WebSocket desconectado")
  })

  // Ping/Pong para manter a conexão ativa
  ws.isAlive = true
  ws.on("pong", () => {
    ws.isAlive = true
  })
})

// Verificação periódica de conexões ativas
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("Removendo cliente inativo")
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on("close", () => {
  clearInterval(interval)
})

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Erro no servidor:", err)
  res.status(500).json({ error: "Erro interno do servidor" })
})

// Start server
const PORT = 3001
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`WebSocket disponível em ws://localhost:${PORT}/ws`)
})
