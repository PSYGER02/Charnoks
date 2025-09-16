// Debug script to check user data
import { supabase } from './src/supabaseConfig.js';

async function debugUserData() {
  try {
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth error:', error);
      return;
    }
    
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    console.log('=== USER DEBUG INFO ===');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('User metadata:', user.user_metadata);
    console.log('App metadata:', user.app_metadata);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);
    
  } catch (err) {
    console.error('Debug error:', err);
  }
}

debugUserData();