
import React from 'react';
import Notes from '@/components/Notes';
import AppLayout from '@/components/layout/AppLayout';

const NotesPage: React.FC = () => {
  return (
    <AppLayout>
      <main className="py-8">
        <Notes />
      </main>
    </AppLayout>
  );
};

export default NotesPage;
