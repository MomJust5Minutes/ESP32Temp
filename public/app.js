import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Connect to Socket.io server
  const socket = io()

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

  // Socket.io event handlers
  socket.on("connect", () => {
    updateConnectionStatus(true)
  })

  socket.on("disconnect", () => {
    updateConnectionStatus(false)
  })

  socket.on("temperature-update", (data) => {
    updateCurrentTemperature(data)
    addDataPoint(data)
  })

  socket.on("temperature-history", (data) => {
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

  // Update current temperature display
  function updateCurrentTemperature(data) {
    currentTempElement.textContent = data.temperature.toFixed(1)
    lastUpdatedElement.textContent = formatTimestamp(data.timestamp)
  }

  // Add a new data point to the chart
  function addDataPoint(data) {
    const time = formatTimeLabel(data.timestamp)

    temperatureChart.data.labels.push(time)
    temperatureChart.data.datasets[0].data.push(data.temperature)

    // Keep only the last 20 data points
    if (temperatureChart.data.labels.length > 20) {
      temperatureChart.data.labels.shift()
      temperatureChart.data.datasets[0].data.shift()
    }

    temperatureChart.update()
  }

  // Update temperature history
  function updateTemperatureHistory(data) {
    // Clear existing data
    temperatureChart.data.labels = []
    temperatureChart.data.datasets[0].data = []

    // Add all history data
    data.forEach((reading) => {
      temperatureChart.data.labels.push(formatTimeLabel(reading.timestamp))
      temperatureChart.data.datasets[0].data.push(reading.temperature)
    })

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
