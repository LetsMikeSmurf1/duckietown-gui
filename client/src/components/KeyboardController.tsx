import { useEffect, useState } from 'react';

interface KeyboardControllerProps {
  enabled: boolean;
  onMovement: (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => void;
  onSpeedChange: (speed: number) => void;
}

/**
 * Keyboard Controller Component
 * Handles WASD keyboard input for Duckiebot control in Human-Loop mode
 * 
 * Controls:
 * - W: Forward
 * - A: Left
 * - S: Backward
 * - D: Right
 * - Space: Stop
 * - Arrow Up/Down: Speed adjustment
 */

export default function KeyboardController({
  enabled,
  onMovement,
  onSpeedChange
}: KeyboardControllerProps) {
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [lastDirection, setLastDirection] = useState<'forward' | 'backward' | 'left' | 'right' | 'stop'>('stop');

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // WASD movement keys
      if (['w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
        setKeysPressed(prev => new Set(prev).add(key));
      }

      // Speed adjustment with arrow keys
      if (key === 'arrowup') {
        e.preventDefault();
        onSpeedChange(1); // Increase speed
      }
      if (key === 'arrowdown') {
        e.preventDefault();
        onSpeedChange(-1); // Decrease speed
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
        setKeysPressed(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onSpeedChange]);

  // Process key combinations and determine movement direction
  useEffect(() => {
    if (!enabled) return;

    let direction: 'forward' | 'backward' | 'left' | 'right' | 'stop' = 'stop';

    // Determine primary direction
    if (keysPressed.has('w')) {
      direction = 'forward';
    } else if (keysPressed.has('s')) {
      direction = 'backward';
    } else if (keysPressed.has('a')) {
      direction = 'left';
    } else if (keysPressed.has('d')) {
      direction = 'right';
    } else if (keysPressed.has(' ')) {
      direction = 'stop';
    }

    // Allow diagonal movement (forward+left, forward+right, etc.)
    // For now, we prioritize forward/backward over left/right
    if ((keysPressed.has('w') || keysPressed.has('s')) && (keysPressed.has('a') || keysPressed.has('d'))) {
      // Diagonal movement - keep primary direction
      if (keysPressed.has('w')) direction = 'forward';
      else if (keysPressed.has('s')) direction = 'backward';
    }

    if (direction !== lastDirection) {
      setLastDirection(direction);
      onMovement(direction);
    }
  }, [keysPressed, enabled, lastDirection, onMovement]);

  // Periodic update for continuous movement while key is held
  useEffect(() => {
    if (!enabled || lastDirection === 'stop') return;

    const interval = setInterval(() => {
      onMovement(lastDirection);
    }, 200); // Send command every 200ms

    return () => clearInterval(interval);
  }, [enabled, lastDirection, onMovement]);

  return (
    <div className="hidden">
      {/* This component handles keyboard input silently */}
      {/* Visual feedback is provided in the LeftPanel and CenterPanel */}
    </div>
  );
}
