import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseConfig';

const NotesViewer: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading notes...</div>;

  return (
    <div className="modern-card p-4">
      <h3 className="text-lg font-bold mb-3">📋 Recent Notes ({notes.length})</h3>
      {notes.length === 0 ? (
        <p className="text-text-secondary">No notes yet. Start adding stock notes above!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-black/20 rounded-lg">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>{note.user_role}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  note.status === 'applied' ? 'bg-blue-600 text-white' :
                  note.status === 'parsed' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {note.status === 'applied' ? '✅ Applied' :
                   note.status === 'parsed' ? '🤖 Parsed' : '⏳ Pending'}
                </span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm mb-2">{note.content}</p>
              {note.parsed_data && (
                <div className="text-xs bg-green-900/30 p-2 rounded">
                  <strong>AI Parsed:</strong> {JSON.stringify(note.parsed_data).substring(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesViewer;