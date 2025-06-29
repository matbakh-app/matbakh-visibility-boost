
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Notes from '@/components/Notes';

const NotesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-8">
        <Notes />
      </main>
      <Footer />
    </div>
  );
};

export default NotesPage;
