import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Create Worker Account API Endpoint
 * This endpoint uses the service role key to create worker accounts
 * Only accessible by authenticated owners
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { name, email, password, ownerToken } = req.body;

        // Validate input
        if (!name || !email || !password || !ownerToken) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Get Supabase service role key
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            res.status(500).json({ error: 'Server configuration missing' });
            return;
        }

        // Create admin client
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Verify the owner token (this should be the owner's JWT)
        const { data: { user: owner }, error: verifyError } = await supabaseAdmin.auth.getUser(ownerToken);

        if (verifyError || !owner) {
            res.status(401).json({ error: 'Invalid owner token' });
            return;
        }

        // Check if the user is actually an owner
        const { data: ownerProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', owner.id)
            .single();

        if (profileError || ownerProfile?.role !== 'owner') {
            res.status(403).json({ error: 'Only owners can create worker accounts' });
            return;
        }

        // Create the worker account using admin client
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                display_name: name,
                role: 'worker'
            },
            email_confirm: true // Auto-confirm email
        });

        if (createError) {
            const sanitizedError = createError.message?.replace(/[\r\n]/g, ' ') || 'Unknown error';
            console.error('Error creating worker:', sanitizedError);
            res.status(400).json({ error: createError.message });
            return;
        }

        if (!newUser.user) {
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }

        // The trigger should automatically create the profile, but let's verify
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: workerProfile, error: workerProfileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', newUser.user.id)
            .single();

        if (workerProfileError) {
            // Create profile manually if trigger failed
            const { error: manualCreateError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    id: newUser.user.id,
                    email,
                    display_name: name,
                    role: 'worker'
                });

            if (manualCreateError) {
                const sanitizedError = manualCreateError.message?.replace(/[\r\n]/g, ' ') || 'Unknown error';
                console.error('Error creating worker profile:', sanitizedError);
                res.status(500).json({ error: 'Failed to create worker profile' });
                return;
            }
        }

        // Return success
        res.status(200).json({
            success: true,
            worker: {
                id: newUser.user.id,
                email: newUser.user.email,
                displayName: name,
                role: 'worker'
            }
        });

    } catch (error) {
        console.error('Error in createWorkerAccount:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}