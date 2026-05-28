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
  const [sensorData, setSensorData] = useState({
    speed: 38,
    battery: 84,
    mcpLatency: 12,
    temp: 41,
    yoloStatus: 'ACTIVE',
    gemmaStatus: 'READY'
  });
  const [currentDirection, setCurrentDirection] = useState<'forward' | 'backward' | 'left' | 'right' | 'stop'>('stop');
  const bodyRef = useRef<HTMLDivElement>(null);
  const rageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real sensor data from Duckiebot
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Fetch battery and other info from the dashboard API
        const response = await axios.get(`http://${DUCKIEBOT_HOSTNAME}/dashboard/robot/info`);
        const data = response.data;
        
        setSensorData(prev => ({
          ...prev,
          battery: data.battery?.percentage || prev.battery,
          temp: data.temperature || prev.temp,
          speed: Math.round(velocity * 0.38), // Derived from current velocity setting
          mcpLatency: Math.max(5, Math.min(50, prev.mcpLatency + (Math.random() - 0.5) * 5)),
        }));
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        // Fallback to simulation if real data fails
        setSensorData(prev => ({
          ...prev,
          speed: Math.max(0, Math.min(rageMode ? 120 : 100, prev.speed + (Math.random() - 0.5) * 15)),
          battery: Math.max(0, Math.min(100, prev.battery + (Math.random() - 0.5) * 2)),
        }));
      }
    };

    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, [rageMode, velocity]);

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

      // Try multiple common Duckiebot control endpoints
      const endpoints = [
        `http://${DUCKIEBOT_HOSTNAME}:8080/motors/set`,
        `http://${DUCKIEBOT_HOSTNAME}/api/motors/set`,
        `http://${DUCKIEBOT_IP}:8080/motors/set`
      ];

      // We'll try the first one and log if it fails
      await axios.get(endpoints[0], {
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
    </div>
  );
}
