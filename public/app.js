document.addEventListener("DOMContentLoaded", () => {
  // Configurações e constantes
  const AUTO_CONTROL_STORAGE_KEY = 'esp32_auto_control_enabled';
  let isFanActive = false;
  let isAutoControlActive = localStorage.getItem(AUTO_CONTROL_STORAGE_KEY) !== null 
    ? localStorage.getItem(AUTO_CONTROL_STORAGE_KEY) === 'true' 
    : true;
  
  // DOM elements - agrupados por funcionalidade
  const elements = {
    sensors: {
      temperature: document.getElementById("current-temp"),
      humidity: document.getElementById("current-humidity"),
      pressure: document.getElementById("current-pressure"),
      altitude: document.getElementById("current-altitude"),
      lastUpdated: document.getElementById("last-updated"),
      noData: document.getElementById("no-data-message")
    },
    controls: {
      fanToggle: document.getElementById("fan-toggle"),
      fanIcon: document.getElementById("fan-icon"),
      fanStatus: document.getElementById("fan-status"),
      autoStatus: document.getElementById("auto-status")
    },
    charts: {
      temperature: document.getElementById("temperature-chart").getContext("2d"),
      allSensors: document.getElementById("all-sensors-chart").getContext("2d")
    }
  };
  
  // Atualizar UI do controle automático
  const updateAutoControlUI = () => {
    const { autoStatus } = elements.controls;
    autoStatus.textContent = `Auto: ${isAutoControlActive ? "Ativado" : "Desativado"}`;
    isAutoControlActive ? autoStatus.classList.add("active") : autoStatus.classList.remove("active");
  };
  updateAutoControlUI();

  // WebSocket initialization
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
  
  // Helper para formatação de timestamps
  const formatTime = {
    forDisplay: timestamp => new Date(timestamp).toLocaleTimeString(),
    forChart: timestamp => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  
  // Configuração base para gráficos
  const chartConfig = {
    common: {
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, maxTicksLimit: 8 }
          }
        },
        interaction: { mode: "index", intersect: false },
        animation: { duration: 500 }
      }
    }
  };
  
  // Inicializar gráficos
  const temperatureChart = new Chart(elements.charts.temperature, {
    type: chartConfig.common.type,
    data: {
      labels: [],
      datasets: [{
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
        fill: true
      }]
    },
    options: {
      ...chartConfig.common.options,
      scales: {
        ...chartConfig.common.options.scales,
        y: {
          beginAtZero: false,
          suggestedMin: 10,
          suggestedMax: 40,
          ticks: { stepSize: 5 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#1e293b",
          bodyColor: "#1e293b",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          displayColors: false,
          callbacks: { label: context => `${context.parsed.y}°C` }
        }
      }
    }
  });
  
  const allSensorsChart = new Chart(elements.charts.allSensors, {
    type: chartConfig.common.type,
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
          fill: false,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      ...chartConfig.common.options,
      scales: {
        ...chartConfig.common.options.scales,
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Temperature (°C) / Humidity (%)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Pressure (hPa)' },
          grid: { display: false }
        },
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Altitude (m)' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#1e293b",
          bodyColor: "#1e293b",
          borderColor: "#e2e8f0",
          borderWidth: 1
        }
      }
    }
  });

  // WebSocket message handling functions
  const sendCommand = (type, value) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, value }));
    }
  };

  const updateSensorReadings = data => {
    if (!data) return;
    
    // Atualiza valores dos sensores se válidos
    const updateIfValid = (element, value) => {
      if (typeof value === "number" && !isNaN(value)) {
        element.textContent = value.toFixed(1);
      }
    };
    
    updateIfValid(elements.sensors.temperature, data.temperature);
    updateIfValid(elements.sensors.humidity, data.humidity);
    updateIfValid(elements.sensors.pressure, data.pressure);
    updateIfValid(elements.sensors.altitude, data.altitude);
    
    // Atualizar timestamp
    elements.sensors.lastUpdated.textContent = formatTime.forDisplay(data.timestamp || Date.now());
    
    // Esconder mensagem de ausência de dados
    elements.sensors.noData.style.display = "none";
    
    // Atualizar estado do ventilador
    updateFanState({...data, auto_control: data.command_response ? data.auto_control : undefined});
  };

  const updateFanState = data => {
    if (!data || data.fan_state === undefined) return;
    
    const { fanToggle, fanIcon, fanStatus } = elements.controls;
    
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
    
    // Atualizar estado do controle automático se resposta a um comando
    if (data.command_response && data.auto_control !== undefined) {
      isAutoControlActive = data.auto_control;
      localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
      updateAutoControlUI();
    }
  };

  const addDataPoint = data => {
    if (!data || typeof data.temperature !== "number" || isNaN(data.temperature) || !data.timestamp) return;
    
    const time = formatTime.forChart(data.timestamp);
    const updateChart = (chart, dataPoint) => {
      chart.data.labels.push(time);
      
      // Adicionar pontos de dados aos datasets
      if (Array.isArray(dataPoint)) {
        dataPoint.forEach((value, index) => {
          if (index < chart.data.datasets.length) {
            chart.data.datasets[index].data.push(value === undefined ? null : value);
          }
        });
      } else {
        chart.data.datasets[0].data.push(dataPoint);
      }
      
      // Manter apenas os últimos 20 pontos
      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
      }
      
      chart.update();
    };
    
    // Atualizar gráfico de temperatura
    updateChart(temperatureChart, data.temperature);
    
    // Atualizar gráfico de todos os sensores
    updateChart(allSensorsChart, [
      data.temperature,
      data.humidity,
      data.pressure,
      data.altitude
    ]);
  };

  const updateSensorHistory = data => {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Limpar dados existentes
    const clearChartData = chart => {
      chart.data.labels = [];
      chart.data.datasets.forEach(dataset => dataset.data = []);
    };
    
    clearChartData(temperatureChart);
    clearChartData(allSensorsChart);
    
    // Adicionar dados históricos
    data.forEach(reading => {
      if (reading && typeof reading.temperature === "number" && reading.timestamp) {
        const timeLabel = formatTime.forChart(reading.timestamp);
        
        // Gráfico de temperatura
        temperatureChart.data.labels.push(timeLabel);
        temperatureChart.data.datasets[0].data.push(reading.temperature);
        
        // Gráfico de todos os sensores
        allSensorsChart.data.labels.push(timeLabel);
        allSensorsChart.data.datasets[0].data.push(reading.temperature);
        allSensorsChart.data.datasets[1].data.push(reading.humidity);
        allSensorsChart.data.datasets[2].data.push(reading.pressure);
        allSensorsChart.data.datasets[3].data.push(reading.altitude);
      }
    });
    
    // Atualizar gráficos
    temperatureChart.update();
    allSensorsChart.update();
    
    // Atualizar exibição com dados mais recentes
    if (data.length > 0) {
      const latestData = {...data[data.length - 1]};
      delete latestData.auto_control;
      updateSensorReadings(latestData);
    }
  };

  // Event handlers
  const toggleFan = () => {
    if (isAutoControlActive) {
      isAutoControlActive = false;
      localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
      updateAutoControlUI();
      sendCommand("fan_control", "off");
    }
    
    isFanActive = elements.controls.fanToggle.checked;
    sendCommand("fan_control", isFanActive ? "on" : "off");
    
    updateFanState({fan_state: isFanActive ? "on" : "off"});
  };

  const toggleAutoControl = () => {
    isAutoControlActive = !isAutoControlActive;
    localStorage.setItem(AUTO_CONTROL_STORAGE_KEY, isAutoControlActive);
    updateAutoControlUI();
    sendCommand("fan_control", isAutoControlActive ? "auto" : (isFanActive ? "on" : "off"));
  };

  // WebSocket event handlers
  socket.onopen = () => {
    sendCommand("request-data");
    setTimeout(() => sendCommand("fan_control", isAutoControlActive ? "auto" : "off"), 1000);
  };

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === "sensor-update") {
        updateSensorReadings(data);
        addDataPoint(data);
      } else if (data.type === "sensor-history") {
        updateSensorHistory(data.data);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  // Event listeners
  elements.controls.fanToggle.addEventListener("change", toggleFan);
  elements.controls.autoStatus.addEventListener("click", toggleAutoControl);

  // Exibir mensagem se não houver dados após 10 segundos
  setTimeout(() => {
    if (temperatureChart.data.datasets[0].data.length === 0) {
      elements.sensors.noData.style.display = "block";
    }
  }, 10000);
});
