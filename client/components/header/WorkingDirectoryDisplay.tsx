import React, { useState } from 'react';
import { Folder, Copy, Check } from 'lucide-react';

interface WorkingDirectoryDisplayProps {
  directory: string;
  sessionId?: string;
}

export function WorkingDirectoryDisplay({ directory, sessionId }: WorkingDirectoryDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(directory);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy directory path:', err);
    }
  };

  // Extract just the chat folder name (e.g., "chat-a1b2c3d4")
  const getFolderName = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

  return (
    <div className="flex items-center gap-2 py-2 text-xs">
      <Folder className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-secondary))' }} />
      <span style={{ color: 'rgb(var(--text-secondary))' }}>›</span>
      <span
        className="font-mono"
        style={{ color: 'rgb(var(--text-secondary))' }}
        title={directory}
      >
        {getFolderName(directory)}
      </span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Copy full path"
        title={directory}
      >
        {copied ? (
          <Check className="w-3 h-3" style={{ color: 'rgb(var(--accent-primary))' }} />
        ) : (
          <Copy className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
        )}
      </button>
    </div>
  );
}
