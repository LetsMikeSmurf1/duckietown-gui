import { useEffect, useRef, useState } from 'react';
import { DUCKIEBOT_IP, DUCKIEBOT_HOSTNAME } from '@shared/const';

interface CenterPanelProps {
  rageMode: boolean;
  mode: 'autonomous' | 'human-loop' | 'rage';
  velocity: number | null;
  mcpLatency: number | null;
}

/**
 * Center Panel - Camera Feed & Status
 * Contains: Live camera feed with HUD overlays, mini-map, status indicators
 * Design: Futuristic HUD with scanlines, glowing borders, real-time data overlay
 */

export default function CenterPanel({
  rageMode,
  mode,
  velocity,
  mcpLatency
}: CenterPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState(false);
  const [streamUrlIndex, setStreamUrlIndex] = useState(0);
  
  // Use local proxy for the camera stream to avoid CORS and mixed content issues
  const streamUrls = [
    `/duckiebot-stream/camera/stream`,
    `/duckiebot-api/camera/stream`,
    `http://${DUCKIEBOT_HOSTNAME}:8080/camera/stream`,
    `http://${DUCKIEBOT_IP}:8080/camera/stream`
  ];

  const currentStreamUrl = streamUrls[streamUrlIndex];

  const handleStreamError = () => {
    if (streamUrlIndex < streamUrls.length - 1) {
      setStreamUrlIndex(prev => prev + 1);
    } else {
      setStreamError(true);
    }
  };

  // Draw scanlines effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw scanlines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw grid pattern
      ctx.strokeStyle = 'rgba(255, 208, 0, 0.05)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw center crosshair
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.strokeStyle = 'rgba(255, 208, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const getModeLabel = () => {
    if (rageMode) return 'RAGE';
    if (mode === 'human-loop') return 'HUMAN-LOOP';
    return 'AUTONOM';
  };

  const getModeColor = () => {
    if (rageMode) return '#FF4D00';
    return '#FFD000';
  };

  return (
    <div
      className="flex-1 flex flex-col gap-3 p-4 bg-[#0a0a0a] min-w-[500px] overflow-hidden"
      style={{
        boxShadow: rageMode ? '0 0 40px rgba(255, 77, 0, 0.15) inset' : 'none'
      }}
    >
      {/* Camera Feed Container */}
      <div
        className="flex-1 relative rounded-sm overflow-hidden"
        style={{
          border: `2px solid ${rageMode ? '#FF4D00' : '#FFD000'}`,
          boxShadow: rageMode ? '0 0 20px rgba(255, 77, 0, 0.3)' : '0 0 15px rgba(255, 208, 0, 0.2)'
        }}
      >
        {/* Live Camera Stream */}
        {!streamError ? (
          <img
            src={currentStreamUrl}
            alt="Duckiebot Live Stream"
            className="w-full h-full object-cover absolute top-0 left-0"
            onError={handleStreamError}
          />
        ) : (
          <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center bg-black text-[#FF3B3B] font-mono text-sm">
            [ CAMERA FEED OFFLINE ]
          </div>
        )}

        {/* Canvas for scanlines and grid */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full absolute top-0 left-0 pointer-events-none opacity-40"
          style={{ backgroundColor: 'transparent' }}
        />

        {/* HUD Overlays */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          {/* Top HUD */}
          <div className="flex justify-between items-start">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full pulse-dot"
                style={{ backgroundColor: '#FF3B3B' }}
              />
              <span className="text-xs font-bold mono-display text-[#FF3B3B]">● LIVE</span>
            </div>

            {/* Mode badge */}
            <div
              className="px-3 py-1 border text-xs font-bold mono-display"
              style={{
                borderColor: getModeColor(),
                color: getModeColor(),
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }}
            >
              [ {getModeLabel()} ]
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="flex justify-between items-end">
            {/* Speed */}
            <div className="flex flex-col">
              <span className="text-xs mono-display text-[#666666]">SPEED</span>
              <span className="text-lg font-bold mono-display text-[#FFD000]">
                {velocity !== null ? `${Math.round(velocity * 0.38)} cm/s` : '---'}
              </span>
            </div>

            {/* Latency */}
            <div className="flex flex-col items-end">
              <span className="text-xs mono-display text-[#666666]">LATENCY</span>
              <span className="text-lg font-bold mono-display text-[#FFD000]">
                MCP {mcpLatency !== null ? `${Math.round(mcpLatency)}ms` : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* RAGE MODE Vignette */}
        {rageMode && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(255, 77, 0, 0.2) 100%)',
              boxShadow: 'inset 0 0 60px rgba(255, 77, 0, 0.15)'
            }}
          />
        )}
      </div>

      {/* Mini Map */}
      <div
        className="h-24 rounded-sm p-3 relative overflow-hidden"
        style={{
          backgroundColor: '#111111',
          border: '1px solid #2a2a2a'
        }}
      >
        {/* Map grid */}
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 200 100">
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 50}
              y1={0}
              x2={i * 50}
              y2={100}
              stroke="#2a2a2a"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * 50}
              x2={200}
              y2={i * 50}
              stroke="#2a2a2a"
              strokeWidth="0.5"
            />
          ))}

          {/* Current position marker */}
          <g transform="translate(100, 50)">
            {/* Direction arrow */}
            <polygon
              points="0,-8 6,8 0,4 -6,8"
              fill="#FFD000"
              opacity="0.8"
            />
          </g>

          {/* Route trace */}
          <polyline
            points="80,60 90,55 100,50 110,48 120,50"
            stroke="#FFD000"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />

          {/* Destination marker */}
          <circle cx="120" cy="50" r="4" fill="none" stroke="#FF4D00" strokeWidth="1" opacity="0.7" />
        </svg>

        {/* Map label */}
        <div className="absolute bottom-1 left-2 text-xs mono-display text-[#666666]">
          MINI-MAP
        </div>
      </div>
    </div>
  );
}
