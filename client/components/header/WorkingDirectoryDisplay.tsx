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

  // Shorten directory for display (show last 2 segments)
  const getShortPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length <= 2) return path;
    return '.../' + segments.slice(-2).join('/');
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs">
      <Folder className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-secondary))' }} />
      <span
        className="font-mono truncate max-w-[300px]"
        style={{ color: 'rgb(var(--text-secondary))' }}
        title={directory}
      >
        {getShortPath(directory)}
      </span>
      <button
        onClick={handleCopy}
        className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
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
