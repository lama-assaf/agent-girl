import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { AboutModal } from './AboutModal';

export function AboutButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="About Agent Girl"
        title="About"
      >
        <Info className="w-4 h-4" style={{ color: 'rgb(var(--text-secondary))' }} />
      </button>

      {isModalOpen && <AboutModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
