document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const currentTempElement = document.getElementById("current-temp")
  const currentHumidityElement = document.getElementById("current-humidity")
  const currentPressureElement = document.getElementById("current-pressure")
  const currentAltitudeElement = document.getElementById("current-altitude")
  const lastUpdatedElement = document.getElementById("last-updated")
  const noDataMessage = document.getElementById("no-data-message")
  const refreshButton = document.getElementById("refresh-data")
  const fanToggle = document.getElementById("fan-toggle")
  const fanIcon = document.getElementById("fan-icon")
  const fanStatus = document.getElementById("fan-status")
  const autoStatusBtn = document.getElementById("auto-status")

  // Chave para armazenar o estado no localStorage
  const AUTO_CONTROL_STORAGE_KEY = 'esp32_auto_control_enabled';

  // Estado inicial do ventilador
  let isFanActive = false;
  
  // Recuperar estado do controle automático do localStorage ou usar valor padrão (true)
  let isAutoControlActive = localStorage.getItem(AUTO_CONTROL_STORAGE_KEY) !== null 
    ? localStorage.getItem(AUTO_CONTROL_STORAGE_KEY) === 'true' 
    : true;
  
  // Atualizar a interface com o estado restaurado
  updateAutoControlUI();

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
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgba(59, 130, 246, 1)",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: "Humidity (%)",
          data: [],
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          borderColor: "rgb(6, 182, 212)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgb(6, 182, 212)",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: "Pressure (hPa)",
          data: [],
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderColor: "rgb(139, 92, 246)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgb(139, 92, 246)",
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y1'
        },
        {
          label: "Altitude (m)",
          data: [],
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderColor: "rgb(245, 158, 11)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgb(245, 158, 11)",
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
          },
          ticks: {
            maxRotation: 0,
            maxTicksLimit: 8,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperature (°C) / Humidity (%)'
          },
          grid: {
            display: true,
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Pressure (hPa)'
          },
          grid: {
            display: false,
          },
        },
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Altitude (m)'
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#1e293b",
          bodyColor: "#1e293b",
          borderColor: "#e2e8f0",
          borderWidth: 1,
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
    // Solicitar dados históricos
    socket.send(JSON.stringify({ type: "request-data" }));
    
    // Enviar preferência de controle automático
    setTimeout(() => {
      sendAutoControlCommand(isAutoControlActive);
    }, 1000); // Aguardar um segundo para garantir que os dados iniciais foram carregados
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

  // Função para controlar o ventilador
  function toggleFan() {
    // Se estiver no modo automático, desativar para permitir controle manual
    if (isAutoControlActive) {
      isAutoControlActive = false;
      // Salvar o estado no localStorage
      localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
      updateAutoControlUI();
      sendAutoControlCommand(false);
    }
    
    isFanActive = fanToggle.checked;
    
    if (isFanActive) {
      fanIcon.classList.add("active");
      fanStatus.classList.add("active");
      fanStatus.textContent = "Ligado";
      sendFanCommand(true);
    } else {
      fanIcon.classList.remove("active");
      fanStatus.classList.remove("active");
      fanStatus.textContent = "Desligado";
      sendFanCommand(false);
    }
  }

  // Nova função para ativar/desativar o modo automático
  function toggleAutoControl() {
    isAutoControlActive = !isAutoControlActive;
    // Salvar o estado no localStorage
    localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
    updateAutoControlUI();
    sendAutoControlCommand(isAutoControlActive);
  }

  // Atualizar a interface do controle automático
  function updateAutoControlUI() {
    if (isAutoControlActive) {
      autoStatusBtn.textContent = "Auto: Ativado";
      autoStatusBtn.classList.add("active");
    } else {
      autoStatusBtn.textContent = "Auto: Desativado";
      autoStatusBtn.classList.remove("active");
    }
  }

  // Função para enviar comandos do ventilador para o ESP32
  function sendFanCommand(isOn) {
    // Verificar se a conexão WebSocket está aberta
    if (socket.readyState === WebSocket.OPEN) {
      const command = {
        type: "fan_control",
        value: isOn ? "on" : "off"
      };
      
      socket.send(JSON.stringify(command));
      console.log(`Comando do ventilador enviado: ${isOn ? "Ligado" : "Desligado"}`);
    } else {
      console.error("WebSocket não está conectado. Não foi possível enviar o comando do ventilador.");
      // Opcionalmente, exibir uma mensagem ao usuário sobre falha na conexão
    }
  }

  // Função para enviar comando de controle automático
  function sendAutoControlCommand(isAuto) {
    // Verificar se a conexão WebSocket está aberta
    if (socket.readyState === WebSocket.OPEN) {
      const command = {
        type: "fan_control",
        value: isAuto ? "auto" : (isFanActive ? "on" : "off")
      };
      
      socket.send(JSON.stringify(command));
      console.log(`Comando de controle automático enviado: ${isAuto ? "Ativado" : "Desativado"}`);
    } else {
      console.error("WebSocket não está conectado. Não foi possível enviar o comando de controle automático.");
    }
  }

  // Event Listeners
  fanToggle.addEventListener("change", toggleFan);
  autoStatusBtn.addEventListener("click", toggleAutoControl);

  // Lógica para atualizar o estado do ventilador com base nos dados recebidos
  function updateFanState(data) {
    if (data && data.fan_state !== undefined) {
      // Atualizar somente o estado do ventilador
      isFanActive = data.fan_state === "on";
      fanToggle.checked = isFanActive;
      
      if (isFanActive) {
        fanIcon.classList.add("active");
        fanStatus.classList.add("active");
        fanStatus.textContent = "Ligado";
      } else {
        fanIcon.classList.remove("active");
        fanStatus.classList.remove("active");
        fanStatus.textContent = "Desligado";
      }
      
      // Somente atualizar o estado do controle automático se for uma resposta 
      // explícita a um comando de controle automático (não em atualizações regulares)
      if (data.command_response && data.auto_control !== undefined) {
        isAutoControlActive = data.auto_control;
        // Salvar o estado atualizado no localStorage
        localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
        updateAutoControlUI();
      }
    }
  }

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

      // Atualizar estado do ventilador, mas preservar preferência de controle automático
      // se não for uma resposta a um comando específico
      const updatedData = {...data};
      if (!updatedData.command_response) {
        delete updatedData.auto_control;
      }
      updateFanState(updatedData);
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

    // Update sensor displays if we have data, mas mantenha a preferência do modo automático
    if (data.length > 0) {
      const latestData = {...data[data.length - 1]};
      // Sobrescrever temporariamente o auto_control para não afetar a preferência do usuário
      delete latestData.auto_control;
      updateSensorReadings(latestData);
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
