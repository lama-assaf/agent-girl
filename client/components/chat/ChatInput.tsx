/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Send, Plus, X, Square } from 'lucide-react';
import type { FileAttachment } from '../message/types';
import type { BackgroundProcess } from '../process/BackgroundProcessMonitor';
import { ModeIndicator } from './ModeIndicator';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: FileAttachment[], mode?: 'general' | 'coder') => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  isPlanMode?: boolean;
  onTogglePlanMode?: () => void;
  backgroundProcesses?: BackgroundProcess[];
  onKillProcess?: (bashId: string) => void;
  mode?: 'general' | 'coder';
}

export function ChatInput({ value, onChange, onSubmit, onStop, disabled, isGenerating, placeholder, isPlanMode, onTogglePlanMode, backgroundProcesses: _backgroundProcesses = [], onKillProcess: _onKillProcess, mode }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [modeIndicatorWidth, setModeIndicatorWidth] = useState(80);

  // Auto-focus on mount with slight delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate
    textarea.style.height = '72px';

    // Set height based on scrollHeight, capped at max
    const newHeight = Math.min(textarea.scrollHeight, 144);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  // Prevent browser default drag behavior (allows drop zones to work)
  useEffect(() => {
    const preventDragDefaults = (e: DragEvent) => {
      e.preventDefault();
    };

    // Only prevent dragover globally (allows custom drop handlers to work)
    window.addEventListener('dragover', preventDragDefaults);

    return () => {
      window.removeEventListener('dragover', preventDragDefaults);
    };
  }, []);

  // Handle paste events for images (screenshots)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();

    // Only take the first pasted image (max 1 at a time)
    const item = imageItems[0];
    const file = item.getAsFile();
    if (!file) return;

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: `pasted-image-${Date.now()}.${file.type.split('/')[1]}`,
      size: file.size,
      type: file.type,
    };

    // Read as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, mode);
        setAttachedFiles([]);
        // Refocus input after submit
        setTimeout(() => textareaRef.current?.focus(), 0);
      }
    }
  };

  const handleSubmit = () => {
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined, mode);
    setAttachedFiles([]);
    // Refocus input after submit
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Only take the first file (max 1 at a time)
    if (files.length === 0) return;
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64 (for images and documents)
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Only take the first file (max 1 at a time)
    const file = files[0];

    const fileData: FileAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    };

    // Read all files as base64
    const reader = new FileReader();
    const preview = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    fileData.preview = preview;

    // Replace existing files (max 1 at a time)
    setAttachedFiles([fileData]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="input-container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <form className="input-wrapper" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        {/* Main input container with rounded border */}
        <div className={`input-field-wrapper ${isDraggingOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mx-2 mt-2.5 -mb-1">
              {attachedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  className="flex relative gap-1 items-center p-1.5 w-60 max-w-60 text-left bg-gray-800 rounded-2xl border border-gray-700 group"
                >
                  {/* Preview thumbnail */}
                  <div className="flex justify-center items-center">
                    <div className="overflow-hidden relative flex-shrink-0 w-12 h-12 rounded-lg border border-gray-700">
                      {file.preview && file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="rounded-lg w-full h-full object-cover object-center"
                          draggable="false"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 text-xs font-medium">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="flex flex-col justify-center px-2.5 -space-y-0.5 flex-1 min-w-0 overflow-hidden">
                    <div className="mb-1 text-sm font-medium text-gray-100 truncate w-full">
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
            {/* Mode Indicator */}
            {mode && <ModeIndicator mode={mode} onWidthChange={setModeIndicatorWidth} />}

            <textarea
              ref={textareaRef}
              id="chat-input"
              dir="auto"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder || "Send a Message"}
              className="px-1 pt-3 w-full text-sm bg-transparent resize-none scrollbar-hidden text-gray-100 outline-hidden placeholder:text-white/40"
              style={{
                minHeight: '72px',
                maxHeight: '144px',
                overflowY: 'auto',
                textIndent: mode ? `${modeIndicatorWidth}px` : '0px'
              }}
            />
          </div>

          {/* Bottom controls */}
          <div className="input-controls">
            {/* Left side */}
            <div className="input-controls-left">
              {/* Plus button */}
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
                  className="btn-icon"
                  title="Add attachment"
                  type="button"
                >
                  <Plus size={20} />
                </button>

                {/* Plan Mode toggle button */}
                {onTogglePlanMode && (
                  <button
                    onClick={onTogglePlanMode}
                    className={`${isPlanMode ? 'send-button-active' : 'btn-icon'} rounded-lg`}
                    title={isPlanMode ? "Plan Mode Active - Click to deactivate" : "Activate Plan Mode"}
                    type="button"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      padding: '0.375rem 0.75rem',
                    }}
                  >
                    Plan Mode
                  </button>
                )}

                {/* Background Process Monitor */}
                {/* TODO: Fix background process display - temporarily disabled */}
                {/* {onKillProcess && (
                  <BackgroundProcessMonitor
                    processes={backgroundProcesses}
                    onKillProcess={onKillProcess}
                  />
                )} */}
              </div>
            </div>

            {/* Right side - Send/Stop button */}
            <div className="input-controls-right">
              {isGenerating ? (
                <button
                  onClick={onStop}
                  className="send-button stop-button-active"
                  title="Stop generating"
                  type="button"
                >
                  <Square size={17} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={disabled || !value.trim()}
                  className={`send-button ${!disabled && value.trim() ? 'send-button-active' : ''}`}
                  title="Send message"
                  type="submit"
                >
                  <Send size={17} />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
