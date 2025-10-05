import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AssistantMessage as AssistantMessageType, ToolUseBlock, TextBlock, ToolEdit, TodoItem } from './types';
import { ThinkingBlock } from './ThinkingBlock';

interface AssistantMessageProps {
  message: AssistantMessageType;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

// Tool icon component based on tool type
function ToolIcon({ toolName }: { toolName: string }) {
  const getIcon = () => {
    switch (toolName) {
      case 'TodoWrite':
        return (
          <svg className="size-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="1.5">
            <path d="M266.304 104.544l-105.408 105.92-41.408-41.6a31.904 31.904 0 0 0-54.496 13.888c-2.88 11.424 0.672 23.552 9.28 31.552l64 64.32a31.904 31.904 0 0 0 45.216 0l128-128.64a32.256 32.256 0 0 0-0.864-44.576 31.904 31.904 0 0 0-44.352-0.864h0.032zM176 384a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 160H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM928.064 480H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64zM176 720a112 112 0 1 1 0 224 112 112 0 0 1 0-224z m9.376 64.8a48.064 48.064 0 1 0 24.416 81.216 48.064 48.064 0 0 0-24.416-81.216zM928.064 800H416a32 32 0 0 0 0 64h512.064a32 32 0 0 0 0-64z" fill="currentColor" stroke="currentColor"/>
          </svg>
        );
      case 'Read':
      case 'Write':
      case 'Edit':
      case 'MultiEdit':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
        );
      case 'Bash':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8l4 4-4 4M12 16h6"/>
          </svg>
        );
      case 'WebSearch':
      case 'WebFetch':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
      case 'Task':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        );
      default:
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
    }
  };

  return <div className="flex items-center">{getIcon()}</div>;
}

// Bash-specific tool component matching bash.md design
function BashToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full">
      <div className="w-full text-sm transition-colors duration-200 bg-white/60 dark:bg-black">
        {/* Header */}
        <div className="flex gap-2 justify-between items-center px-4 py-2 w-full bg-white/60 dark:bg-[#0C0E10] shrink-1 border-b border-black/10 dark:border-white/10">
          <div className="flex overflow-hidden flex-1 gap-2 items-center w-full shrink-1">
            <div className="flex gap-2 items-center">
              {/* Terminal icon */}
              <svg className="size-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" strokeWidth="2">
                <path d="M282.88 788.48l-35.84-35.84L486.4 512c-42.24-38.4-142.08-130.56-225.28-215.04L243.2 279.04l35.84-35.84 17.92 17.92c107.52 107.52 241.92 230.4 243.2 231.68 5.12 5.12 7.68 11.52 8.96 17.92 0 6.4-2.56 14.08-7.68 19.2L282.88 788.48zM503.04 733.44h281.6v51.2h-281.6v-51.2z" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium leading-6 text-black whitespace-nowrap dark:text-white">Shell</span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex p-1.5 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 duration-150 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3.5"
              stroke="currentColor"
              className={`size-3 transition-all ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          data-expanded={isExpanded}
          className="font-mono p-4 flex flex-col gap-2 w-full bg-white/60 dark:bg-black/30 text-green-400 dark:text-green-300 data-[expanded=false]:max-h-[128px] data-[expanded=false]:overflow-y-auto"
        >
          {/* Command line */}
          <div>
            <span className="text-[#2ddc44]">$</span>{' '}
            <span className="text-black dark:text-white">{input.command}</span>
          </div>

          {/* Output placeholder - will be populated with tool results */}
          {input.description && (
            <div className="text-black/60 dark:text-white/60 text-xs">
              {input.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Web tool component (WebSearch/WebFetch) matching edit-write-update.md design
function WebToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-white/60 dark:bg-[#0C0E10] border-b border-black/10 dark:border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Globe icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium leading-6">{toolUse.name}</span>
          <div className="bg-black/10 dark:bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-black/60 dark:text-white/60">
            {toolUse.name === 'WebSearch'
              ? (input.query as string)
              : (input.url as string)}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white/60 dark:bg-black/30 text-sm space-y-2">
          {toolUse.name === 'WebSearch' ? (
            <>
              <div>
                <span className="text-xs font-semibold text-black/60 dark:text-white/60">Query:</span>
                <div className="text-sm mt-1">{input.query as string}</div>
              </div>
              {input.allowed_domains && (input.allowed_domains as string[]).length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-black/60 dark:text-white/60">Allowed Domains:</span>
                  <div className="text-sm mt-1">{(input.allowed_domains as string[]).join(', ')}</div>
                </div>
              )}
              {input.blocked_domains && (input.blocked_domains as string[]).length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-black/60 dark:text-white/60">Blocked Domains:</span>
                  <div className="text-sm mt-1">{(input.blocked_domains as string[]).join(', ')}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <span className="text-xs font-semibold text-black/60 dark:text-white/60">URL:</span>
                <div className="text-sm mt-1 break-all font-mono">{input.url as string}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-black/60 dark:text-white/60">Prompt:</span>
                <div className="text-sm mt-1">{input.prompt as string}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Edit/Write tool component matching edit-write-update.md design
function EditToolComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const input = toolUse.input;

  // Detect language from file extension
  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'sql': 'sql',
    };
    return languageMap[ext || ''] || 'text';
  };

  const language = getLanguageFromPath((input.file_path as string) || '');

  // Calculate stats for Edit
  const calculateStats = () => {
    if (toolUse.name === 'Edit') {
      const oldLines = (input.old_string as string)?.split('\n').length || 0;
      const newLines = (input.new_string as string)?.split('\n').length || 0;
      return {
        added: newLines,
        removed: oldLines,
      };
    } else if (toolUse.name === 'Write') {
      const contentLines = (input.content as string)?.split('\n').length || 0;
      return {
        added: contentLines,
        removed: 0,
      };
    }
    return { added: 0, removed: 0 };
  };

  const stats = calculateStats();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 w-full text-xs bg-white/60 dark:bg-[#0C0E10] border-b border-black/10 dark:border-white/10">
        <div className="flex overflow-hidden flex-1 gap-2 items-center whitespace-nowrap">
          {/* Code icon */}
          <svg className="size-4" strokeWidth="1.5" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_1981_4166)">
              <path d="M5.33398 4.33301L1.33398 8.47707L5.33398 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.666 4.33301L14.666 8.47707L10.666 12.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.33333 1.33301L7 14.6663" stroke="currentColor" strokeLinecap="round" />
            </g>
            <defs>
              <clipPath id="clip0_1981_4166">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <span className="text-sm font-medium leading-6">{toolUse.name}</span>
          <div className="bg-black/10 dark:bg-gray-700 shrink-0 min-h-4 w-[1px] h-4" role="separator" aria-orientation="vertical" />
          <span className="flex-1 min-w-0 text-xs truncate text-black/60 dark:text-white/60">
            {input.file_path as string}
          </span>
        </div>
        <div className="flex gap-1 items-center whitespace-nowrap">
          <span className="text-green-500">+ {stats.added}</span>
          {' / '}
          <span className="text-red-500">- {stats.removed}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-collapsed={!isExpanded}
            className="p-1.5 rounded-lg transition-all data-[collapsed=true]:-rotate-180"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Diff Viewer */}
      {isExpanded && (
        <div className="max-h-[124px] overflow-auto bg-white/60 dark:bg-black/30">
          {/* Deleted chunk (old_string) */}
          {input.old_string && (
            <div className="bg-red-500/10 border-l-2 border-red-500">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus as any}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={false}
                wrapLines={true}
                lineProps={(lineNumber) => ({
                  style: {
                    textDecoration: 'line-through',
                    opacity: 0.7,
                    display: 'flex',
                  },
                })}
                codeTagProps={{
                  style: {
                    fontFamily: 'monospace',
                  },
                }}
              >
                {input.old_string as string}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Added/New content (new_string or content) */}
          {(input.new_string || input.content) && (
            <div className="bg-green-500/10 border-l-2 border-green-500">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus as any}
                PreTag="div"
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                }}
                lineNumberStyle={{
                  minWidth: '2.5em',
                  paddingRight: '1em',
                  color: '#10b981',
                  userSelect: 'none',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'monospace',
                  },
                }}
              >
                {(input.new_string || input.content) as string}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolUseComponent({ toolUse }: { toolUse: ToolUseBlock }) {
  // Use BashToolComponent for Bash tools
  if (toolUse.name === 'Bash') {
    return <BashToolComponent toolUse={toolUse} />;
  }

  // Use EditToolComponent for Edit/Write tools
  if (toolUse.name === 'Edit' || toolUse.name === 'Write' || toolUse.name === 'MultiEdit') {
    return <EditToolComponent toolUse={toolUse} />;
  }

  // Use WebToolComponent for WebSearch/WebFetch tools
  if (toolUse.name === 'WebSearch' || toolUse.name === 'WebFetch') {
    return <WebToolComponent toolUse={toolUse} />;
  }

  const [isExpanded, setIsExpanded] = useState(false);

  // Format tool parameters based on tool type
  const formatToolDisplay = () => {
    const input = toolUse.input;
    
    switch(toolUse.name) {
      case 'Read':
        return (
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">File:</span>
              <span className="text-xs text-gray-900 font-mono">{input.file_path}</span>
            </div>
            {input.offset && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Offset:</span>
                <span className="text-xs text-gray-900 font-mono">{input.offset}</span>
              </div>
            )}
            {input.limit && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Limit:</span>
                <span className="text-xs text-gray-900 font-mono">{input.limit} lines</span>
              </div>
            )}
          </div>
        );

      case 'Write':
      case 'Edit':
      case 'MultiEdit':
      case 'Bash':
        // These are handled in custom components
        return null;
        
      case 'Grep':
        return (
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Pattern:</span>
              <span className="text-xs text-gray-900 font-mono bg-yellow-50 px-1">{input.pattern}</span>
            </div>
            {input.path && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Path:</span>
                <span className="text-xs text-gray-900 font-mono">{input.path}</span>
              </div>
            )}
            {input.glob && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Glob:</span>
                <span className="text-xs text-gray-900 font-mono">{input.glob}</span>
              </div>
            )}
            {input.output_mode && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Mode:</span>
                <span className="text-xs text-gray-900">{input.output_mode}</span>
              </div>
            )}
            <div className="flex space-x-2 text-xs">
              {input['-i'] && <span className="bg-gray-100 px-1">case-insensitive</span>}
              {input['-n'] && <span className="bg-gray-100 px-1">line-numbers</span>}
              {input.multiline && <span className="bg-gray-100 px-1">multiline</span>}
            </div>
          </div>
        );
        
      case 'Glob':
        return (
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Pattern:</span>
              <span className="text-xs text-gray-900 font-mono">{input.pattern}</span>
            </div>
            {input.path && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Path:</span>
                <span className="text-xs text-gray-900 font-mono">{input.path}</span>
              </div>
            )}
          </div>
        );

      case 'WebSearch':
      case 'WebFetch':
        // These are handled in WebToolComponent
        return null;

      case 'Task':
        return (
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Agent:</span>
              <span className="text-xs text-gray-900">{input.subagent_type}</span>
            </div>
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Description:</span>
              <span className="text-xs text-gray-900">{input.description}</span>
            </div>
            <div>
              <span className="text-xs text-gray-600 font-semibold">Prompt:</span>
              <div className="text-xs text-gray-900 mt-1 max-h-24 overflow-y-auto">
                {input.prompt}
              </div>
            </div>
          </div>
        );
        
      case 'TodoWrite':
        return (
          <div className="flex gap-2 w-full text-sm">
            <div className="flex overflow-hidden flex-col flex-1 h-full shrink-1">
              {input.todos?.map((todo: TodoItem, i: number) => (
                <React.Fragment key={i}>
                  <div className="flex gap-2 items-center w-full">
                    <div className="p-1.5">
                      <div className="rounded-full size-1 bg-black/20 dark:bg-white/30"></div>
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                      <span>{i + 1}.</span>{' '}
                      <span
                        className={`${
                          todo.status === 'completed'
                            ? 'text-black/40 dark:text-white/40 line-through'
                            : todo.status === 'in_progress'
                            ? 'font-medium'
                            : ''
                        }`}
                      >
                        {todo.status === 'in_progress' ? todo.activeForm : todo.content}
                      </span>
                    </div>
                  </div>
                  {i < (input.todos?.length || 0) - 1 && (
                    <div className="h-1.5 w-[1px] bg-black/20 dark:bg-white/15 ml-2"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
        
      case 'NotebookEdit':
        return (
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Notebook:</span>
              <span className="text-xs text-gray-900 font-mono">{input.notebook_path}</span>
            </div>
            {input.cell_id && (
              <div className="flex">
                <span className="text-xs text-gray-600 font-semibold mr-2">Cell ID:</span>
                <span className="text-xs text-gray-900 font-mono">{input.cell_id}</span>
              </div>
            )}
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Type:</span>
              <span className="text-xs text-gray-900">{input.cell_type || 'default'}</span>
            </div>
            <div className="flex">
              <span className="text-xs text-gray-600 font-semibold mr-2">Mode:</span>
              <span className="text-xs text-gray-900">{input.edit_mode || 'replace'}</span>
            </div>
          </div>
        );
        
      case 'ExitPlanMode':
        return (
          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-semibold">Plan:</div>
            <div className="text-xs text-gray-900 bg-blue-50 p-2 border border-blue-200 max-h-32 overflow-y-auto">
              {input.plan}
            </div>
          </div>
        );
        
      default:
        // Fallback to raw JSON for unknown tools
        return (
          <pre className="text-xs bg-white p-2 border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(input, null, 2)}
          </pre>
        );
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col flex-1 bg-white/60 dark:bg-[#0C0E10]">
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-black/10 dark:border-white/10">
          <div className="flex gap-2 items-center">
            <ToolIcon toolName={toolUse.name} />
            <div className="text-sm font-medium leading-5">{toolUse.name}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex p-1 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 duration-150 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-4 transition-all ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="flex gap-2 p-4 w-full text-sm">
            {formatToolDisplay()}
          </div>
        )}
      </div>
    </div>
  );
}

function TextComponent({ text }: { text: TextBlock }) {
  return (
    <div className="text-base" style={{ color: 'rgb(var(--text-primary))' }}>
      <div className="prose prose-base max-w-none prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize link rendering
            a: ({ node, ...props }) => (
              <a {...props} style={{ color: 'rgb(var(--text-primary))' }} className="hover:opacity-70 underline" />
            ),
            // Customize code rendering
            code: ({ node, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const inline = !className;

              return !inline ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={language || 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: '0.5rem 0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="px-1 py-0.5 text-xs font-mono" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgb(var(--text-primary))' }} {...props}>
                  {children}
                </code>
              );
            },
            // Customize list rendering
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 space-y-1" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 space-y-1" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
            // Customize paragraph spacing
            p: ({ node, ...props }) => (
              <p className="mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
            ),
          }}
        >
          {text.text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div className="message-container group">
      <div className="message-assistant-wrapper">
        <div className="message-assistant-content">
          {/* Header with avatar and model name */}
          <div className="message-assistant-header">
            <img
              src="/client/agent-boy.svg"
              className="message-assistant-avatar"
              alt="Agent Boy"
            />
            <div className="message-assistant-name-container">
              <span className="message-assistant-name">
                {message.metadata?.model || 'Agent Boy'}
              </span>
              <span className="message-assistant-timestamp invisible group-hover:visible">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>

          {/* Message body */}
          <div className="message-assistant-body">
            <div className="space-y-2 mt-2">
              {message.content.map((block, index) => {
                if (block.type === 'text') {
                  return <TextComponent key={index} text={block} />;
                } else if (block.type === 'tool_use') {
                  return <ToolUseComponent key={index} toolUse={block} />;
                } else if (block.type === 'thinking') {
                  return <ThinkingBlock key={index} title="Thinking..." content={block.thinking} />;
                }
                return null;
              })}
            </div>

            {/* Action buttons */}
            <div className="message-assistant-actions">
              <button
                className="message-action-btn"
                aria-label="Copy"
                title="Copy response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.875 4.66161V2.92944C4.875 2.34696 5.3472 1.87476 5.92969 1.87476H15.0703C15.6528 1.87476 16.125 2.34696 16.125 2.92944V12.0701C16.125 12.6526 15.6528 13.1248 15.0703 13.1248H13.3186" />
                  <path strokeLinejoin="round" d="M12.0703 4.87476H2.92969C2.3472 4.87476 1.875 5.34696 1.875 5.92944V15.0701C1.875 15.6526 2.3472 16.1248 2.92969 16.1248H12.0703C12.6528 16.1248 13.125 15.6526 13.125 15.0701V5.92944C13.125 5.34696 12.6528 4.87476 12.0703 4.87476Z" />
                </svg>
              </button>
              <button
                className="message-action-btn"
                aria-label="Regenerate"
                title="Regenerate response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              {message.metadata && (
                <button
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="message-action-btn"
                  aria-label="Metadata"
                  title="Show metadata"
                >
                  <span className="text-xs font-mono">{showMetadata ? '[-]' : '[+]'}</span>
                </button>
              )}
            </div>

            {/* Metadata panel */}
            {message.metadata && showMetadata && (
              <div className="mt-2 p-2 bg-black/5 border border-white/10 rounded text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-gray-400">
                  {JSON.stringify(message.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}