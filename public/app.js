import { Chart } from "@/components/ui/chart"
import io from "socket.io-client" // Import socket.io-client

document.addEventListener("DOMContentLoaded", () => {
  // Connect to Socket.io server with explicit configuration
  const socket = io({
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  })

  // DOM elements
  const currentTempElement = document.getElementById("current-temp")
  const lastUpdatedElement = document.getElementById("last-updated")
  const statusDot = document.querySelector(".status-dot")
  const statusText = document.querySelector(".status-text")

  // Initialize Chart.js
  const ctx = document.getElementById("temperature-chart").getContext("2d")
  const temperatureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgba(59, 130, 246, 1)",
          pointBorderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            maxTicksLimit: 8,
          },
        },
        y: {
          beginAtZero: false,
          suggestedMin: 10,
          suggestedMax: 40,
          ticks: {
            stepSize: 5,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#1e293b",
          bodyColor: "#1e293b",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y}°C`,
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      animation: {
        duration: 500,
      },
    },
  })

  // Add this to your JavaScript
  const noDataMessage = document.getElementById("no-data-message")
  const refreshButton = document.getElementById("refresh-data")

  // Show no-data message if no data received after 10 seconds
  setTimeout(() => {
    if (temperatureChart.data.datasets[0].data.length === 0) {
      noDataMessage.style.display = "block"
    }
  }, 10000)

  // Refresh button handler
  refreshButton.addEventListener("click", () => {
    socket.emit("request-data")
    noDataMessage.style.display = "none"
  })

  // Debug connection status
  socket.on("connect", () => {
    console.log("Socket.io connected with ID:", socket.id)
    updateConnectionStatus(true)
    socket.emit("request-data")
  })

  socket.on("connect_error", (err) => {
    console.error("Socket.io connection error:", err)
    updateConnectionStatus(false)
  })

  socket.on("disconnect", () => {
    updateConnectionStatus(false)
  })

  socket.on("temperature-update", (data) => {
    console.log("Received temperature update:", data)
    updateCurrentTemperature(data)
    addDataPoint(data)
  })

  socket.on("temperature-history", (data) => {
    console.log("Received temperature history:", data)
    updateTemperatureHistory(data)
  })

  // Update connection status
  function updateConnectionStatus(connected) {
    if (connected) {
      statusDot.classList.add("connected")
      statusText.textContent = "Connected"
    } else {
      statusDot.classList.remove("connected")
      statusText.textContent = "Disconnected"
    }
  }

  // Update current temperature display with error handling
  function updateCurrentTemperature(data) {
    try {
      if (!data || typeof data.temperature !== "number") {
        console.warn("Invalid temperature data:", data)
        return
      }

      currentTempElement.textContent = data.temperature.toFixed(1)
      lastUpdatedElement.textContent = formatTimestamp(data.timestamp || Date.now())
    } catch (error) {
      console.error("Error updating temperature display:", error)
    }
  }

  // Add robust error handling for chart updates
  function addDataPoint(data) {
    try {
      if (!data || typeof data.temperature !== "number" || !data.timestamp) {
        console.warn("Invalid data point:", data)
        return
      }

      const time = formatTimeLabel(data.timestamp)

      temperatureChart.data.labels.push(time)
      temperatureChart.data.datasets[0].data.push(data.temperature)

      // Keep only the last 20 data points
      if (temperatureChart.data.labels.length > 20) {
        temperatureChart.data.labels.shift()
        temperatureChart.data.datasets[0].data.shift()
      }

      temperatureChart.update()
    } catch (error) {
      console.error("Error adding data point:", error)
    }
  }

  // Update temperature history
  function updateTemperatureHistory(data) {
    console.log("Updating chart with data:", data)

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No temperature history data available")
      return
    }

    // Clear existing data
    temperatureChart.data.labels = []
    temperatureChart.data.datasets[0].data = []

    // Add all history data
    data.forEach((reading) => {
      if (reading && typeof reading.temperature === "number" && reading.timestamp) {
        temperatureChart.data.labels.push(formatTimeLabel(reading.timestamp))
        temperatureChart.data.datasets[0].data.push(reading.temperature)
      } else {
        console.warn("Invalid reading in history data:", reading)
      }
    })

    // Update chart with animation
    temperatureChart.update()

    // Update current temperature if we have data
    if (data.length > 0) {
      updateCurrentTemperature(data[data.length - 1])
    }
  }

  // Format timestamp for display
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  // Format time label for chart
  function formatTimeLabel(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
})
