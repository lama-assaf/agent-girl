import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, X, Shield } from 'lucide-react';

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
                a: ({ node, ...props }) => (
                  <a {...props} style={{ color: 'rgb(var(--blue-accent))' }} className="hover:opacity-80 underline transition-opacity" />
                ),
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
                        margin: '1rem 0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="px-1.5 py-1 text-xs font-mono rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'rgb(var(--text-primary))' }} {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mt-5 mb-3" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 space-y-2 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 space-y-2 marker:text-gray-400" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-4 leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }} {...props} />
                ),
                strong: ({ node, ...props }) => (
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
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'rgb(239, 68, 68)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <X size={16} />
            Reject
          </button>
          <button
            onClick={onApprove}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              background: 'rgba(34, 197, 94, 0.1)',
              color: 'rgb(34, 197, 94)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
            }}
          >
            <Check size={16} />
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
}
