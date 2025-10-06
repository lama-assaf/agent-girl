import React, { useState } from 'react';
import { Folder, Edit2 } from 'lucide-react';

interface WorkingDirectoryDisplayProps {
  directory: string;
  sessionId?: string;
  onChangeDirectory?: (sessionId: string, newDirectory: string) => Promise<void>;
}

export function WorkingDirectoryDisplay({ directory, sessionId, onChangeDirectory }: WorkingDirectoryDisplayProps) {
  const [isChanging, setIsChanging] = useState(false);

  // Extract just the chat folder name (e.g., "chat-a1b2c3d4")
  const getFolderName = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

  const handleChangeDirectory = async () => {
    if (!sessionId || !onChangeDirectory) return;

    const newPath = prompt('Enter custom working directory path:\n\n(Use ~ for home directory, or full path)', directory);

    if (!newPath || newPath === directory) return;

    setIsChanging(true);
    try {
      await onChangeDirectory(sessionId, newPath);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 text-xs group" title={directory}>
      <Folder className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-secondary))' }} />
      <span style={{ color: 'rgb(var(--text-secondary))' }}>›</span>
      <span
        className="font-mono"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        {getFolderName(directory)}
      </span>
      {sessionId && onChangeDirectory && (
        <button
          onClick={handleChangeDirectory}
          disabled={isChanging}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
          aria-label="Change working directory"
          title="Change to custom directory"
        >
          <Edit2 className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
        </button>
      )}
    </div>
  );
}
