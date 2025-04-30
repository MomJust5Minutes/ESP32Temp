const express = require("express")
const app = express()

// Add this to your server.js file temporarily for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  if (req.method === "POST" && req.url === "/api/temperature") {
    console.log("Temperature data received:", req.body)
  }
  next()
})
