document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const currentTempElement = document.getElementById("current-temp")
  const currentHumidityElement = document.getElementById("current-humidity")
  const currentPressureElement = document.getElementById("current-pressure")
  const currentAltitudeElement = document.getElementById("current-altitude")
  const lastUpdatedElement = document.getElementById("last-updated")
  const noDataMessage = document.getElementById("no-data-message")
  const refreshButton = document.getElementById("refresh-data")

  // Initialize WebSocket connection
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  const socket = new WebSocket(wsUrl);
  
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
          backgroundColor: "rgba(255, 225, 53, 0.7)",
          borderColor: "rgba(255, 255, 0, 1)",
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: "#000000",
          pointBorderColor: "#FFFF00",
          pointBorderWidth: 3,
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
            color: "#FF3800"
          },
          ticks: {
            maxRotation: 0,
            maxTicksLimit: 8,
            color: "#FFFF00"
          },
        },
        y: {
          beginAtZero: false,
          suggestedMin: 10,
          suggestedMax: 40,
          ticks: {
            stepSize: 5,
            color: "#FFFF00"
          },
          grid: {
            color: "rgba(255, 255, 0, 0.3)"
          }
        },
      },
      plugins: {
        legend: {
          display: false,
          labels: {
            color: "#FFFF00",
            font: {
              family: "'Arcane Nine', sans-serif",
              size: 14
            }
          }
        },
        tooltip: {
          backgroundColor: "#912147",
          titleColor: "#FFFF00",
          bodyColor: "#ffffff",
          borderColor: "#FFFF00",
          borderWidth: 2,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y}°C`,
          },
          titleFont: {
            family: "'Arcane Nine', sans-serif"
          },
          bodyFont: {
            family: "'Arcane Nine', sans-serif"
          }
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
  
  // Initialize the all sensors chart
  const allSensorsCtx = document.getElementById("all-sensors-chart").getContext("2d")
  const allSensorsChart = new Chart(allSensorsCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          backgroundColor: "rgba(255, 255, 0, 0.2)",
          borderColor: "#FFFF00",
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#000000",
          pointBorderColor: "#FFFF00",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: "Humidity (%)",
          data: [],
          backgroundColor: "rgba(0, 255, 255, 0.2)",
          borderColor: "#00FFFF",
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#501028",
          pointBorderColor: "#00FFFF",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: "Pressure (hPa)",
          data: [],
          backgroundColor: "rgba(251, 219, 147, 0.2)",
          borderColor: "#FBDB93",
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#501028",
          pointBorderColor: "#FBDB93",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y1'
        },
        {
          label: "Altitude (m)",
          data: [],
          backgroundColor: "rgba(238, 130, 238, 0.2)",
          borderColor: "#EE82EE",
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#501028",
          pointBorderColor: "#EE82EE",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y2'
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false,
            color: "#FF3800"
          },
          ticks: {
            maxRotation: 0,
            maxTicksLimit: 8,
            color: "#FFFF00"
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperature (°C) / Humidity (%)',
            color: "#FFFF00",
            font: {
              family: "'Arcane Nine', sans-serif"
            }
          },
          grid: {
            display: true,
            color: "rgba(255, 255, 0, 0.3)"
          },
          ticks: {
            color: "#FFFF00"
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Pressure (hPa)',
            color: "#FBDB93",
            font: {
              family: "'Arcane Nine', sans-serif"
            }
          },
          grid: {
            display: false,
          },
          ticks: {
            color: "#FBDB93"
          }
        },
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Altitude (m)',
            color: "#EE82EE",
            font: {
              family: "'Arcane Nine', sans-serif"
            }
          },
          grid: {
            display: false,
          },
          ticks: {
            color: "#EE82EE"
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: "#FFFF00",
            font: {
              family: "'Arcane Nine', sans-serif",
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: "#912147",
          titleColor: "#FFFF00",
          bodyColor: "#ffffff",
          borderColor: "#FFFF00",
          borderWidth: 2,
          titleFont: {
            family: "'Arcane Nine', sans-serif"
          },
          bodyFont: {
            family: "'Arcane Nine', sans-serif"
          }
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

  // Show no-data message if no data received after 10 seconds
  setTimeout(() => {
    if (temperatureChart.data.datasets[0].data.length === 0) {
      noDataMessage.style.display = "block"
    }
  }, 10000)

  // Refresh button handler
  refreshButton.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "request-data" }));
    noDataMessage.style.display = "none"
  })

  // WebSocket event handlers
  socket.onopen = () => {
    console.log("WebSocket connected to:", wsUrl);
    socket.send(JSON.stringify({ type: "request-data" }));
  };

  socket.onclose = (event) => {
    console.log("WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = (event) => {
    try {
      console.log("Received raw message:", event.data);
      const data = JSON.parse(event.data);
      console.log("Parsed data:", data);
      
      if (data.type === "sensor-update") {
        console.log("Processing sensor update:", data);
        updateSensorReadings(data);
        addDataPoint(data);
      } else if (data.type === "sensor-history") {
        console.log("Processing sensor history with", data.data ? data.data.length : 0, "entries");
        updateSensorHistory(data.data);
      } else {
        console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing message:", error, "Raw data:", event.data);
    }
  };

  // Update sensor readings display with error handling
  function updateSensorReadings(data) {
    try {
      console.log("Updating sensor displays with:", data);
      
      if (!data) {
        console.warn("Invalid sensor data: null or undefined");
        return;
      }
      
      // Temperature
      if (typeof data.temperature === "number" && !isNaN(data.temperature)) {
        currentTempElement.textContent = data.temperature.toFixed(1);
      } else {
        console.warn("Invalid temperature value:", data.temperature);
      }
      
      // Humidity
      if (typeof data.humidity === "number" && !isNaN(data.humidity)) {
        currentHumidityElement.textContent = data.humidity.toFixed(1);
      } else {
        console.warn("Invalid humidity value:", data.humidity);
      }
      
      // Pressure
      if (typeof data.pressure === "number" && !isNaN(data.pressure)) {
        currentPressureElement.textContent = data.pressure.toFixed(1);
      } else {
        console.warn("Invalid pressure value:", data.pressure);
      }
      
      // Altitude
      if (typeof data.altitude === "number" && !isNaN(data.altitude)) {
        currentAltitudeElement.textContent = data.altitude.toFixed(1);
      } else {
        console.warn("Invalid altitude value:", data.altitude);
      }
      
      // Last updated timestamp
      if (data.timestamp) {
        lastUpdatedElement.textContent = formatTimestamp(data.timestamp);
      } else {
        console.warn("Missing timestamp in data");
        lastUpdatedElement.textContent = formatTimestamp(Date.now());
      }
      
      // Hide no-data message if it's visible
      if (noDataMessage.style.display !== "none") {
        noDataMessage.style.display = "none";
      }
    } catch (error) {
      console.error("Error updating sensor displays:", error);
    }
  }

  // Add robust error handling for chart updates
  function addDataPoint(data) {
    try {
      console.log("Adding data point to charts:", data);
      
      if (!data) {
        console.warn("Invalid data point: null or undefined");
        return;
      }
      
      if (typeof data.temperature !== "number" || isNaN(data.temperature)) {
        console.warn("Invalid temperature for chart:", data.temperature);
        return;
      }
      
      if (!data.timestamp) {
        console.warn("Missing timestamp for chart data point");
        return;
      }

      const time = formatTimeLabel(data.timestamp);

      // Update temperature chart
      temperatureChart.data.labels.push(time);
      temperatureChart.data.datasets[0].data.push(data.temperature);

      // Keep only the last 20 data points for temperature chart
      if (temperatureChart.data.labels.length > 20) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
      }

      temperatureChart.update();
      
      // Update all sensors chart
      allSensorsChart.data.labels.push(time);
      allSensorsChart.data.datasets[0].data.push(data.temperature);
      
      // Only add humidity if it's valid
      if (typeof data.humidity === "number" && !isNaN(data.humidity)) {
        allSensorsChart.data.datasets[1].data.push(data.humidity);
      } else {
        allSensorsChart.data.datasets[1].data.push(null); // Add null to maintain alignment
      }
      
      // Only add pressure if it's valid
      if (typeof data.pressure === "number" && !isNaN(data.pressure)) {
        allSensorsChart.data.datasets[2].data.push(data.pressure);
      } else {
        allSensorsChart.data.datasets[2].data.push(null);
      }
      
      // Only add altitude if it's valid
      if (typeof data.altitude === "number" && !isNaN(data.altitude)) {
        allSensorsChart.data.datasets[3].data.push(data.altitude);
      } else {
        allSensorsChart.data.datasets[3].data.push(null);
      }
      
      // Keep only the last 20 data points for all sensors chart
      if (allSensorsChart.data.labels.length > 20) {
        allSensorsChart.data.labels.shift();
        allSensorsChart.data.datasets.forEach(dataset => {
          if (dataset.data.length > 20) {
            dataset.data.shift();
          }
        });
      }
      
      allSensorsChart.update();
    } catch (error) {
      console.error("Error adding data point:", error);
    }
  }

  // Update sensor history
  function updateSensorHistory(data) {
    console.log("Updating chart with data:", data)

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No sensor history data available")
      return
    }

    // Clear existing data on temperature chart
    temperatureChart.data.labels = []
    temperatureChart.data.datasets[0].data = []
    
    // Clear existing data on all sensors chart
    allSensorsChart.data.labels = []
    allSensorsChart.data.datasets.forEach(dataset => {
      dataset.data = []
    })

    // Add all history data
    data.forEach((reading) => {
      if (reading && typeof reading.temperature === "number" && reading.timestamp) {
        const timeLabel = formatTimeLabel(reading.timestamp)
        
        // Update temperature chart
        temperatureChart.data.labels.push(timeLabel)
        temperatureChart.data.datasets[0].data.push(reading.temperature)
        
        // Update all sensors chart
        allSensorsChart.data.labels.push(timeLabel)
        allSensorsChart.data.datasets[0].data.push(reading.temperature)
        allSensorsChart.data.datasets[1].data.push(reading.humidity)
        allSensorsChart.data.datasets[2].data.push(reading.pressure)
        allSensorsChart.data.datasets[3].data.push(reading.altitude)
      } else {
        console.warn("Invalid reading in history data:", reading)
      }
    })

    // Update charts with animation
    temperatureChart.update()
    allSensorsChart.update()

    // Update sensor displays if we have data
    if (data.length > 0) {
      updateSensorReadings(data[data.length - 1])
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
