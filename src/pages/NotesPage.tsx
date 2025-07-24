
/*
 * Layout-Struktur zentralisiert – keine eigenen Layout-Komponenten mehr verwenden. 
 * Änderungen nur nach Rücksprache.
 */

import React from 'react';
import Notes from '@/components/Notes';

const NotesPage: React.FC = () => {
  return (
    <main className="py-8">
      <Notes />
    </main>
  );
};

export default NotesPage;
