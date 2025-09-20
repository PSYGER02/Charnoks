import React, { useState } from 'react';
import { chickenBusinessAI } from '../services/chickenBusinessAI';
import { offlineDB } from '../services/offlineService';

interface NoteInputProps {
  userRole: 'owner' | 'worker';
  branchId?: string;
  onNoteSaved?: () => void;
}

const NoteInput: React.FC<NoteInputProps> = ({ userRole, branchId, onNoteSaved }) => {
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const processChickenNote = async () => {
    if (!note.trim()) return;
    
    setProcessing(true);
    setAiResult(null);
    setSuggestions([]);
    
    try {
      console.log('🧠 Processing chicken business note...');
      
      // Use ChickenBusinessAI to process the note
      const result = await chickenBusinessAI.processChickenNote(
        note, 
        userRole, 
        branchId
      );
      
      if (result.success) {
        setAiResult(result);
        setSuggestions(result.suggested_actions || []);
        
        // Show success with pattern info
        const pattern = result.pattern;
        alert(`✅ AI processed as: ${pattern?.business_type} (${Math.round((pattern?.confidence_score || 0) * 100)}% confidence)`);
        
        // Clear note after successful processing
        setNote('');
        onNoteSaved?.();
      } else {
        console.error('❌ AI processing failed:', result.error);
        alert(`❌ AI processing failed: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error processing note:', error);
      alert(`❌ Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const quickSaveNote = async () => {
    if (!note.trim()) return;
    
    try {
      // Quick save without AI processing for simple notes
      await offlineDB.save('notes', { 
        content: note, 
        user_role: userRole,
        business_type: 'general',
        local_uuid: crypto.randomUUID(),
        sync_status: 'pending'
      });
      
      alert('💾 Note saved locally');
      setNote('');
      onNoteSaved?.();
      
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      alert('❌ Failed to save note');
    }
  };

  return (
    <div className="modern-card p-4">
      <h3 className="text-lg font-bold mb-3">🧠 Chicken Business AI</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={userRole === 'owner' 
          ? "e.g. 'Buy magnolia whole chicken 20 bags (10 chickens per bag)' or 'Chopped 200 chickens into 35 bags parts + 10 neck bags'"
          : "e.g. 'Branch1 cooked 1 bag' or 'Leftovers: 20 pieces @35 pesos, 10 necks @15 pesos'"
        }
        rows={3}
        className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition"
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={processChickenNote}
          disabled={!note.trim() || processing}
          className="px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              AI Processing...
            </>
          ) : (
            <>🧠 AI Process</>
          )}
        </button>
        <button
          onClick={quickSaveNote}
          disabled={!note.trim()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50"
        >
          💾 Quick Save
        </button>
      </div>
      
      {/* AI Result Display */}
      {aiResult && aiResult.success && (
        <div className="mt-4 space-y-3">
          {/* Pattern Info */}
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-300 font-medium mb-2">🤖 AI Analysis:</h4>
            <div className="text-sm text-blue-200 space-y-1">
              <div><strong>Type:</strong> {aiResult.pattern?.business_type}</div>
              <div><strong>Confidence:</strong> {Math.round((aiResult.pattern?.confidence_score || 0) * 100)}%</div>
              {aiResult.pattern?.learned_patterns?.supplier && (
                <div><strong>Supplier:</strong> {aiResult.pattern.learned_patterns.supplier}</div>
              )}
              {aiResult.pattern?.learned_patterns?.bags && (
                <div><strong>Bags:</strong> {aiResult.pattern.learned_patterns.bags}</div>
              )}
              {aiResult.pattern?.learned_patterns?.branch && (
                <div><strong>Branch:</strong> {aiResult.pattern.learned_patterns.branch}</div>
              )}
            </div>
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h4 className="text-green-300 font-medium mb-2">💡 Suggested Actions:</h4>
              <ul className="text-sm text-green-200 space-y-1">
                {suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Stock Update Status */}
          {aiResult.should_update_stock && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-300 font-medium mb-2">📊 Stock Impact:</h4>
              <p className="text-sm text-yellow-200">
                This operation should update your inventory. Future versions will do this automatically!
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Error Display */}
      {aiResult && !aiResult.success && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h4 className="text-red-300 font-medium mb-2">❌ AI Error:</h4>
          <p className="text-sm text-red-200">{aiResult.error}</p>
        </div>
      )}
    </div>
  );
};

export default NoteInput;