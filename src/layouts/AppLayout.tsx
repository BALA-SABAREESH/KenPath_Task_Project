import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ReadingModal } from '../components/ReadingModal';
import { DatabaseModal } from '../components/DatabaseModal';
import { Reading } from '../types';

export const AppLayout: React.FC = () => {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [lastSavedReading, setLastSavedReading] = useState<Reading | null>(null);

  const handleReadingSaved = (reading: Reading) => {
    setLastSavedReading(reading);
    // Dispatch custom event so child pages can auto-refresh immediately without reload
    window.dispatchEvent(new CustomEvent('sweety:reading-saved', { detail: reading }));
  };

  return (
    <div className="min-h-screen bg-[#faf8fd] flex flex-col font-sans">
      <Navbar
        onOpenLogModal={() => setIsLogModalOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        <Sidebar
          onOpenLogModal={() => setIsLogModalOpen(true)}
          onOpenDbModal={() => setIsDbModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ lastSavedReading }} />
        </main>
      </div>

      <ReadingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSaved={handleReadingSaved}
      />

      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};
