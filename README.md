# ESP32 Temperature Dashboard

A real-time temperature monitoring dashboard that displays data from a DHT11 sensor connected to an ESP32.

## Features

- Real-time temperature updates via WebSockets
- Visual temperature history chart
- Responsive design for desktop and mobile
- Connection status indicator

## Prerequisites

- Node.js (v14 or later)
- ESP32 development board
- DHT11 temperature sensor
- Arduino IDE with ESP32 board support

## Installation

1. Clone this repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start the server:
   \`\`\`
   npm start
   \`\`\`
4. Open your browser and navigate to `http://localhost:3000`

## ESP32 Setup

1. Connect the DHT11 sensor to your ESP32:
   - VCC to 3.3V
   - GND to GND
   - DATA to GPIO4 (or change the pin in the code)

2. Install the required Arduino libraries:
   - DHT sensor library by Adafruit
   - ArduinoJson
   - WiFi

3. Update the ESP32 code with your WiFi credentials and server IP address

4. Upload the code to your ESP32

## How It Works

1. The ESP32 reads temperature data from the DHT11 sensor
2. It sends this data to the Node.js server via HTTP POST requests
3. The server broadcasts the data to all connected clients using Socket.io
4. The web interface updates in real-time to display the current temperature and chart

## License

MIT
