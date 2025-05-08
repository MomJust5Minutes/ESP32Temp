// Este é um exemplo de como modificar a função sendFanCommand
// para usar HTTP em vez de WebSockets para controlar o ventilador no ESP32

// Substitua a função sendFanCommand no arquivo app.js 
// pela versão abaixo para usar comunicação HTTP em vez de WebSockets

function sendFanCommand(isOn) {
  // Obter o endereço IP do ESP32
  // Idealmente, este IP deveria ser configurável ou descoberto automaticamente
  const espIpAddress = "SEU_IP_DO_ESP32"; // Substitua pelo IP real do seu ESP32
  const fanApiUrl = `http://${espIpAddress}/api/fan`;
  
  // Preparar os dados para enviar
  const data = {
    value: isOn ? "on" : "off"
  };
  
  // Enviar requisição HTTP POST para o ESP32
  fetch(fanApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Resposta do ESP32:', data);
    // Aqui você pode atualizar a interface com base na resposta, se necessário
  })
  .catch(error => {
    console.error('Erro ao controlar ventilador:', error);
    // Exibir mensagem de erro para o usuário, se necessário
  });
}

// Função para verificar o estado atual do ventilador
function getFanStatus() {
  const espIpAddress = "SEU_IP_DO_ESP32"; // Substitua pelo IP real do seu ESP32
  const fanApiUrl = `http://${espIpAddress}/api/fan`;
  
  fetch(fanApiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Estado atual do ventilador:', data);
      // Atualizar interface com o estado atual do ventilador
      if (data && data.fan_state !== undefined) {
        const isFanActive = data.fan_state === "on";
        
        // Assumindo que você tem os mesmos elementos da sua aplicação original
        const fanToggle = document.getElementById("fan-toggle");
        const fanIcon = document.getElementById("fan-icon");
        const fanStatus = document.getElementById("fan-status");
        
        if (fanToggle) fanToggle.checked = isFanActive;
        
        if (isFanActive) {
          if (fanIcon) fanIcon.classList.add("active");
          if (fanStatus) {
            fanStatus.classList.add("active");
            fanStatus.textContent = "Ligado";
          }
        } else {
          if (fanIcon) fanIcon.classList.remove("active");
          if (fanStatus) {
            fanStatus.classList.remove("active");
            fanStatus.textContent = "Desligado";
          }
        }
      }
    })
    .catch(error => {
      console.error('Erro ao obter estado do ventilador:', error);
    });
}

// Exemplo de como inicializar a verificação periódica do estado do ventilador
// Chame esta função ao carregar a página
function initFanStatusCheck() {
  // Verificar estado inicial
  getFanStatus();
  
  // Verificar a cada 10 segundos
  setInterval(getFanStatus, 10000);
}

// Adicione este evento quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  // Configurar evento de click para o interruptor do ventilador
  const fanToggle = document.getElementById("fan-toggle");
  if (fanToggle) {
    fanToggle.addEventListener("change", function() {
      const isOn = this.checked;
      sendFanCommand(isOn);
    });
  }
  
  // Iniciar verificação periódica
  initFanStatusCheck();
}); 