import React from 'react';
import { Folder } from 'lucide-react';

interface WorkingDirectoryDisplayProps {
  directory: string;
  sessionId?: string;
}

export function WorkingDirectoryDisplay({ directory, sessionId }: WorkingDirectoryDisplayProps) {
  // Extract just the chat folder name (e.g., "chat-a1b2c3d4")
  const getFolderName = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

  return (
    <div className="flex items-center gap-2 py-2 text-xs" title={directory}>
      <Folder className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-secondary))' }} />
      <span style={{ color: 'rgb(var(--text-secondary))' }}>›</span>
      <span
        className="font-mono"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        {getFolderName(directory)}
      </span>
    </div>
  );
}
