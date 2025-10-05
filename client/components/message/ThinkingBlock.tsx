import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ThinkingBlockProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

export function ThinkingBlock({ title, content, defaultExpanded = false }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="thinking-block">
      <button
        className="thinking-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="thinking-header-left">
          <div className="thinking-indicator">
            <div className="thinking-dot" />
          </div>
          <div className="thinking-title">{title}</div>
        </div>
        <div className="thinking-chevron">
          <ChevronDown
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            size={12}
            strokeWidth={3}
          />
        </div>
      </button>

      <div className="thinking-content-wrapper">
        <div className="thinking-gradient-top" style={{ opacity: isExpanded ? 1 : 0 }} />
        <div
          className="thinking-content"
          style={{
            height: isExpanded ? 'auto' : '0',
            maxHeight: isExpanded ? '10rem' : '0',
          }}
        >
          <div className="thinking-content-text">
            <blockquote className="thinking-blockquote">{content}</blockquote>
          </div>
        </div>
        <div className="thinking-gradient-bottom" style={{ opacity: isExpanded ? 0 : 0 }} />
      </div>
    </div>
  );
}
