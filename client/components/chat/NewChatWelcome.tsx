import React, { useRef, useState, useEffect } from 'react';
import { Send, Plus, X } from 'lucide-react';
import type { FileAttachment } from '../message/types';

interface NewChatWelcomeProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[]) => void;
  disabled?: boolean;
}

export function NewChatWelcome({ inputValue, onInputChange, onSubmit, disabled }: NewChatWelcomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

  // Auto-focus on mount with slight delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
            <div className="text-[40px] font-semibold line-clamp-1">
              <span>Hi, </span>
              <span className="text-gradient">Ken Kai</span>
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
                  <div className="flex">
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
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex self-end space-x-1 shrink-0">
                  <button
                    type="submit"
                    disabled={disabled || !inputValue.trim()}
                    className="text-white bg-gray-200 dark:text-white/40 dark:bg-gray-500 disabled:opacity-50 transition rounded-lg p-2 self-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:cursor-not-allowed"
                    aria-label="Send Message"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
