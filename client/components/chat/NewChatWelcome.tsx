import React, { useRef, useState, useEffect } from 'react';
import { Send, Plus, X, Square } from 'lucide-react';
import type { FileAttachment } from '../message/types';

interface NewChatWelcomeProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isPlanMode?: boolean;
  onTogglePlanMode?: () => void;
}

const CAPABILITIES = [
  "I can build websites for you",
  "I can research anything you want",
  "I can debug and fix your code",
  "I can automate repetitive tasks",
  "I can analyze data and files"
];

export function NewChatWelcome({ inputValue, onInputChange, onSubmit, onStop, disabled, isGenerating, isPlanMode, onTogglePlanMode }: NewChatWelcomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

  // Typewriter effect state
  const [currentCapabilityIndex, setCurrentCapabilityIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Auto-focus on mount with slight delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentText = CAPABILITIES[currentCapabilityIndex];

    if (isTyping) {
      if (displayedText.length < currentText.length) {
        const timer = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Finished typing, wait before erasing
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      // Erasing
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timer);
      } else {
        // Finished erasing, move to next capability
        setCurrentCapabilityIndex((prev) => (prev + 1) % CAPABILITIES.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentCapabilityIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined);
      setAttachedFiles([]);
    }
  };

  const handleSubmit = () => {
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined);
    setAttachedFiles([]);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newFiles: FileAttachment[] = await Promise.all(
      files.map(async (file) => {
        const fileData: FileAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
        };

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          fileData.preview = preview;
        }

        return fileData;
      })
    );

    setAttachedFiles((prev) => [...prev, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="w-full max-w-4xl px-4">
        {/* Greeting */}
        <div className="flex flex-col gap-1 justify-center items-center mb-8">
          <div className="flex flex-row justify-center gap-3 w-fit px-5">
            <div className="text-[40px] font-semibold line-clamp-1 text-gradient">
              Hi, Ken Kai. I&apos;m Agent girl
            </div>
          </div>

          {/* Typewriter capabilities */}
          <div className="flex justify-center items-center mt-2 h-8">
            <div className="text-lg text-gray-600 dark:text-gray-400 font-medium flex items-center">
              <span>{displayedText}</span>
              <span className="inline-block w-[3px] h-[18px] bg-gray-600 dark:bg-gray-400 ml-0.5 animate-blink"></span>
            </div>
          </div>
        </div>

        {/* Input Container */}
        <div className="w-full max-w-[960px] mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-1.5 w-full">
            <div className="flex-1 flex flex-col relative w-full rounded-xl border-b-2 border-black/20 dark:border-white/10 transition bg-white/90 dark:bg-[#26282A]">
              {/* File attachments preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center mx-2 mt-2.5 -mb-1">
                  {attachedFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      className="flex relative gap-1 items-center p-1.5 w-60 text-left bg-gray-100 rounded-2xl border border-gray-200 group dark:bg-gray-800 dark:border-gray-700"
                    >
                      {/* Preview thumbnail */}
                      <div className="flex justify-center items-center">
                        <div className="overflow-hidden relative flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="rounded-lg w-full h-full object-cover object-center"
                              draggable="false"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File info */}
                      <div className="flex flex-col justify-center px-2.5 -space-y-0.5 w-full">
                        <div className="mb-1 text-sm font-medium dark:text-gray-100 line-clamp-1">
                          {file.name}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 line-clamp-1">
                          <span>File</span>
                          <span className="capitalize">{formatFileSize(file.size)}</span>
                        </div>
                      </div>

                      {/* Remove button */}
                      <div className="absolute -top-1 -right-1">
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="invisible text-black bg-white rounded-full border border-white transition group-hover:visible"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <div className="overflow-hidden relative px-2.5">
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  rows={3}
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="px-1 pt-3 w-full text-sm bg-transparent resize-none scrollbar-hidden dark:text-gray-100 outline-none dark:placeholder:text-white/40"
                  placeholder="How can I help you today?"
                  disabled={disabled}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mx-3.5 mt-1.5 mb-3.5 max-w-full">
                <div className="self-end flex items-center gap-1.5">
                  {/* File Upload */}
                  <div className="flex gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.html,.md,.txt,.json,.xml,.csv"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={handleFileClick}
                      type="button"
                      className="border rounded-lg border-black/10 dark:border-white/10 bg-transparent transition p-1.5 outline-none focus:outline-none hover:bg-gray-100 text-gray-800 dark:text-white dark:hover:bg-gray-800"
                      aria-label="Upload files"
                    >
                      <Plus className="size-5" />
                    </button>

                    {/* Plan Mode toggle button */}
                    {onTogglePlanMode && (
                      <button
                        onClick={onTogglePlanMode}
                        type="button"
                        className={`${isPlanMode ? 'send-button-active' : 'border border-black/10 dark:border-white/10 bg-transparent text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'} rounded-lg transition outline-none focus:outline-none`}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          padding: '0.375rem 0.75rem',
                        }}
                        title={isPlanMode ? "Plan Mode Active - Click to deactivate" : "Activate Plan Mode"}
                        aria-label={isPlanMode ? "Deactivate Plan Mode" : "Activate Plan Mode"}
                      >
                        Plan Mode
                      </button>
                    )}
                  </div>
                </div>

                {/* Send/Stop Button */}
                <div className="flex self-end space-x-1 shrink-0">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={onStop}
                      className="stop-button-active transition rounded-lg p-2 self-center"
                      aria-label="Stop Generating"
                    >
                      <Square className="size-4" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={disabled || !inputValue.trim()}
                      className={`transition rounded-lg p-2 self-center ${
                        !disabled && inputValue.trim()
                          ? 'send-button-active'
                          : 'bg-gray-200 dark:bg-gray-500 text-white dark:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      aria-label="Send Message"
                    >
                      <Send className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
