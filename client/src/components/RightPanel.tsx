import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  timestamp: string;
  sender: 'user' | 'ai' | 'system';
  message: string;
}

interface RightPanelProps {
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  showDecisionCard: boolean;
  onDecision: (decision: string) => void;
  rageMode: boolean;
}

/**
 * Right Panel - Chat Interface
 * Contains: Terminal-style chat log, decision cards, message input
 * Design: Monospace terminal aesthetic with timestamp, sender labels, color-coded messages
 */

export default function RightPanel({
  chatMessages,
  onSendMessage,
  showDecisionCard,
  onDecision,
  rageMode
}: RightPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const getSenderColor = (sender: 'user' | 'ai' | 'system') => {
    switch (sender) {
      case 'user':
        return '#FFD000';
      case 'ai':
        return '#00FF88';
      case 'system':
        return '#FF9500';
      default:
        return '#e8e8e8';
    }
  };

  const getSenderLabel = (sender: 'user' | 'ai' | 'system') => {
    switch (sender) {
      case 'user':
        return 'USER';
      case 'ai':
        return 'AI';
      case 'system':
        return 'SYSTEM';
      default:
        return 'LOG';
    }
  };

  return (
    <div
      className="w-[320px] flex-shrink-0 flex flex-col gap-3 p-4 border-l bg-[#0a0a0a] overflow-hidden"
      style={{
        borderLeftColor: rageMode ? '#FF4D00' : '#2a2a2a',
        borderLeftWidth: rageMode ? '2px' : '1px',
        boxShadow: rageMode ? '0 0 20px rgba(255, 77, 0, 0.2) inset' : 'none'
      }}
    >
      {/* Header */}
      <div
        className="text-center pb-2 border-b"
        style={{ borderBottomColor: rageMode ? '#FF4D00' : '#2a2a2a' }}
      >
        <h2 className="text-sm font-bold tracking-widest text-[#FFD000] mono-display">
          CHAT LOG
        </h2>
      </div>

      {/* Chat Messages Container */}
      <div
        className="flex-1 overflow-y-auto space-y-0 chat-terminal"
        style={{
          backgroundColor: '#0a0a0a',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFD000 #111111'
        }}
      >
        {chatMessages.map((msg, idx) => (
          <div key={idx} className="chat-line">
            <span className="chat-timestamp">[{msg.timestamp}]</span>
            <span
              className="chat-sender"
              style={{ color: getSenderColor(msg.sender) }}
            >
              {getSenderLabel(msg.sender)}
            </span>
            <span className="chat-message">&gt; {msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Decision Card */}
      {showDecisionCard && (
        <div className="decision-card">
          <div className="decision-title">⚡ ENTSCHEIDUNG ERFORDERLICH</div>
          <div className="decision-question">
            Kreuzung erkannt – wohin fahren?
          </div>
          <div className="decision-buttons">
            <button
              className="decision-btn"
              onClick={() => onDecision('← LINKS')}
            >
              ← LINKS
            </button>
            <button
              className="decision-btn"
              onClick={() => onDecision('↑ GERADEAUS')}
            >
              ↑ GERADE
            </button>
            <button
              className="decision-btn"
              onClick={() => onDecision('RECHTS →')}
            >
              RECHTS →
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        className="space-y-2 border-t pt-3"
        style={{ borderTopColor: rageMode ? '#FF4D00' : '#2a2a2a' }}
      >
        <div className="flex gap-2">
          <span className="text-xs mono-display text-[#666666] self-center">&gt;</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder={rageMode ? 'Gib Chaos-Befehl ein...' : 'Befehl eingeben...'}
            className="flex-1 text-xs mono-display"
            style={{
              backgroundColor: '#111111',
              borderColor: '#2a2a2a',
              color: '#e8e8e8',
              padding: '6px 8px',
              border: '1px solid #2a2a2a',
              borderRadius: '2px'
            }}
          />
          <button
            onClick={handleSend}
            className="btn-action text-xs"
            style={{
              backgroundColor: '#FFD000',
              color: '#0a0a0a',
              borderColor: '#FFD000',
              padding: '6px 12px'
            }}
          >
            SEND ↵
          </button>
        </div>
      </div>
    </div>
  );
}
