import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  working_directory: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const API_BASE = 'http://localhost:3001/api';

export function useSessionAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all sessions
   */
  const fetchSessions = useCallback(async (): Promise<Session[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as { sessions: Session[]; warning?: string };

      // Show warning if directories were recreated
      if (data.warning) {
        console.warn('⚠️  Directory warning:', data.warning);
        // Show toast notification to user
        toast.warning(`${data.warning}`, {
          description: 'Some chat folders were missing and have been recreated.',
          duration: 5000,
        });
      }

      return data.sessions;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch messages for a specific session
   */
  const fetchSessionMessages = useCallback(async (sessionId: string): Promise<SessionMessage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const messages = await response.json() as SessionMessage[];
      return messages;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (title?: string): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title || 'New Chat' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = await response.json() as Session;
      return session;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rename a session folder (and title)
   */
  const renameSession = useCallback(async (sessionId: string, newFolderName: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName: newFolderName }),
      });

      const result = await response.json() as { success: boolean; error?: string; session?: Session };

      if (!response.ok || !result.success) {
        const errorMsg = result.error || `HTTP error! status: ${response.status}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to rename session';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update working directory for a session
   */
  const updateWorkingDirectory = useCallback(async (sessionId: string, directory: string): Promise<{ success: boolean; session?: Session; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/directory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workingDirectory: directory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { success: boolean; session?: Session; error?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update working directory';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate a directory path
   */
  const validateDirectory = useCallback(async (directory: string): Promise<{ valid: boolean; error?: string; expanded?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/validate-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { valid: boolean; error?: string; expanded?: string };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to validate directory';
      setError(errorMsg);
      return { valid: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchSessions,
    fetchSessionMessages,
    createSession,
    deleteSession,
    renameSession,
    updateWorkingDirectory,
    validateDirectory,
  };
}
