import { useState } from 'react';

interface LeftPanelProps {
  rageMode: boolean;
  mode: 'autonomous' | 'human-loop' | 'rage';
  velocity: number;
  destination: string;
  onRageModeToggle: () => void;
  onModeChange: (mode: 'autonomous' | 'human-loop') => void;
  onVelocityChange: (velocity: number) => void;
  onDestinationChange: (destination: string) => void;
}

/**
 * Left Panel - Control Interface
 * Contains: Mode selection, velocity slider, quick actions, destination input
 * Design: Terminal-style with monospace fonts, minimal borders, futuristic feel
 */

export default function LeftPanel({
  rageMode,
  mode,
  velocity,
  destination,
  onRageModeToggle,
  onModeChange,
  onVelocityChange,
  onDestinationChange
}: LeftPanelProps) {
  const [isCamera, setIsCamera] = useState(true);

  const getVelocityColor = () => {
    if (rageMode) return '#FF4D00';
    if (velocity <= 40) return '#00FF88';
    if (velocity <= 70) return '#FFD000';
    return '#FF3B3B';
  };

  return (
    <div
      className="w-[280px] flex-shrink-0 flex flex-col gap-4 p-4 border-r bg-[#0a0a0a] overflow-y-auto"
      style={{
        borderRightColor: rageMode ? '#FF4D00' : '#2a2a2a',
        borderRightWidth: rageMode ? '2px' : '1px',
        boxShadow: rageMode ? '0 0 20px rgba(255, 77, 0, 0.2) inset' : 'none'
      }}
    >
      {/* Header */}
      <div
        className="text-center pb-2 border-b"
        style={{ borderBottomColor: rageMode ? '#FF4D00' : '#2a2a2a' }}
      >
        <h2 className="text-sm font-bold tracking-widest text-[#FFD000] mono-display">
          🦆 CONTROL
        </h2>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-widest text-[#666666] block mono-display">
          FAHRMODUS
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('autonomous')}
            className={`flex-1 btn-pill text-xs mono-display ${
              mode === 'autonomous' && !rageMode ? 'active' : ''
            }`}
            style={{
              backgroundColor: mode === 'autonomous' && !rageMode ? '#FFD000' : 'transparent',
              color: mode === 'autonomous' && !rageMode ? '#0a0a0a' : '#e8e8e8',
              borderColor: mode === 'autonomous' && !rageMode ? '#FFD000' : '#2a2a2a'
            }}
          >
            AUTONOM
          </button>
          <button
            onClick={() => onModeChange('human-loop')}
            className={`flex-1 btn-pill text-xs mono-display ${
              mode === 'human-loop' ? 'active' : ''
            }`}
            style={{
              backgroundColor: mode === 'human-loop' ? '#FFD000' : 'transparent',
              color: mode === 'human-loop' ? '#0a0a0a' : '#e8e8e8',
              borderColor: mode === 'human-loop' ? '#FFD000' : '#2a2a2a'
            }}
          >
            HUMAN-LOOP
          </button>
        </div>
      </div>

      {/* RAGE MODE Button */}
      <div>
        <button
          onClick={onRageModeToggle}
          className="w-full btn-pill text-xs mono-display font-bold py-3"
          style={{
            backgroundColor: rageMode ? '#FF4D00' : 'transparent',
            color: rageMode ? '#e8e8e8' : '#e8e8e8',
            borderColor: rageMode ? '#FF4D00' : '#2a2a2a',
            boxShadow: rageMode ? '0 0 20px rgba(255, 77, 0, 0.5)' : 'none'
          }}
        >
          ⚡ {rageMode ? 'RAGE MODE' : 'RAGE MODE'}
        </button>
      </div>

      {/* Velocity Slider */}
      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-widest text-[#666666] block mono-display">
          VELOCITY
        </label>
        <input
          type="range"
          min="0"
          max={rageMode ? '120' : '100'}
          value={velocity}
          onChange={(e) => onVelocityChange(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{
            background: rageMode
              ? 'linear-gradient(to top, #FF4D00 0%, #FF4D00 100%)'
              : `linear-gradient(to top, #00FF88 0%, #FFD000 50%, #FF3B3B 100%)`
          }}
        />
        <div
          className="text-center text-2xl font-bold mono-display tracking-widest value-count"
          style={{ color: getVelocityColor() }}
        >
          {Math.round(velocity)}%
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-widest text-[#666666] block mono-display">
          AKTIONEN
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-action primary text-xs"
            style={{
              backgroundColor: '#FFD000',
              color: '#0a0a0a',
              borderColor: '#FFD000'
            }}
          >
            ▶ LOS
          </button>
          <button
            className="btn-action danger text-xs"
            style={{
              backgroundColor: '#FF3B3B',
              color: '#e8e8e8',
              borderColor: '#FF3B3B'
            }}
          >
            ■ STOPP
          </button>
          <button
            className="btn-action text-xs"
            onClick={() => setIsCamera(!isCamera)}
          >
            📷 {isCamera ? 'AUS' : 'AN'}
          </button>
          <button className="btn-action text-xs">
            🔄 RESET
          </button>
        </div>
      </div>

      {/* Destination Input (only in AUTONOM mode) */}
      {mode === 'autonomous' && !rageMode && (
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-widest text-[#666666] block mono-display">
            ZIEL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              placeholder="Node B-7"
              className="flex-1 text-xs"
              style={{
                backgroundColor: '#111111',
                borderColor: '#2a2a2a',
                color: '#e8e8e8'
              }}
            />
            <button
              className="btn-action primary text-xs px-3"
              style={{
                backgroundColor: '#FFD000',
                color: '#0a0a0a',
                borderColor: '#FFD000'
              }}
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-auto pt-4 border-t border-[#2a2a2a] text-center">
        <div className="text-xs mono-display text-[#666666]">
          {rageMode ? (
            <span style={{ color: '#FF4D00' }}>⚡ CHAOS MODE</span>
          ) : (
            <span style={{ color: '#00FF88' }}>● READY</span>
          )}
        </div>
      </div>
    </div>
  );
}
