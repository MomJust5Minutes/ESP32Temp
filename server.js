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

// Add proper error handling and logging
app.use(express.json({ strict: false }))

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
  console.log("Received temperature data:", req.body)

  // Ensure temperature is properly parsed as a number
  let temperature
  if (typeof req.body.temperature === "string") {
    temperature = Number.parseFloat(req.body.temperature)
  } else {
    temperature = req.body.temperature
  }

  const timestamp = req.body.timestamp || Date.now()

  if (temperature === undefined || isNaN(temperature)) {
    console.error("Invalid temperature data received:", req.body)
    return res.status(400).json({ error: "Temperature data is required and must be a number" })
  }

  // Add new reading
  const newReading = {
    temperature: temperature,
    timestamp: timestamp,
  }

  console.log("Processed reading:", newReading)
  temperatureReadings.push(newReading)

  // Keep only the last MAX_READINGS readings
  if (temperatureReadings.length > MAX_READINGS) {
    temperatureReadings.shift()
  }

  // Broadcast to all connected clients
  console.log("Emitting temperature-update event")
  io.emit("temperature-update", newReading)

  // Send all readings when requested
  console.log("Emitting temperature-history event")
  io.emit("temperature-history", temperatureReadings)

  res.status(200).json({ success: true })
})

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected")

  // Send temperature history to newly connected client
  socket.emit("temperature-history", temperatureReadings)

  socket.on("request-data", () => {
    socket.emit("temperature-history", temperatureReadings)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}, accessible at http://172.20.10.2:${PORT}`)
})
