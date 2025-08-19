
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content?: string | null;
  created_at: string;
  user_id: string;
}

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view notes');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at, user_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load notes');
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNoteTitle.trim()) return;

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to add notes');
        setAdding(false);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title: newNoteTitle.trim(),
          content: '',
          user_id: user.id
        }])
        .select('id, title, content, created_at, user_id')
        .single();

      if (error) {
        console.error('Error adding note:', error);
        toast.error('Failed to add note');
      } else {
        setNotes(prev => [data, ...prev]);
        setNewNoteTitle('');
        toast.success('Note added successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addNote();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={addNote} 
              disabled={adding || !newNoteTitle.trim()}
            >
              {adding ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No notes yet. Add your first note above!</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <p className="text-lg font-medium">{note.title}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(note.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notes;
