# 🦆 Duckienator Control Center

Ein futuristisches Sci-Fi Drohnen-Kontrollraum-Dashboard zur Steuerung eines autonomen Miniatur-Fahrzeugs (Duckiebot) mit **Gemma 3 27B** KI-Modell über **MCP (Model Context Protocol)**.

**Live-Demo:** https://3000-i892bcr5izakzz4nadgfd-e3aaeef7.us1.manus.computer

---

## 🎮 Features

### Benutzeroberfläche
- **Dark-Mode Cyberpunk-Ästhetik** mit Neon-Gelb (#FFD000) und Orange-Rot (#FF4D00) Akzenten
- **Drei-Spalten-Layout**: Steuerung | Live-Kamera & Status | Terminal-Chat
- **Live-Kamera-Feed** mit HUD-Overlays (Scanlines, Grid, Crosshair)
- **Mini-Map** mit Gitter, aktuelle Position und Route
- **Terminal-ähnliches Chat-Interface** mit Zeitstempel und Sender-Farbcodierung

### Fahrmodi
1. **AUTONOM**: KI navigiert automatisch zu Zielposition
2. **HUMAN-LOOP**: Mensch trifft Entscheidungen bei Kreuzungen/Hindernissen
3. **RAGE MODE**: Alle Sicherheitsprotokolle deaktiviert, maximale Geschwindigkeit (mit visuellen Effekten)

### Steuerung
- **WASD-Tastatur-Steuerung** (Human-Loop Modus)
  - **W**: Vorwärts
  - **A**: Links
  - **S**: Rückwärts
  - **D**: Rechts
  - **Leertaste**: Stopp
  - **↑/↓**: Geschwindigkeit anpassen
- **Geschwindigkeitsregler** mit dynamischen Farbgradienten (Grün → Gelb → Rot)
- **Quick-Action Buttons**: LOS, STOPP, KAMERA AN/AUS, RESET

### Sensordaten (Live-Simulation)
- **SPEED**: Aktuelle Geschwindigkeit (cm/s)
- **BATTERY**: Akkustand (%)
- **MCP**: Verbindungsstatus und Latenz (ms)
- **TEMP**: Prozessor-Temperatur (°C)
- **YOLO v11**: Objekterkennungs-Status
- **GEMMA 3**: KI-Modell-Status

### Animationen & Effekte
- Screen-Shake bei RAGE MODE Aktivierung
- Pulsierender roter Border im RAGE MODE
- Glowing-Effekte bei Hover-Aktionen
- Terminal-Cursor-Blink im Chat-Input
- Fade-In Animationen für neue Chat-Nachrichten
- Scanline- und Grid-Effekte im Kamera-Feed

---

## 🚀 Installation & Setup

### Voraussetzungen
- **Node.js** 18+ und **pnpm** (oder npm/yarn)
- **Git**
- **Duckiebot** mit MCP-Server (optional für echte Integration)

### 1. Repository klonen

```bash
git clone https://github.com/YOUR_USERNAME/duckienator-control-center.git
cd duckienator-control-center
```

### 2. Abhängigkeiten installieren

```bash
pnpm install
# oder
npm install
```

### 3. Entwicklungsserver starten

```bash
pnpm dev
# oder
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

### 4. Produktions-Build erstellen

```bash
pnpm build
pnpm start
```

---

## 🔌 Integration mit Duckiebot

### Architektur-Übersicht

```
┌─────────────────────────────────────┐
│   Duckienator Control Center        │
│   (React Frontend - Diese App)      │
└────────────┬────────────────────────┘
             │ WebSocket / HTTP
             ↓
┌─────────────────────────────────────┐
│   Backend-Server (Node.js/Express)  │
│   - MCP Client                      │
│   - Duckiebot API Proxy             │
│   - Chat/Command Handler            │
└────────────┬────────────────────────┘
             │ MCP Protocol
             ↓
┌─────────────────────────────────────┐
│   Duckiebot MCP Server              │
│   (auf Duckiebot-Hardware)          │
│   - Motor Control                   │
│   - Camera Stream                   │
│   - Sensor Data                     │
└─────────────────────────────────────┘
```

### Schritt 1: Backend-Server vorbereiten

Erstelle eine `server/mcp-client.ts` Datei:

```typescript
import Anthropic from "@anthropic-ai/sdk";

interface MCPConfig {
  host: string;
  port: number;
  token?: string;
}

export class DuckiebotMCPClient {
  private client: Anthropic;
  private mcpConfig: MCPConfig;

  constructor(mcpConfig: MCPConfig) {
    this.mcpConfig = mcpConfig;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async sendCommand(command: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Du bist ein Duckiebot-Steuerungssystem. Führe diesen Befehl aus: ${command}`,
          },
        ],
      });

      return response.content[0].type === "text" ? response.content[0].text : "";
    } catch (error) {
      console.error("MCP Command Error:", error);
      throw error;
    }
  }

  async getMotorControl(
    direction: "forward" | "backward" | "left" | "right" | "stop",
    speed: number
  ): Promise<{ left_wheel: number; right_wheel: number }> {
    // Konvertiere Richtung und Geschwindigkeit in Motor-PWM-Werte
    const speedFactor = speed / 100;

    const motorMap: Record<
      string,
      { left: number; right: number }
    > = {
      forward: { left: speedFactor, right: speedFactor },
      backward: { left: -speedFactor, right: -speedFactor },
      left: { left: -speedFactor * 0.5, right: speedFactor },
      right: { left: speedFactor, right: -speedFactor * 0.5 },
      stop: { left: 0, right: 0 },
    };

    const motor = motorMap[direction] || motorMap["stop"];
    return {
      left_wheel: Math.max(-1, Math.min(1, motor.left)),
      right_wheel: Math.max(-1, Math.min(1, motor.right)),
    };
  }
}
```

### Schritt 2: Express-Routes für Duckiebot-Steuerung

Füge zu `server/index.ts` folgende Routes hinzu:

```typescript
import { DuckiebotMCPClient } from "./mcp-client";

const mcpClient = new DuckiebotMCPClient({
  host: process.env.DUCKIEBOT_HOST || "localhost",
  port: parseInt(process.env.DUCKIEBOT_PORT || "5000"),
});

// Motor-Steuerung
app.post("/api/duckiebot/move", async (req, res) => {
  try {
    const { direction, speed } = req.body;
    const motorControl = await mcpClient.getMotorControl(direction, speed);

    // Sende zu Duckiebot
    const response = await fetch(
      `http://${process.env.DUCKIEBOT_HOST}:${process.env.DUCKIEBOT_PORT}/motor`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(motorControl),
      }
    );

    res.json(await response.json());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Kamera-Stream
app.get("/api/duckiebot/camera", async (req, res) => {
  try {
    const response = await fetch(
      `http://${process.env.DUCKIEBOT_HOST}:${process.env.DUCKIEBOT_PORT}/camera/stream`
    );
    res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");
    response.body?.pipe(res);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Sensordaten
app.get("/api/duckiebot/sensors", async (req, res) => {
  try {
    const response = await fetch(
      `http://${process.env.DUCKIEBOT_HOST}:${process.env.DUCKIEBOT_PORT}/sensors`
    );
    res.json(await response.json());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// MCP Chat/Command
app.post("/api/duckiebot/command", async (req, res) => {
  try {
    const { command } = req.body;
    const result = await mcpClient.sendCommand(command);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
```

### Schritt 3: Frontend-Integration

Erstelle `client/src/lib/duckiebot-api.ts`:

```typescript
export class DuckiebotAPI {
  private baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  async move(
    direction: "forward" | "backward" | "left" | "right" | "stop",
    speed: number
  ): Promise<void> {
    await fetch(`${this.baseURL}/api/duckiebot/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, speed }),
    });
  }

  async getSensorData(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/duckiebot/sensors`);
    return response.json();
  }

  async sendCommand(command: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/duckiebot/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = await response.json();
    return data.result;
  }

  async getCameraStream(): Promise<string> {
    return `${this.baseURL}/api/duckiebot/camera`;
  }
}

export const duckiebotAPI = new DuckiebotAPI();
```

### Schritt 4: KeyboardController mit API verbinden

Aktualisiere `client/src/components/KeyboardController.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { duckiebotAPI } from '@/lib/duckiebot-api';

interface KeyboardControllerProps {
  enabled: boolean;
  onMovement: (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => void;
  onSpeedChange: (speed: number) => void;
  currentSpeed: number;
}

export default function KeyboardController({
  enabled,
  onMovement,
  onSpeedChange,
  currentSpeed
}: KeyboardControllerProps) {
  // ... existing code ...

  useEffect(() => {
    if (!enabled || direction === 'stop') return;

    // Sende Bewegungsbefehl zum Duckiebot
    duckiebotAPI.move(direction, currentSpeed).catch(error => {
      console.error('Movement command failed:', error);
    });
  }, [direction, currentSpeed, enabled]);

  // ... rest of component ...
}
```

### Schritt 5: Umgebungsvariablen konfigurieren

Erstelle `.env.local`:

```bash
# Duckiebot Hardware
DUCKIEBOT_HOST=192.168.1.100
DUCKIEBOT_PORT=5000

# Anthropic API (für Gemma 3 27B über Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 📡 Duckiebot MCP Server Setup

Auf dem Duckiebot selbst muss ein MCP-Server laufen:

### Installation auf Duckiebot

```bash
# SSH zum Duckiebot
ssh duckiebot@duckiebot.local

# Node.js installieren (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MCP Server Repository klonen
git clone https://github.com/YOUR_USERNAME/duckiebot-mcp-server.git
cd duckiebot-mcp-server

# Abhängigkeiten installieren
npm install

# Server starten
npm start
```

### MCP Server Beispiel-Struktur

```typescript
// server.ts
import express from 'express';
import { Motor } from './hardware/motor';
import { Camera } from './hardware/camera';
import { Sensors } from './hardware/sensors';

const app = express();
const motor = new Motor();
const camera = new Camera();
const sensors = new Sensors();

// Motor-Steuerung
app.post('/motor', express.json(), (req, res) => {
  const { left_wheel, right_wheel } = req.body;
  motor.setSpeed(left_wheel, right_wheel);
  res.json({ status: 'ok' });
});

// Kamera-Stream
app.get('/camera/stream', (req, res) => {
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
  camera.streamTo(res);
});

// Sensordaten
app.get('/sensors', (req, res) => {
  res.json({
    battery: sensors.getBatteryLevel(),
    temperature: sensors.getTemperature(),
    distance: sensors.getDistanceSensor(),
    imu: sensors.getIMU()
  });
});

app.listen(5000, () => {
  console.log('Duckiebot MCP Server running on port 5000');
});
```

---

## 🎮 WASD-Steuerung verwenden

1. **Wechsle zu HUMAN-LOOP Modus** in der linken Kontrollpanel
2. **Drücke WASD-Tasten**:
   - **W** = Vorwärts fahren
   - **A** = Nach links fahren
   - **S** = Rückwärts fahren
   - **D** = Nach rechts fahren
   - **Leertaste** = Stoppen
   - **↑** = Geschwindigkeit erhöhen
   - **↓** = Geschwindigkeit verringern

3. **Bewegungen werden im Chat-Log protokolliert**
4. **Bei echtem Duckiebot**: Befehle werden in Echtzeit an die Hardware gesendet

---

## 🧪 Testen ohne echten Duckiebot

Die App läuft mit **Mock-Daten** vollständig lokal:

```bash
pnpm dev
```

- Alle Sensordaten werden simuliert
- Chat funktioniert mit KI-Responses
- WASD-Steuerung wird im Chat-Log angezeigt
- Perfekt zum Entwickeln und Testen der UI

---

## 📚 Projektstruktur

```
duckienator-control-center/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeftPanel.tsx          # Steuerung & Fahrmodi
│   │   │   ├── CenterPanel.tsx        # Kamera & Status
│   │   │   ├── RightPanel.tsx         # Chat-Interface
│   │   │   ├── BottomBar.tsx          # Sensordaten
│   │   │   └── KeyboardController.tsx # WASD-Steuerung
│   │   ├── pages/
│   │   │   └── Home.tsx               # Hauptseite
│   │   ├── lib/
│   │   │   └── duckiebot-api.ts       # API-Client
│   │   └── index.css                  # Styling & Animationen
│   └── index.html
├── server/
│   ├── index.ts                       # Express Server
│   └── mcp-client.ts                  # MCP-Integration
├── package.json
└── README.md
```

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to Duckiebot"
**Lösung**: Überprüfe die IP-Adresse und den Port in `.env.local`

### Problem: "WASD-Steuerung funktioniert nicht"
**Lösung**: Stelle sicher, dass du im **HUMAN-LOOP Modus** bist (linkes Panel)

### Problem: "Chat-Nachrichten erscheinen nicht"
**Lösung**: Öffne die Browser-Konsole (F12) und prüfe auf Fehler

### Problem: "Kamera-Stream wird nicht angezeigt"
**Lösung**: Stelle sicher, dass der Duckiebot-MCP-Server läuft und erreichbar ist

---

## 📖 API-Dokumentation

### REST Endpoints

#### POST `/api/duckiebot/move`
Steuert die Motor-Bewegung

```json
{
  "direction": "forward|backward|left|right|stop",
  "speed": 0-100
}
```

#### GET `/api/duckiebot/sensors`
Gibt aktuelle Sensordaten zurück

```json
{
  "battery": 84,
  "temperature": 41,
  "mcpLatency": 12,
  "yoloStatus": "ACTIVE"
}
```

#### POST `/api/duckiebot/command`
Sendet Befehle an KI-Modell

```json
{
  "command": "Fahre zu Node B-7"
}
```

#### GET `/api/duckiebot/camera`
Streamt Kamera-Video (multipart/x-mixed-replace)

---

## 🚀 Deployment

### Manus Hosting (empfohlen)
Die App ist bereits auf Manus gehostet. Klicke auf "Publish" im Management UI.

### Selbst-gehostet (Docker)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t duckienator-control-center .
docker run -p 3000:3000 \
  -e DUCKIEBOT_HOST=192.168.1.100 \
  -e DUCKIEBOT_PORT=5000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  duckienator-control-center
```

---

## 📝 Lizenz

MIT License - Siehe LICENSE Datei

---

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Pull Request mit deinen Änderungen.

---

## 📧 Support

Bei Fragen oder Problemen erstelle bitte ein Issue im GitHub Repository.

**Viel Spaß mit dem Duckienator Control Center! 🦆**
