import React, { useState } from 'react';
import { supabase } from '../src/supabaseConfig';
import { aiAgent } from '../services/AIAgentService';
import { offlineDB } from '../services/offlineService';
import { useAuth } from '../hooks/useSupabaseAuth';

interface NoteInputProps {
  userRole: 'owner' | 'worker';
  onNoteSaved?: () => void;
}

const NoteInput: React.FC<NoteInputProps> = ({ userRole, onNoteSaved }) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const processNote = async () => {
    if (!note.trim()) return;
    
    setParsing(true);
    try {
      // Save to IndexedDB first (offline-first)
      await offlineDB.save('notes', { content: note, user_role: userRole });
      
      // Try AI processing if online
      if (navigator.onLine) {
        const result = await aiAgent.processNote(note, userRole);
        setParsedData(result.parsed || { status: 'processed' });
        alert('✅ Processed and synced!');
      } else {
        alert('💾 Saved offline - will sync when online');
      }
      
      setNote('');
      onNoteSaved?.();
    } catch (error) {
      console.warn('Process error:', error);
    } finally {
      setParsing(false);
    }
  };

  const applyToStock = async () => {
    if (!parsedData || !savedNoteId || !user) return;
    
    setApplying(true);
    try {
      const result = await applyParsedDataToStock(savedNoteId, parsedData, user.uid);
      if (result.success) {
        alert('✅ Applied to stock successfully!');
        setNote('');
        setParsedData(null);
        setSavedNoteId(null);
        onNoteSaved?.();
      } else {
        alert('❌ Failed to apply to stock');
      }
    } catch (error) {
      console.error('Failed to apply to stock:', error);
    } finally {
      setApplying(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.from('notes').insert({
        content: note,
        user_role: userRole,
        parsed_data: parsedData,
        status: parsedData ? 'parsed' : 'pending',
        created_at: new Date().toISOString()
      }).select().single();
      
      if (error) throw error;
      
      setSavedNoteId(data.id);
      onNoteSaved?.();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modern-card p-4">
      <h3 className="text-lg font-bold mb-3">📝 Stock Notes</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={userRole === 'owner' 
          ? "e.g. Bought magnolia whole chicken 20 bags, each bag 10 chickens"
          : "e.g. Cooked 1 bag, sold 20 pieces at 35 pesos"
        }
        rows={3}
        className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={processNote}
          disabled={!note.trim() || parsing}
          className="px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
        >
          {parsing ? 'Processing...' : '🚀 Process'}
        </button>
        <button
          onClick={saveNote}
          disabled={!note.trim() || saving}
          className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {parsedData && savedNoteId && (
          <button
            onClick={applyToStock}
            disabled={applying}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {applying ? 'Applying...' : '📊 Apply to Stock'}
          </button>
        )}
      </div>
      
      {parsedData && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <h4 className="text-green-300 font-medium mb-2">✅ AI Parsed Data:</h4>
          <pre className="text-xs text-green-200 overflow-auto">
            {JSON.stringify(parsedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NoteInput;