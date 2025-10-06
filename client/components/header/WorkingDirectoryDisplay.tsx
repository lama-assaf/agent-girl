import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { toast } from '../../utils/toast';

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

    setIsChanging(true);
    try {
      // Call server to open native directory picker (dynamic URL works on any port)
      const response = await fetch(`${window.location.protocol}//${window.location.host}/api/pick-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json() as { success: boolean; path?: string; cancelled?: boolean; error?: string };

      if (result.success && result.path) {
        // User selected a directory
        await onChangeDirectory(sessionId, result.path);
      } else if (result.cancelled) {
        // User cancelled the dialog - do nothing
        console.log('Directory picker cancelled');
      } else {
        // Error occurred
        toast.error('Error', {
          description: result.error || 'Failed to open directory picker'
        });
      }
    } catch (error) {
      console.error('Failed to open directory picker:', error);
      toast.error('Error', {
        description: 'Failed to open directory picker'
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 text-xs group" title={directory}>
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
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Change working directory"
          title="Select custom directory"
        >
          <FolderOpen className="w-3 h-3" style={{ color: 'rgb(var(--text-secondary))' }} />
        </button>
      )}
    </div>
  );
}
