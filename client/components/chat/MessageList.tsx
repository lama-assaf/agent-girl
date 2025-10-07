import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageRenderer } from '../message/MessageRenderer';
import type { Message } from '../message/types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated message height - will auto-adjust
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Scroll to bottom when messages change (for new messages)
  useEffect(() => {
    if (parentRef.current) {
      // Auto-scroll to bottom on new messages
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="empty-state">
          <h2 className="empty-state-title">Welcome to Agent Girl Chat</h2>
          <p className="empty-state-description">
            Start a conversation with Claude. I can help you with coding, analysis, and complex tasks
            using the Agent SDK tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex overflow-auto z-10 flex-col flex-auto justify-between pb-2.5 w-full max-w-full h-0 scrollbar-hidden"
    >
      <div className="flex flex-col w-full h-full">
        <div className="h-full flex pt-8">
          <div className="pt-2 w-full">
            <div className="w-full" style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = messages[virtualItem.index];

                return (
                  <div
                    key={message.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                  >
                    <MessageRenderer message={message} />
                  </div>
                );
              })}
            </div>
            {isLoading && (
              <div className="message-container">
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            )}
            <div className="pb-12" />
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
