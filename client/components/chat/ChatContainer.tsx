import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { NewChatWelcome } from './NewChatWelcome';
import { Sidebar } from '../sidebar/Sidebar';
import { ModelSelector } from '../header/ModelSelector';
import { WorkingDirectoryDisplay } from '../header/WorkingDirectoryDisplay';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSessionAPI, type Session } from '../../hooks/useSessionAPI';
import { Menu, Edit3 } from 'lucide-react';
import type { Message } from '../message/types';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('agent-boy-model') || 'sonnet';
  });

  const sessionAPI = useSessionAPI();

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
    setCurrentSessionId(sessionId);

    // Load messages for this session
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
  const handleChatRename = async (chatId: string, newTitle: string) => {
    const success = await sessionAPI.renameSession(chatId, newTitle);

    if (success) {
      await loadSessions();
    }
  };

  const { isConnected, sendMessage, stopGeneration } = useWebSocket({
    url: 'ws://localhost:3001/ws',
    onMessage: (message) => {
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
        setIsLoading(false);
      } else if (message.type === 'error') {
        // Handle error messages from server
        setIsLoading(false);
        const errorMessage = message.message || message.error || 'An error occurred';

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
      }
    },
  });

  const handleSubmit = async (files?: import('../message/types').FileAttachment[]) => {
    if (!inputValue.trim() || !isConnected || isLoading) return;

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = await sessionAPI.createSession();
      if (!newSession) return;

      sessionId = newSession.id;
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
    setIsLoading(true);

    sendMessage({
      type: 'chat',
      content: inputValue,
      sessionId: sessionId,
      model: selectedModel,
    });

    setInputValue('');
  };

  const handleStop = () => {
    stopGeneration();
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={sessions.map(session => ({
          id: session.id,
          title: session.title,
          timestamp: new Date(session.updated_at),
          isActive: session.id === currentSessionId,
        }))}
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

            {/* Center - Model name */}
            <div className="header-center">
              <div className="flex flex-col items-start w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {!isSidebarOpen && (
                      <img src="/client/agent-boy.svg" alt="Agent Girl" className="header-icon" />
                    )}
                    <div className="header-title text-gradient">
                      Agent Girl
                    </div>
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
                />
              )}

              {/* Model Selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />
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
          />
        ) : (
          // Chat Interface
          <>
            {/* Messages */}
            <MessageList messages={messages} isLoading={isLoading} />

            {/* Input */}
            <ChatInput
              key={currentSessionId || 'new-chat'}
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              onStop={handleStop}
              disabled={!isConnected || isLoading}
              isGenerating={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
