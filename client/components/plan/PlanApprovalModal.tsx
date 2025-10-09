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

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxHighlighter, vscDarkPlus } from '../../utils/syntaxHighlighter';
import { CodeBlockWithCopy } from '../message/CodeBlockWithCopy';
import { Shield } from 'lucide-react';

interface PlanApprovalModalProps {
  plan: string;
  onApprove: () => void;
  onReject: () => void;
}

export function PlanApprovalModal({ plan, onApprove, onReject }: PlanApprovalModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => {
        // Close modal if backdrop is clicked
        if (e.target === e.currentTarget) {
          onReject();
        }
      }}
    >
      <div
        style={{
          background: 'rgb(var(--bg-input))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '48rem',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Shield size={24} style={{ color: 'rgb(59, 130, 246)' }} />
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'rgb(var(--text-primary))',
                margin: 0,
              }}
            >
              Review Implementation Plan
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'rgb(var(--text-secondary))',
                margin: '0.25rem 0 0 0',
              }}
            >
              Review the plan before execution
            </p>
          </div>
        </div>

        {/* Plan Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div className="prose prose-base max-w-none prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: (props) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(var(--blue-accent))' }} className="hover:opacity-80 underline transition-opacity" />
                ),
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const inline = !className;

                  return !inline ? (
                    <CodeBlockWithCopy
                      code={String(children).replace(/\n$/, '')}
                      language={language}
                      customStyle={{
                        margin: '1rem 0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    />
                  ) : (
                    <code className="px-1.5 py-1 text-xs font-mono rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'rgb(var(--text-primary))' }}>
                      {children}
                    </code>
                  );
                },
                h1: (props) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                h2: (props) => (
                  <h2 className="text-xl font-bold mt-5 mb-3" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                h3: (props) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                ul: (props) => (
                  <ul className="list-disc pl-6 space-y-2 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                ol: (props) => (
                  <ol className="list-decimal pl-6 space-y-2 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                li: (props) => (
                  <li className="leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                p: (props) => (
                  <p className="mb-4 leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                strong: (props) => (
                  <strong className="font-bold" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
              }}
            >
              {plan}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer with buttons */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onReject}
            className="stop-button-active"
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
            }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="send-button-active"
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
            }}
          >
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
}
