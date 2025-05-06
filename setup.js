import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====================================");
console.log("ESP32 Temperature Dashboard Setup");
console.log("====================================");

// Check if .env file exists for the server
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log("Creating server .env file from template...");
  const templatePath = path.join(__dirname, 'server.env.template');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envPath);
    console.log("✅ Created .env file");
  } else {
    console.log("❌ Template file not found. Creating basic .env file...");
    fs.writeFileSync(envPath, "PORT=3001\nHOST=0.0.0.0\n");
    console.log("✅ Created basic .env file");
  }
} else {
  console.log("✅ Server .env file already exists");
}

// Install dependencies
console.log("\nInstalling dependencies...");
try {
  console.log("Running: npm install");
  execSync('npm install', { stdio: 'inherit' });
  console.log("✅ Dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  console.log("\nCreating public directory...");
  fs.mkdirSync(publicDir, { recursive: true });
  console.log("✅ Created public directory");
}

console.log("\n====================================");
console.log("Setup Complete!");
console.log("====================================");
console.log("\nTo start the server, run:");
console.log("npm run server");
console.log("\nTo simulate sensor data (optional), run in another terminal:");
console.log("npm run simulate");
console.log("\nFor ESP32 setup, please upload the configuration tool to your ESP32 first:");
console.log("1. Open lib/EnvConfig/EnvConfigManager.ino in Arduino IDE");
console.log("2. Upload to your ESP32");
console.log("3. Use the Serial Monitor to configure WiFi and server settings");
console.log("4. Then upload one of the sensor sketches (DHT11, BME280, or LM35DZ)");
console.log("\nHappy monitoring!"); 