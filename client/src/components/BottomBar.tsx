interface SensorData {
  speed: number | null;
  battery: number | null;
  mcpLatency: number | null;
  temp: number | null;
  yoloStatus: string;
  gemmaStatus: string;
}

interface BottomBarProps {
  sensorData: SensorData;
  rageMode: boolean;
}

/**
 * Bottom Bar - Sensor Data Display
 * Contains: Real-time sensor tiles with status indicators and color coding
 * Design: Horizontal layout with monospace values, color-coded status (green/yellow/red)
 */

export default function BottomBar({ sensorData, rageMode }: BottomBarProps) {
  const getStatusColor = (value: number, thresholds: { ok: number; warning: number }) => {
    if (value <= thresholds.ok) return '#00FF88'; // Green
    if (value <= thresholds.warning) return '#FFD000'; // Yellow
    return '#FF3B3B'; // Red
  };

  const getStatusText = (value: number, thresholds: { ok: number; warning: number }) => {
    if (value <= thresholds.ok) return 'OK';
    if (value <= thresholds.warning) return 'WARN';
    return 'CRIT';
  };

  const speedColor = sensorData.speed !== null ? getStatusColor(sensorData.speed, { ok: 40, warning: 70 }) : '#666666';
  const batteryColor = sensorData.battery !== null ? getStatusColor(100 - sensorData.battery, { ok: 20, warning: 40 }) : '#666666';
  const tempColor = sensorData.temp !== null ? getStatusColor(sensorData.temp, { ok: 50, warning: 65 }) : '#666666';
  const mcpConnected = sensorData.mcpLatency !== null && sensorData.mcpLatency < 100;

  return (
    <div
      className="h-16 flex-shrink-0 border-t bg-[#0a0a0a] px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto"
      style={{
        borderTopColor: rageMode ? '#FF4D00' : '#2a2a2a',
        borderTopWidth: rageMode ? '2px' : '1px',
        boxShadow: rageMode ? '0 0 20px rgba(255, 77, 0, 0.2) inset' : 'none'
      }}
    >
      {/* Speed Sensor */}
      <div className="sensor-tile min-w-fit">
        <div className="sensor-label">SPEED</div>
        <div className="sensor-value" style={{ color: speedColor }}>
          {sensorData.speed !== null ? `${Math.round(sensorData.speed * 0.38)} cm/s` : '---'}
        </div>
      </div>

      {/* Battery Sensor */}
      <div className="sensor-tile min-w-fit">
        <div className="sensor-label">BATTERY</div>
        <div className="sensor-value" style={{ color: batteryColor }}>
          {sensorData.battery !== null ? `${Math.round(sensorData.battery)}%` : 'UNBEKANNT'}
        </div>
      </div>

      {/* MCP Connection */}
      <div
        className={`sensor-tile min-w-fit ${!mcpConnected ? 'sensor-blink' : ''}`}
        style={{
          backgroundColor: !mcpConnected ? '#FF3B3B' : '#161616',
          borderColor: !mcpConnected ? '#FF3B3B' : '#2a2a2a'
        }}
      >
        <div className="sensor-label">MCP</div>
        <div
          className="sensor-value"
          style={{ color: mcpConnected ? '#00FF88' : '#FF3B3B' }}
        >
          {mcpConnected ? '●' : '○'} {Math.round(sensorData.mcpLatency)}ms
        </div>
      </div>

      {/* Temperature Sensor */}
      <div className="sensor-tile min-w-fit">
        <div className="sensor-label">TEMP</div>
        <div className="sensor-value" style={{ color: tempColor }}>
          {sensorData.temp !== null ? `${Math.round(sensorData.temp)}°C` : '---'}
        </div>
      </div>

      {/* YOLO Status */}
      <div className="sensor-tile min-w-fit">
        <div className="sensor-label">YOLO v11</div>
        <div
          className="sensor-value"
          style={{
            color: sensorData.yoloStatus === 'DETECTING' ? '#FF4D00' : '#00FF88'
          }}
        >
          {sensorData.yoloStatus}
        </div>
      </div>

      {/* Gemma Status */}
      <div className="sensor-tile min-w-fit">
        <div className="sensor-label">GEMMA 3</div>
        <div className="sensor-value" style={{ color: '#00FF88' }}>
          {sensorData.gemmaStatus}
        </div>
      </div>

      {/* Rage Mode Indicator */}
      {rageMode && (
        <div
          className="sensor-tile min-w-fit ml-auto"
          style={{
            backgroundColor: '#FF4D00',
            borderColor: '#FF4D00',
            boxShadow: '0 0 20px rgba(255, 77, 0, 0.5)'
          }}
        >
          <div className="sensor-label" style={{ color: '#e8e8e8' }}>
            MODE
          </div>
          <div className="sensor-value" style={{ color: '#e8e8e8' }}>
            ⚡ RAGE
          </div>
        </div>
      )}
    </div>
  );
}
