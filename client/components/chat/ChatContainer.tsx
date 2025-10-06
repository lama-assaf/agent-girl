import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { NewChatWelcome } from './NewChatWelcome';
import { Sidebar } from '../sidebar/Sidebar';
import { ModelSelector } from '../header/ModelSelector';
import { WorkingDirectoryDisplay } from '../header/WorkingDirectoryDisplay';
import { AboutButton } from '../header/AboutButton';
import { PlanApprovalModal } from '../plan/PlanApprovalModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSessionAPI, type Session } from '../../hooks/useSessionAPI';
import { Menu, Edit3 } from 'lucide-react';
import type { Message } from '../message/types';
import { toast } from '../../utils/toast';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [_isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Message cache to preserve streaming state across session switches
  const messageCache = useRef<Map<string, Message[]>>(new Map());

  // Automatically cache messages as they update during streaming
  // IMPORTANT: Only depend on messages, NOT currentSessionId
  // (otherwise it fires when session changes with old messages)
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      messageCache.current.set(currentSessionId, messages);
    }
  }, [messages]);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('agent-boy-model') || 'sonnet';
  });

  // Permission mode (simplified to just plan mode on/off)
  const [isPlanMode, setIsPlanMode] = useState<boolean>(false);

  // Plan approval
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const sessionAPI = useSessionAPI();

  // Per-session loading state helpers
  const isSessionLoading = (sessionId: string | null): boolean => {
    return sessionId ? loadingSessions.has(sessionId) : false;
  };

  const setSessionLoading = (sessionId: string, loading: boolean) => {
    setLoadingSessions(prev => {
      const next = new Set(prev);
      if (loading) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  };

  // Check if ANY session is loading (global loading state for input disabling)
  const isAnySessionLoading = loadingSessions.size > 0;
  const isLoading = isAnySessionLoading;

  // Check if CURRENT session is loading (for typing indicator)
  const isCurrentSessionLoading = currentSessionId ? loadingSessions.has(currentSessionId) : false;

  // Save model selection to localStorage
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('agent-boy-model', modelId);
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const loadedSessions = await sessionAPI.fetchSessions();
    setSessions(loadedSessions);
    setIsLoadingSessions(false);
  };

  // Handle session switching
  const handleSessionSelect = async (sessionId: string) => {
    // IMPORTANT: Cache current session's messages BEFORE switching
    if (currentSessionId && messages.length > 0) {
      messageCache.current.set(currentSessionId, messages);
      console.log(`[Message Cache] Cached ${messages.length} messages for session ${currentSessionId}`);
    }

    setCurrentSessionId(sessionId);

    // Load session details to get permission mode
    const sessions = await sessionAPI.fetchSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setIsPlanMode(session.permission_mode === 'plan');
    }

    // Check cache first before loading from database
    const cachedMessages = messageCache.current.get(sessionId);
    if (cachedMessages) {
      console.log(`[Message Cache] Restored ${cachedMessages.length} cached messages for session ${sessionId}`);
      setMessages(cachedMessages);
      return;
    }

    // Load messages from database
    const sessionMessages = await sessionAPI.fetchSessionMessages(sessionId);

    // Convert session messages to Message format
    const convertedMessages: Message[] = sessionMessages.map(msg => {
      if (msg.type === 'user') {
        return {
          id: msg.id,
          type: 'user' as const,
          content: msg.content,
          timestamp: msg.timestamp,
        };
      } else {
        // For assistant messages, try to parse content as JSON
        let content;
        try {
          // Try parsing as JSON (new format with full content blocks)
          const parsed = JSON.parse(msg.content);
          if (Array.isArray(parsed)) {
            content = parsed;
          } else {
            // If not an array, wrap as text block
            content = [{ type: 'text' as const, text: msg.content }];
          }
        } catch {
          // If parse fails, treat as plain text (legacy format)
          content = [{ type: 'text' as const, text: msg.content }];
        }

        return {
          id: msg.id,
          type: 'assistant' as const,
          content,
          timestamp: msg.timestamp,
        };
      }
    });

    setMessages(convertedMessages);
  };

  // Handle new chat creation
  const handleNewChat = async () => {
    const newSession = await sessionAPI.createSession();

    if (newSession) {
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setInputValue('');

      // Apply current permission mode to new session
      const mode = isPlanMode ? 'plan' : 'bypassPermissions';
      await sessionAPI.updatePermissionMode(newSession.id, mode);

      await loadSessions(); // Reload sessions to include the new one
    }
  };

  // Handle chat deletion
  const handleChatDelete = async (chatId: string) => {
    const success = await sessionAPI.deleteSession(chatId);

    if (success) {
      // If deleting current session, clear messages and session
      if (chatId === currentSessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      await loadSessions(); // Reload sessions to reflect deletion
    }
  };

  // Handle chat rename
  const handleChatRename = async (chatId: string, newFolderName: string) => {
    const result = await sessionAPI.renameSession(chatId, newFolderName);

    if (result.success) {
      await loadSessions();
    } else {
      // Show error to user
      toast.error('Error', {
        description: result.error || 'Failed to rename folder'
      });
    }
  };

  // Handle working directory change
  const handleChangeDirectory = async (sessionId: string, newDirectory: string) => {
    const result = await sessionAPI.updateWorkingDirectory(sessionId, newDirectory);

    if (result.success) {
      await loadSessions();
      toast.success('Working directory updated successfully!');
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to change working directory'
      });
    }
  };

  // Handle plan mode toggle
  const handleTogglePlanMode = async () => {
    const newPlanMode = !isPlanMode;
    const mode = newPlanMode ? 'plan' : 'bypassPermissions';

    // Always update local state
    setIsPlanMode(newPlanMode);

    // If session exists, update it in the database
    if (currentSessionId) {
      const result = await sessionAPI.updatePermissionMode(currentSessionId, mode);

      // If query is active, send WebSocket message to switch mode mid-stream
      if (result.success && isSessionLoading(currentSessionId)) {
        sendMessage({
          type: 'set_permission_mode',
          sessionId: currentSessionId,
          mode
        });
      }
    }
    // If no session exists yet, the mode will be applied when session is created
  };

  // Handle plan approval
  const handleApprovePlan = () => {
    if (!currentSessionId) return;

    // Send approval to server to switch mode
    sendMessage({
      type: 'approve_plan',
      sessionId: currentSessionId
    });

    // Close modal
    setPendingPlan(null);

    // Immediately send continuation message to start execution
    if (currentSessionId) setSessionLoading(currentSessionId, true);

    // Add a user message indicating approval
    const approvalMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: 'Approved. Please proceed with the plan.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, approvalMessage]);

    // Send the continuation message to trigger execution
    setTimeout(() => {
      sendMessage({
        type: 'chat',
        content: 'Approved. Please proceed with the plan.',
        sessionId: currentSessionId,
        model: selectedModel,
      });
    }, 100); // Small delay to ensure mode is switched
  };

  // Handle plan rejection
  const handleRejectPlan = () => {
    setPendingPlan(null);
    if (currentSessionId) setSessionLoading(currentSessionId, false);
  };

  const { isConnected, sendMessage, stopGeneration } = useWebSocket({
    // Use dynamic URL based on current window location (works on any port)
    url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    onMessage: (message) => {
      // Session isolation: Ignore messages from other sessions
      if (message.sessionId && message.sessionId !== currentSessionId) {
        console.log(`[Session Filter] Ignoring message from session ${message.sessionId} (current: ${currentSessionId})`);

        // Clear loading state for filtered session if it's a completion message
        if (message.type === 'result' || message.type === 'error') {
          setSessionLoading(message.sessionId, false);
        }
        return;
      }

      // Handle incoming WebSocket messages
      if (message.type === 'assistant_message' && message.content) {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          // If last message is from assistant, append to the last text block
          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
            const lastBlock = content[content.length - 1];

            // If last block is text, append to it for smooth streaming
            if (lastBlock && lastBlock.type === 'text') {
              const updatedContent = [
                ...content.slice(0, -1),
                { type: 'text' as const, text: lastBlock.text + message.content }
              ];
              const updatedMessage = {
                ...lastMessage,
                content: updatedContent
              };
              return [...prev.slice(0, -1), updatedMessage];
            } else {
              // Otherwise add new text block
              const updatedMessage = {
                ...lastMessage,
                content: [...content, { type: 'text' as const, text: message.content }]
              };
              return [...prev.slice(0, -1), updatedMessage];
            }
          }

          // Otherwise create new assistant message
          return [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: [{ type: 'text' as const, text: message.content }],
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } else if (message.type === 'tool_use') {
        // Handle tool use messages
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          const toolUseBlock = {
            type: 'tool_use' as const,
            id: message.toolId,
            name: message.toolName,
            input: message.toolInput,
            // Initialize nestedTools array for Task tools
            ...(message.toolName === 'Task' ? { nestedTools: [] } : {}),
          };

          // If last message is assistant, check for Task tool nesting
          if (lastMessage && lastMessage.type === 'assistant') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];

            // Find all active Task tools (Tasks without a text block after them)
            const activeTaskIndices: number[] = [];
            let foundTextBlockAfterLastTask = false;

            for (let i = content.length - 1; i >= 0; i--) {
              if (content[i].type === 'text') {
                foundTextBlockAfterLastTask = true;
              }
              if (content[i].type === 'tool_use' && content[i].name === 'Task') {
                if (!foundTextBlockAfterLastTask) {
                  activeTaskIndices.unshift(i); // Add to beginning to maintain order
                } else {
                  break; // Stop looking once we hit a text block context boundary
                }
              }
            }

            // If this is a Task tool OR we found no active Tasks to nest under, add normally
            if (message.toolName === 'Task' || activeTaskIndices.length === 0) {
              const updatedMessage = {
                ...lastMessage,
                content: [...content, toolUseBlock]
              };
              return [...prev.slice(0, -1), updatedMessage];
            }

            // Distribute tools across active Tasks using round-robin
            // Use total nested tool count as a counter for distribution
            const totalNestedTools = activeTaskIndices.reduce((sum, idx) => {
              const block = content[idx];
              return sum + (block.type === 'tool_use' ? (block.nestedTools?.length || 0) : 0);
            }, 0);

            const targetTaskIndex = activeTaskIndices[totalNestedTools % activeTaskIndices.length];

            // Nest this tool under the selected Task
            const updatedContent = content.map((block, index) => {
              if (index === targetTaskIndex && block.type === 'tool_use') {
                return {
                  ...block,
                  nestedTools: [...(block.nestedTools || []), toolUseBlock]
                };
              }
              return block;
            });

            const updatedMessage = {
              ...lastMessage,
              content: updatedContent
            };
            return [...prev.slice(0, -1), updatedMessage];
          }

          // Otherwise create new assistant message with tool
          return [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: [toolUseBlock],
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } else if (message.type === 'result') {
        if (currentSessionId) {
          setSessionLoading(currentSessionId, false);
          // Clear message cache for this session since messages are now saved to DB
          messageCache.current.delete(currentSessionId);
          console.log(`[Message Cache] Cleared cache for session ${currentSessionId} (stream completed)`);
        }
      } else if (message.type === 'error') {
        // Handle error messages from server
        if (currentSessionId) setSessionLoading(currentSessionId, false);
        const errorMessage = message.message || message.error || 'An error occurred';

        // Show toast notification
        toast.error('Error', {
          description: errorMessage
        });

        // Display error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant' as const,
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${errorMessage}`
            }],
            timestamp: new Date().toISOString(),
          },
        ]);
      } else if (message.type === 'user_message') {
        // Echo back user message if needed
      } else if (message.type === 'exit_plan_mode') {
        // Handle plan mode exit - show approval modal and auto-deactivate plan mode
        setPendingPlan(message.plan || 'No plan provided');
        setIsPlanMode(false); // Auto-deactivate plan mode when ExitPlanMode is triggered
      } else if (message.type === 'permission_mode_changed') {
        // Handle permission mode change confirmation
        setIsPlanMode(message.mode === 'plan');
      }
    },
  });

  const handleSubmit = async (files?: import('../message/types').FileAttachment[]) => {
    if (!inputValue.trim()) return;

    if (!isConnected) return;

    // Show toast if another chat is in progress
    if (isLoading) {
      toast.info('Another chat is in progress. Wait for it to complete first.');
      return;
    }

    try {
      // Create new session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        const newSession = await sessionAPI.createSession();
        if (!newSession) {
          toast.error('Failed to create chat session');
          return;
        }

        sessionId = newSession.id;

        // Apply current permission mode to new session
        const mode = isPlanMode ? 'plan' : 'bypassPermissions';
        await sessionAPI.updatePermissionMode(sessionId, mode);

        // Update state and load sessions
        setCurrentSessionId(sessionId);
        await loadSessions();
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date().toISOString(),
        attachments: files,
      };

      setMessages((prev) => [...prev, userMessage]);
      setSessionLoading(sessionId, true);

      // Use local sessionId variable (guaranteed to be set)
      sendMessage({
        type: 'chat',
        content: inputValue,
        sessionId: sessionId,
        model: selectedModel,
      });

      setInputValue('');
    } catch (error) {
      console.error('Failed to submit message:', error);
      toast.error('Failed to send message');
      if (currentSessionId) setSessionLoading(currentSessionId, false);
    }
  };

  const handleStop = () => {
    stopGeneration();
    if (currentSessionId) setSessionLoading(currentSessionId, false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={sessions.map(session => {
          // Extract folder name from working_directory path
          const folderName = session.working_directory?.split('/').filter(Boolean).pop() || session.title;
          return {
            id: session.id,
            title: folderName,
            timestamp: new Date(session.updated_at),
            isActive: session.id === currentSessionId,
            isLoading: loadingSessions.has(session.id),
          };
        })}
        onNewChat={handleNewChat}
        onChatSelect={handleSessionSelect}
        onChatDelete={handleChatDelete}
        onChatRename={handleChatRename}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen" style={{ marginLeft: isSidebarOpen ? '260px' : '0', transition: 'margin-left 0.2s ease-in-out' }}>
        {/* Header - Always visible */}
        <nav className="header">
          <div className="header-content">
            <div className="header-inner">
              {/* Left side */}
              <div className="header-left">
                {!isSidebarOpen && (
                  <>
                    {/* Sidebar toggle */}
                    <button className="header-btn" aria-label="Toggle Sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      <Menu />
                    </button>

                    {/* New chat */}
                    <button className="header-btn" aria-label="New Chat" onClick={handleNewChat}>
                      <Edit3 />
                    </button>
                  </>
                )}
              </div>

            {/* Center - Logo and Model Selector */}
            <div className="header-center">
              <div className="flex flex-col items-start w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    {!isSidebarOpen && (
                      <img
                        src="/client/agent-boy.svg"
                        alt="Agent Girl"
                        className="header-icon"
                        loading="eager"
                        onError={(e) => {
                          console.error('Failed to load agent-boy.svg');
                          // Retry loading
                          setTimeout(() => {
                            e.currentTarget.src = '/client/agent-boy.svg?' + Date.now();
                          }, 100);
                        }}
                      />
                    )}
                    <div className="header-title text-gradient">
                      Agent Girl
                    </div>
                    {/* Model Selector */}
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="header-right">
              {/* Working Directory Display */}
              {currentSessionId && sessions.find(s => s.id === currentSessionId)?.working_directory && (
                <WorkingDirectoryDisplay
                  directory={sessions.find(s => s.id === currentSessionId)?.working_directory || ''}
                  sessionId={currentSessionId}
                  onChangeDirectory={handleChangeDirectory}
                />
              )}
              {/* About Button */}
              <AboutButton />
            </div>
          </div>
        </div>
      </nav>

        {messages.length === 0 ? (
          // New Chat Welcome Screen
          <NewChatWelcome
            key={currentSessionId || 'welcome'}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={handleStop}
            disabled={!isConnected || isLoading}
            isGenerating={isLoading}
            isPlanMode={isPlanMode}
            onTogglePlanMode={handleTogglePlanMode}
          />
        ) : (
          // Chat Interface
          <>
            {/* Messages */}
            <MessageList messages={messages} isLoading={isCurrentSessionLoading} />

            {/* Input */}
            <ChatInput
              key={currentSessionId || 'new-chat'}
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              onStop={handleStop}
              disabled={!isConnected || isLoading}
              isGenerating={isLoading}
              isPlanMode={isPlanMode}
              onTogglePlanMode={handleTogglePlanMode}
            />
          </>
        )}
      </div>

      {/* Plan Approval Modal */}
      {pendingPlan && (
        <PlanApprovalModal
          plan={pendingPlan}
          onApprove={handleApprovePlan}
          onReject={handleRejectPlan}
        />
      )}
    </div>
  );
}
