import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../../config/models';

interface Model {
  id: string;
  name: string;
  description: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/5"
        style={{ color: 'rgb(var(--text-primary))' }}
      >
        <span className="font-heading text-sm">{currentModel.name}</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: '0.5rem',
            background: 'rgb(var(--bg-input))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            width: '32rem',
            maxWidth: 'calc(100vw - 1rem)',
            zIndex: 50,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ padding: '1rem 1.75rem 0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            Model
          </div>
          <div style={{ padding: '0 1rem 1rem', maxHeight: '20rem', overflowY: 'auto' }}>
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.25rem',
                  background: selectedModel === model.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'background 0.075s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (selectedModel !== model.id) {
                    e.currentTarget.style.background = 'rgba(244, 246, 248, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModel !== model.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div
                    className="font-medium"
                    style={{
                      color: 'rgb(var(--text-primary))',
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {model.name}
                  </div>
                  <div
                    style={{
                      color: 'rgb(var(--text-secondary))',
                      fontSize: '0.75rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {model.description}
                  </div>
                </div>
                {selectedModel === model.id && (
                  <div style={{ paddingRight: '0.5rem' }}>
                    <Check size={16} strokeWidth={1.5} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
