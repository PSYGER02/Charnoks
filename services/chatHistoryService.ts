import { supabase } from '../src/supabaseConfig';

export interface ChatMessage {
  id?: number;
  user_id: string;
  message: string;
  sender: 'user' | 'ai';
  created_at?: string;
}

export const chatHistoryService = {
  async saveChatMessage(userId: string, message: string, sender: 'user' | 'ai') {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ user_id: userId, message, sender }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async getChatHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async clearChatHistory(userId: string) {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};