import React, { useState, useRef, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCharCount(note.length);
  }, [note]);

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
        
        // Enhanced success feedback with revolutionary styling
        const pattern = result.pattern;
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span class="text-green-400">✨</span>
            </div>
            <div>
              <div class="font-medium text-green-300">AI Analysis Complete</div>
              <div class="text-sm text-green-200">${pattern?.business_type} (${Math.round((pattern?.confidence_score || 0) * 100)}% confidence)</div>
            </div>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 4000);
        
        // Clear note after successful processing
        setNote('');
        onNoteSaved?.();
      } else {
        console.error('❌ AI processing failed:', result.error);
        showErrorToast(`AI processing failed: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error processing note:', error);
      showErrorToast(`Error: ${error?.message || 'Unknown error'}`);
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
      
      showSuccessToast('Note saved locally');
      setNote('');
      onNoteSaved?.();
      
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      showErrorToast('Failed to save note');
    }
  };

  const showSuccessToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <span class="text-green-400">💾</span>
        </div>
        <span class="text-green-300">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const showErrorToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <span class="text-red-400">❌</span>
        </div>
        <span class="text-red-300">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!note.trim()) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="revolutionary-note-input">
      {/* Main Container with Revolutionary Glassmorphism */}
      <div className={`
        glass-card-premium p-8 
        border border-glass-border/40 
        bg-gradient-to-br from-glass-light/30 via-glass-light/20 to-glass-light/10 
        backdrop-blur-2xl
        shadow-glass-3
        transition-all duration-700 ease-out-cubic
        ${isExpanded ? 'scale-102 shadow-glass-4' : ''}
      `}>
        
        {/* Enhanced Header with Animated Icon */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`
            w-14 h-14 rounded-2xl 
            bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10
            border border-primary/30
            flex items-center justify-center 
            transition-all duration-500 ease-out-quart
            ${processing ? 'animate-pulse scale-110' : 'hover:scale-105'}
            relative overflow-hidden
          `}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-gradient-x"></div>
            <span className="text-2xl relative z-10 filter drop-shadow-sm">🧠</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Chicken Business AI
            </h3>
            <p className="text-text-secondary/80 text-sm font-medium">
              Intelligent business operations assistant
            </p>
          </div>
        </div>

        {/* Revolutionary Textarea with Smart Features */}
        <div className={`
          glass-input-group-premium relative mb-8
          transition-all duration-500 ease-out-quart
          ${isExpanded ? 'scale-102' : ''}
        `}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={userRole === 'owner' 
                ? "✨ Describe your business operation... e.g. 'Buy magnolia whole chicken 20 bags (10 chickens per bag)' or 'Chopped 200 chickens into 35 bags parts + 10 neck bags'"
                : "✨ Share your branch update... e.g. 'Branch1 cooked 1 bag' or 'Leftovers: 20 pieces @35 pesos, 10 necks @15 pesos'"
              }
              rows={isExpanded ? 6 : 4}
              maxLength={500}
              className={`
                w-full min-h-[140px] p-6 rounded-2xl
                bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent
                border border-glass-border/50
                backdrop-blur-xl
                text-text-primary text-lg leading-relaxed
                placeholder:text-text-secondary/60 placeholder:font-medium
                resize-none outline-none
                transition-all duration-500 ease-out-quart
                hover:border-primary/50 hover:shadow-glass-2
                focus:border-primary focus:shadow-glass-3 focus:bg-glass-light/30
                ${isExpanded ? 'min-h-[180px]' : ''}
              `}
            />
            
            {/* Character Counter with Smart Colors */}
            <div className={`
              absolute bottom-4 right-4 
              px-3 py-1 rounded-full text-xs font-medium
              backdrop-blur-xl border
              transition-all duration-300 ease-out-quart
              ${charCount > 450 ? 'bg-red-500/20 border-red-500/40 text-red-300' :
                charCount > 350 ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                'bg-glass-light/40 border-glass-border/40 text-text-secondary/80'
              }
            `}>
              {charCount}/500
            </div>

            {/* Smart Input Glow Effect */}
            <div className={`
              absolute inset-0 rounded-2xl pointer-events-none
              transition-opacity duration-500
              ${note.trim() ? 'opacity-100' : 'opacity-0'}
              bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10
              blur-xl -z-10
            `}></div>
          </div>
        </div>

        {/* Revolutionary Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={processChickenNote}
            disabled={!note.trim() || processing}
            className={`
              btn-primary-revolutionary flex-1 relative group overflow-hidden
              py-4 px-6 rounded-2xl font-semibold text-lg
              transition-all duration-500 ease-out-quart
              ${!note.trim() || processing ? 'opacity-60 cursor-not-allowed' : 'hover:scale-102 hover:shadow-glass-4'}
            `}
          >
            {processing ? (
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 border-3 border-transparent border-r-white/60 rounded-full animate-spin-slow"></div>
                </div>
                <span className="font-bold">AI Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl filter drop-shadow-sm">🧠</span>
                <span className="font-bold">AI Analyze</span>
              </div>
            )}
            
            {/* Revolutionary Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic"></div>
          </button>
          
          <button
            onClick={quickSaveNote}
            disabled={!note.trim()}
            className={`
              btn-secondary-revolutionary px-8 py-4 rounded-2xl
              font-semibold text-lg
              transition-all duration-300 ease-out-quart
              ${!note.trim() ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 hover:shadow-glass-3'}
            `}
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">💾</span>
              <span className="font-bold">Quick Save</span>
            </span>
          </button>
        </div>
        
        {/* Enhanced AI Result Display with Revolutionary Styling */}
        {aiResult && aiResult.success && (
          <div className="space-y-6 animate-slide-in-bottom">
            {/* Pattern Analysis Card */}
            <div className="glass-card-premium bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-blue-500/5 border border-blue-500/30 p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-400/40 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-blue-300">AI Analysis Results</h4>
                  <p className="text-blue-200/70 text-sm">Intelligent pattern recognition completed</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <div className="text-blue-200/60 text-sm font-medium mb-1">Business Type</div>
                  <div className="text-blue-300 font-bold text-lg">{aiResult.pattern?.business_type}</div>
                </div>
                
                <div className="glass-card bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <div className="text-blue-200/60 text-sm font-medium mb-1">Confidence Score</div>
                  <div className="flex items-center gap-2">
                    <div className="text-blue-300 font-bold text-lg">{Math.round((aiResult.pattern?.confidence_score || 0) * 100)}%</div>
                    <div className="flex-1 bg-blue-900/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out-cubic"
                        style={{ width: `${(aiResult.pattern?.confidence_score || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {aiResult.pattern?.learned_patterns?.supplier && (
                  <div className="glass-card bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <div className="text-blue-200/60 text-sm font-medium mb-1">Supplier</div>
                    <div className="text-blue-300 font-bold">{aiResult.pattern.learned_patterns.supplier}</div>
                  </div>
                )}
                
                {aiResult.pattern?.learned_patterns?.bags && (
                  <div className="glass-card bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <div className="text-blue-200/60 text-sm font-medium mb-1">Bags Processed</div>
                    <div className="text-blue-300 font-bold">{aiResult.pattern.learned_patterns.bags}</div>
                  </div>
                )}
                
                {aiResult.pattern?.learned_patterns?.branch && (
                  <div className="glass-card bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl col-span-full">
                    <div className="text-blue-200/60 text-sm font-medium mb-1">Branch Location</div>
                    <div className="text-blue-300 font-bold">{aiResult.pattern.learned_patterns.branch}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="glass-card-premium bg-gradient-to-br from-green-500/15 via-green-500/10 to-green-500/5 border border-green-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/30 to-green-600/20 border border-green-400/40 flex items-center justify-center">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-green-300">Smart Suggestions</h4>
                    <p className="text-green-200/70 text-sm">AI-powered recommendations for optimization</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {suggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="glass-card bg-green-500/10 border border-green-500/20 p-4 rounded-xl hover:bg-green-500/15 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-green-400 text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className="text-green-200 leading-relaxed">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stock Impact Indicator */}
            {aiResult.should_update_stock && (
              <div className="glass-card-premium bg-gradient-to-br from-yellow-500/15 via-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/30 to-yellow-600/20 border border-yellow-400/40 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-yellow-300">Inventory Impact</h4>
                    <p className="text-yellow-200/70 text-sm">Stock levels will be affected</p>
                  </div>
                </div>
                <p className="text-yellow-200 leading-relaxed">
                  This operation impacts your inventory. Future versions will automatically sync these changes with your stock management system.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced Error Display */}
        {aiResult && !aiResult.success && (
          <div className="glass-card-premium bg-gradient-to-br from-red-500/15 via-red-500/10 to-red-500/5 border border-red-500/30 p-6 rounded-2xl animate-slide-in-bottom">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400/30 to-red-600/20 border border-red-400/40 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-red-300">Processing Error</h4>
                <p className="text-red-200/70 text-sm">AI analysis encountered an issue</p>
              </div>
            </div>
            <p className="text-red-200 leading-relaxed">{aiResult.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteInput;