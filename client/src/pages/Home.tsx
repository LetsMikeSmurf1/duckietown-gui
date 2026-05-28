import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DUCKIEBOT_IP, DUCKIEBOT_HOSTNAME } from '@shared/const';
import LeftPanel from '@/components/LeftPanel';
import CenterPanel from '@/components/CenterPanel';
import RightPanel from '@/components/RightPanel';
import BottomBar from '@/components/BottomBar';
import KeyboardController from '@/components/KeyboardController';

/**
 * Duckienator Control Center - Main Application
 * 
 * Design Philosophy: Sci-Fi Drohnen-Kontrollraum
 * - Dark mode with neon yellow (#FFD000) and hot orange (#FF4D00) accents
 * - Terminal-style monospace fonts for data values
 * - Futuristic three-column layout: Control | Camera & Status | Chat
 * - RAGE MODE with visual chaos effects
 */

export default function Home() {
  const [rageMode, setRageMode] = useState(false);
  const [mode, setMode] = useState<'autonomous' | 'human-loop' | 'rage'>('autonomous');
  const [velocity, setVelocity] = useState(72);
  const [chatMessages, setChatMessages] = useState<Array<{
    timestamp: string;
    sender: 'user' | 'ai' | 'system';
    message: string;
  }>>([
    { timestamp: '14:32:01', sender: 'system', message: 'System initialized. Ready for commands.' },
    { timestamp: '14:32:02', sender: 'ai', message: 'Gemma 3 27B loaded. MCP connection established.' }
  ]);
  const [destination, setDestination] = useState('');
  const [showDecisionCard, setShowDecisionCard] = useState(false);
  const [sensorData, setSensorData] = useState<{
    speed: number | null;
    battery: number | null;
    mcpLatency: number | null;
    temp: number | null;
    yoloStatus: string;
    gemmaStatus: string;
  }>({
    speed: null,
    battery: null,
    mcpLatency: null,
    temp: null,
    yoloStatus: 'OFFLINE',
    gemmaStatus: 'READY'
  });
  const [currentDirection, setCurrentDirection] = useState<'forward' | 'backward' | 'left' | 'right' | 'stop'>('stop');
  const [rawData, setRawData] = useState<string>("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const rageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real sensor data from Duckiebot
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Try to fetch JSON data from the API endpoint
        // Based on Duckietown Compose, the API is often under /api/1.0/
        const response = await axios.get(`/duckiebot-api/api/1.0/robot/info`, { timeout: 2000 });
        const data = response.data;
        setRawData(JSON.stringify(data, null, 2));
        
        // Recursive search for values in the object
        const findValue = (obj: any, keys: string[]): any => {
          if (!obj || typeof obj !== 'object') return undefined;
          for (const key in obj) {
            if (keys.includes(key.toLowerCase())) return obj[key];
            if (typeof obj[key] === 'object') {
              const found = findValue(obj[key], keys);
              if (found !== undefined) return found;
            }
          }
          return undefined;
        };

        const batteryVal = findValue(data, ['percentage', 'level', 'battery', 'soc', 'battery_level']);
        const tempVal = findValue(data, ['temperature', 'temp', 'cpu_temp', 'cpu_temperature', 'thermal']);
        
        setSensorData({
          battery: typeof batteryVal === 'number' ? batteryVal : (parseFloat(batteryVal) || null),
          temp: typeof tempVal === 'number' ? tempVal : (parseFloat(tempVal) || null),
          speed: currentDirection === 'stop' ? 0 : Math.round(velocity * 0.38),
          mcpLatency: 12,
          yoloStatus: 'ACTIVE',
          gemmaStatus: 'READY'
        });
      } catch (error) {
        console.error('Failed to fetch sensor data from /api/1.0/robot/info, trying fallback...', error);
        
        // Fallback: Try the original URL but expect it might be HTML
        try {
          const response = await axios.get(`/duckiebot-api/dashboard/robot/info`, { timeout: 2000 });
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            setRawData("Bot liefert HTML statt JSON. API-Endpunkt wird gesucht...");
          } else {
            setRawData(JSON.stringify(response.data, null, 2));
          }
        } catch (e) {
          setRawData("Bot nicht erreichbar (IP: 172.18.40.182)");
        }

        setSensorData({
          battery: null,
          temp: null,
          speed: null,
          mcpLatency: null,
          yoloStatus: 'OFFLINE',
          gemmaStatus: 'READY'
        });
      }
    };

    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, [rageMode, velocity, currentDirection]);

  // Handle RAGE MODE activation
  const handleRageModeToggle = () => {
    if (!rageMode) {
      // Activate RAGE MODE
      setRageMode(true);
      setMode('rage');
      setVelocity(100);
      
      // Screen shake effect
      if (bodyRef.current) {
        bodyRef.current.classList.add('screen-shake');
        setTimeout(() => {
          bodyRef.current?.classList.remove('screen-shake');
        }, 200);
      }

      // Add chat message
      setChatMessages(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
        sender: 'system',
        message: '⚡ RAGE MODE ACTIVATED - All safety protocols disabled!'
      }]);

      // Simulate aggressive behavior in RAGE MODE
      rageIntervalRef.current = setInterval(() => {
        setChatMessages(prev => {
          const newMessages = [...prev];
          const randomMessages = [
            'MAXIMUM VELOCITY ENGAGED!',
            'OBSTACLE AVOIDANCE DISABLED!',
            'TRAFFIC RULES IGNORED!',
            'PURE CHAOS MODE!',
            'DUCKIENATOR UNLEASHED!'
          ];
          newMessages.push({
            timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
            sender: 'system',
            message: randomMessages[Math.floor(Math.random() * randomMessages.length)]
          });
          return newMessages;
        });
      }, 3000);
    } else {
      // Deactivate RAGE MODE
      setRageMode(false);
      setMode('autonomous');
      setVelocity(72);
      
      // Clear rage interval
      if (rageIntervalRef.current) {
        clearInterval(rageIntervalRef.current);
        rageIntervalRef.current = null;
      }
      
      setChatMessages(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
        sender: 'system',
        message: 'RAGE MODE deactivated. Normal operations resumed.'
      }]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rageIntervalRef.current) {
        clearInterval(rageIntervalRef.current);
      }
    };
  }, []);

  const handleModeChange = (newMode: 'autonomous' | 'human-loop') => {
    setMode(newMode);
    setRageMode(false);
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const timestamp = new Date().toLocaleTimeString('de-DE', { hour12: false });
    setChatMessages(prev => [...prev, {
      timestamp,
      sender: 'user',
      message
    }]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        'Route calculated. Proceeding to destination.',
        'Obstacle detected. Recalculating path.',
        'Awaiting your decision at intersection.',
        'Battery level optimal. Continuing mission.',
        'MCP connection stable. All systems nominal.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
        sender: 'ai',
        message: randomResponse
      }]);

      // Show decision card occasionally
      if (Math.random() > 0.7) {
        setShowDecisionCard(true);
      }
    }, 500);
  };

  const handleDecision = (decision: string) => {
    setChatMessages(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
      sender: 'user',
      message: `Decision: ${decision}`
    }]);
    setShowDecisionCard(false);
  };

  const handleMovement = async (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    setCurrentDirection(direction);

    // Send command to Duckiebot
    try {
      const speedValue = velocity / 100; // Normalize speed to 0.0 - 1.0
      let v = 0, omega = 0;

      switch (direction) {
        case 'forward': v = speedValue; omega = 0; break;
        case 'backward': v = -speedValue; omega = 0; break;
        case 'left': v = 0; omega = 1.0; break;
        case 'right': v = 0; omega = -1.0; break;
        case 'stop': v = 0; omega = 0; break;
      }

      // Send movement command via proxy
      await axios.get(`/duckiebot-stream/motors/set`, {
        params: { v, omega },
        timeout: 500
      });
    } catch (error) {
      console.error('Failed to send movement command:', error);
    }
    
    // Log movement to chat in Human-Loop mode
    if (mode === 'human-loop' && direction !== 'stop') {
      const directionLabels: Record<string, string> = {
        forward: '↑ FORWARD',
        backward: '↓ BACKWARD',
        left: '← LEFT',
        right: '→ RIGHT'
      };
      
      setChatMessages(prev => {
        // Don't add duplicate messages within 500ms
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.message.includes(directionLabels[direction])) {
          return prev;
        }
        return [...prev, {
          timestamp: new Date().toLocaleTimeString('de-DE', { hour12: false }),
          sender: 'system',
          message: `Movement: ${directionLabels[direction]} [WASD Control]`
        }];
      });
    }
  };

  const handleSpeedChange = (delta: number) => {
    setVelocity(prev => Math.max(0, Math.min(rageMode ? 120 : 100, prev + delta * 5)));
  };

  return (
    <div
      ref={bodyRef}
      className={`w-screen h-screen flex flex-col bg-[#0a0a0a] text-[#e8e8e8] overflow-hidden ${
        rageMode ? 'rage-pulse' : ''
      }`}
      style={{
        backgroundColor: rageMode ? '#0a0a0a' : '#0a0a0a'
      }}
    >
      {/* Keyboard Controller for Human-Loop mode */}
      <KeyboardController
        enabled={mode === 'human-loop'}
        onMovement={handleMovement}
        onSpeedChange={handleSpeedChange}
      />

      {/* Main three-column layout */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        <LeftPanel
          rageMode={rageMode}
          mode={mode}
          velocity={velocity}
          destination={destination}
          onRageModeToggle={handleRageModeToggle}
          onModeChange={handleModeChange}
          onVelocityChange={setVelocity}
          onDestinationChange={setDestination}
        />

        <CenterPanel
          rageMode={rageMode}
          mode={mode}
          velocity={velocity}
          mcpLatency={sensorData.mcpLatency}
        />

        <RightPanel
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          showDecisionCard={showDecisionCard}
          onDecision={handleDecision}
          rageMode={rageMode}
        />
      </div>

      {/* Bottom sensor bar */}
      <BottomBar sensorData={sensorData} rageMode={rageMode} />

      {/* Debug Overlay - Only visible if data is missing */}
      {(sensorData.battery === null || sensorData.temp === null) && (
        <div className="fixed bottom-24 right-4 p-4 bg-black/90 text-green-500 text-[10px] font-mono rounded max-w-xs overflow-auto max-h-40 border border-green-500/30 z-50 shadow-2xl">
          <div className="font-bold mb-1 border-b border-green-500/30 pb-1 flex justify-between">
            <span>DEBUG: RAW BOT DATA</span>
            <span className="animate-pulse">●</span>
          </div>
          <pre className="whitespace-pre-wrap">{rawData || "Warte auf Daten..."}</pre>
        </div>
      )}
    </div>
  );
}
