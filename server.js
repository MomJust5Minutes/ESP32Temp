import express from "express"
import { createServer } from "http"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import cors from "cors"
import { WebSocketServer } from "ws"
import { WebSocket } from "ws"
import fs from "fs"
import os from "os"
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

// Get network interfaces to display server IP addresses
const getNetworkAddresses = () => {
  const interfaces = os.networkInterfaces()
  const addresses = []
  
  for (const iface in interfaces) {
    for (const details of interfaces[iface]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (details.family === 'IPv4' && !details.internal) {
        addresses.push(details.address)
      }
    }
  }
  
  return addresses
}

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Express app
const app = express()
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}))
app.use(express.json({ limit: '1mb' })) // Add size limit to prevent large payload attacks

// Serve static files from the public directory
app.use(express.static(join(__dirname, 'public')))

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'))
})

const server = createServer(app)
const wss = new WebSocketServer({ 
  server,
  path: "/ws",
  clientTracking: true
})

// Store sensor readings (last 20 readings)
const sensorReadings = []
const MAX_READINGS = 20

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Add a GET endpoint for testing connection
app.get("/api/temperature", (req, res) => {
  res.status(200).json({
    message: "Sensor API is working!",
    readings: sensorReadings,
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

// Route to receive sensor data from ESP32
app.post("/api/temperature", (req, res) => {
  try {
    const { temperature, humidity, pressure, altitude } = req.body
    
    if (temperature === undefined) {
      return res.status(400).json({ error: "Temperature data is required" })
    }
    
    // Validate temperature data
    const tempValue = parseFloat(temperature)
    if (isNaN(tempValue)) {
      return res.status(400).json({ error: "Temperature must be a valid number" })
    }
    
    // Optional: Add reasonable range validation
    if (tempValue < -50 || tempValue > 100) {
      return res.status(400).json({ error: "Temperature out of reasonable range (-50°C to 100°C)" })
    }

    // Create reading object with all sensor values
    const reading = {
      temperature: tempValue,
      humidity: parseFloat(humidity) || null,
      pressure: parseFloat(pressure) || null,
      altitude: parseFloat(altitude) || null,
      timestamp: Date.now(),
      type: "sensor-update"
    }

    sensorReadings.push(reading)
    if (sensorReadings.length > MAX_READINGS) {
      sensorReadings.shift()
    }

    // Send to all connected WebSocket clients
    let clientCount = 0
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(reading))
          clientCount++
        } catch (error) {
          console.error("Error sending data to WebSocket client:", error)
        }
      }
    })
    
    console.log(`Sensor update sent to ${clientCount} connected clients`)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error processing sensor data:", error)
    res.status(500).json({ error: "Server error processing sensor data" })
  }
})

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress
  console.log(`New WebSocket client connected from ${clientIp}`)
  
  // Set a timeout for the socket
  ws.setTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      console.log(`Client ${clientIp} connection timed out`)
      ws.terminate()
    }
  }, 10000) // 10 second timeout
  
  // Clear timeout once connected
  clearTimeout(ws.setTimeout)
  
  // Send reading history to new client
  try {
    ws.send(JSON.stringify({
      type: "sensor-history",
      data: sensorReadings
    }))
  } catch (error) {
    console.error("Error sending history to new client:", error)
  }

  // WebSocket error handling
  ws.on("error", (error) => {
    console.error(`WebSocket error from ${clientIp}:`, error)
  })

  ws.on("close", (code, reason) => {
    console.log(`Client ${clientIp} disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`)
  })

  // Handle messages from clients, including data requests
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)
      console.log(`Received message from client ${clientIp}:`, data)
      
      // Handle request for sensor data
      if (data.type === "request-data") {
        ws.send(JSON.stringify({
          type: "sensor-history",
          data: sensorReadings
        }))
      }
    } catch (error) {
      console.warn(`Received invalid JSON from client ${clientIp}`)
    }
  })

  // Ping/Pong to keep connection active
  ws.isAlive = true
  ws.on("pong", () => {
    ws.isAlive = true
  })
})

// Check for active connections periodically
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("Terminating inactive client")
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping((err) => {
      if (err) {
        console.error("Error sending ping:", err)
      }
    })
  })
}, 30000)

// Properly clean up interval when server closes
wss.on("close", () => {
  clearInterval(pingInterval)
})

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forcing server shutdown after timeout');
    process.exit(1);
  }, 5000);
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || "0.0.0.0"
server.listen(PORT, HOST, () => {
  const networkAddresses = getNetworkAddresses()
  console.log(`Server running on port ${PORT}`)
  
  if (networkAddresses.length > 0) {
    console.log("Server accessible at:")
    networkAddresses.forEach(ip => {
      console.log(`  http://${ip}:${PORT}`)
      console.log(`  WebSocket available at ws://${ip}:${PORT}/ws`)
    })
  } else {
    console.log(`Server accessible at http://localhost:${PORT}`)
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
  }
  
  console.log(`Server started at: ${new Date().toISOString()}`)
})
