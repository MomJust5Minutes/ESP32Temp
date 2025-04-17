import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Express app
const app = express()
const server = createServer(app)
const io = new Server(server)

// Store temperature readings (last 20 readings)
const temperatureReadings = []
const MAX_READINGS = 20

// Serve static files
app.use(express.static(join(__dirname, "public")))
app.use(express.json())

// Route to receive temperature data from ESP32
app.post("/api/temperature", (req, res) => {
  const { temperature, timestamp = Date.now() } = req.body

  if (temperature === undefined) {
    return res.status(400).json({ error: "Temperature data is required" })
  }

  // Add new reading
  const newReading = {
    temperature: Number.parseFloat(temperature),
    timestamp,
  }

  temperatureReadings.push(newReading)

  // Keep only the last MAX_READINGS readings
  if (temperatureReadings.length > MAX_READINGS) {
    temperatureReadings.shift()
  }

  // Broadcast to all connected clients
  io.emit("temperature-update", newReading)

  // Send all readings when requested
  io.emit("temperature-history", temperatureReadings)

  res.status(200).json({ success: true })
})

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected")

  // Send temperature history to newly connected client
  socket.emit("temperature-history", temperatureReadings)

  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
