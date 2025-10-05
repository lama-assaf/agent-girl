import React, { useState } from 'react';
import { UserMessage as UserMessageType, UserToolResultMessage } from './types';

interface UserMessageProps {
  message: UserMessageType | UserToolResultMessage;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function UserMessage({ message }: UserMessageProps) {
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = async () => {
    const userMessage = message as UserMessageType;
    const text = userMessage.content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  const isToolResult = 'content' in message && Array.isArray(message.content) && 
    message.content.some(c => typeof c === 'object' && 'tool_use_id' in c);

  if (isToolResult) {
    const toolResultMessage = message as UserToolResultMessage;
    return (
      <div className="mb-3 p-3 bg-gray-50 border border-gray-300">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tool Result</span>
          </div>
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        {toolResultMessage.content.map((result, index) => (
          <div key={index} className="mt-2">
            <div className="text-xs text-gray-500 mb-1 font-mono">
              ID: {result.tool_use_id}
            </div>
            <pre className="text-xs bg-white p-2 border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono">
              {result.content}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  const userMessage = message as UserMessageType;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="message-container group">
      <div className="message-user-wrapper">
        <div className="message-user-content">
          <div className="message-user-inner">
            <div className="message-user-bubble-wrapper">
              {/* File attachments */}
              {userMessage.attachments && userMessage.attachments.length > 0 && (
                <div className="flex overflow-x-auto flex-col flex-wrap gap-1 justify-end mt-2.5 mb-1 w-full">
                  <div className="self-end">
                    {userMessage.attachments.map((file) => (
                      <button
                        key={file.id}
                        className="relative group p-1.5 w-60 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-left mb-1"
                        type="button"
                      >
                        <div className="flex justify-center items-center">
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                              disabled
                            >
                              <button className="outline-hidden focus:outline-hidden w-full h-full not-prose" type="button">
                                {file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="rounded-lg w-full h-full object-cover object-center not-prose"
                                    draggable="false"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium">
                                    {file.name.split('.').pop()?.toUpperCase()}
                                  </div>
                                )}
                              </button>
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center px-2.5 -space-y-0.5 w-full">
                          <div className="mb-1 text-sm font-medium dark:text-gray-100 line-clamp-1">
                            {file.name}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 line-clamp-1">
                            <span className="uppercase">{file.name.split('.').pop()}</span>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="message-user-bubble-container">
                <div className="message-user-bubble">
                  {userMessage.content}
                </div>
              </div>
              <div className="message-user-actions">
                <button
                  onClick={handleCopy}
                  className="message-action-btn message-action-btn-hidden"
                  aria-label={copied ? "Copied!" : "Copy"}
                  title={copied ? "Copied!" : "Copy message"}
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.875 4.66161V2.92944C4.875 2.34696 5.3472 1.87476 5.92969 1.87476H15.0703C15.6528 1.87476 16.125 2.34696 16.125 2.92944V12.0701C16.125 12.6526 15.6528 13.1248 15.0703 13.1248H13.3186" />
                      <path strokeLinejoin="round" d="M12.0703 4.87476H2.92969C2.3472 4.87476 1.875 5.34696 1.875 5.92944V15.0701C1.875 15.6526 2.3472 16.1248 2.92969 16.1248H12.0703C12.6528 16.1248 13.125 15.6526 13.125 15.0701V5.92944C13.125 5.34696 12.6528 4.87476 12.0703 4.87476Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}