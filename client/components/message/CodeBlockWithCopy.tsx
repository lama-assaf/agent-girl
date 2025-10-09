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

import React, { useState } from 'react';
import { SyntaxHighlighter, vscDarkPlus } from '../../utils/syntaxHighlighter';
import { showError } from '../../utils/errorMessages';

interface CodeBlockWithCopyProps {
  code: string;
  language: string;
  customStyle?: React.CSSProperties;
  wrapperClassName?: string;
}

export function CodeBlockWithCopy({ code, language, customStyle, wrapperClassName }: CodeBlockWithCopyProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      showError('COPY_FAILED', errorMsg);
    }
  };

  // Always use dark mode
  const buttonStyle = (buttonName: string) => ({
    cursor: 'pointer',
    backgroundColor: hoveredButton === buttonName
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  });

  const codeStyle: { [key: string]: React.CSSProperties } = vscDarkPlus as unknown as { [key: string]: React.CSSProperties };

  return (
    <div className={`relative my-2 flex flex-col rounded-lg ${wrapperClassName || ''}`} dir="ltr">
      {/* Language label */}
      <div className="absolute py-1.5 pl-4 text-xs font-medium text-white" style={{ zIndex: 20 }}>
        {language}
      </div>

      {/* Toolbar buttons - positioned on top of title bar */}
      <div className="sticky flex items-center justify-end text-xs text-white" style={{ top: '2rem', zIndex: 11, height: '2rem', paddingTop: '0.25rem', paddingBottom: '0.25rem', paddingRight: '0.75rem' }}>
        <div className="flex items-center gap-0.5">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="px-1.5 py-0.5 rounded-md border-none transition copy-code-button"
            style={buttonStyle('copy')}
            onMouseEnter={() => setHoveredButton('copy')}
            onMouseLeave={() => setHoveredButton(null)}
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code block */}
      <div style={{ marginTop: '-2rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
        {/* Title bar background */}
        <div style={{
          height: '2rem',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          backgroundColor: '#0C0E10', // Always use dark mode
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          marginBottom: 0,
        }}></div>

        {/* Code content */}
        <SyntaxHighlighter
          style={codeStyle}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            ...customStyle,
            margin: 0,
            marginTop: 0,
            paddingTop: '1rem',
            borderRadius: '0 0 0.5rem 0.5rem',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
