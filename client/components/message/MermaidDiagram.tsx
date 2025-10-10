import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid once
let mermaidInitialized = false;

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    // Initialize mermaid only once
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#A8C7FA',
          primaryTextColor: '#DAEEFF',
          primaryBorderColor: 'rgba(168, 199, 250, 0.3)',
          lineColor: 'rgba(168, 199, 250, 0.5)',
          secondaryColor: 'rgba(168, 199, 250, 0.1)',
          background: 'transparent',
          mainBkg: 'rgba(168, 199, 250, 0.1)',
          secondBkg: 'rgba(168, 199, 250, 0.05)',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
        },
        securityLevel: 'loose',
        suppressErrorRendering: true,
      });
      mermaidInitialized = true;
    }

    const renderDiagram = async () => {
      try {
        // First validate with parse()
        await mermaid.parse(chart, { suppressErrors: true });

        // If valid, render it
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        setSvg(renderedSvg);
        setIsValid(true);
      } catch {
        // Invalid syntax - fallback to code display
        setIsValid(false);
      }
    };

    renderDiagram();
  }, [chart]);

  // If invalid, show as code block
  if (!isValid || !svg) {
    return (
      <pre className="my-3 p-4 border border-white/10 rounded-lg bg-black/20 overflow-x-auto text-sm text-white/80 font-mono">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-3 p-4 border border-white/10 rounded-lg bg-black/20 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
