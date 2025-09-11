import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// Type for validated environment
export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(): {
  isValid: boolean;
  env: ValidatedEnv | null;
  errors: string[];
} {
  try {
    const env = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    const result = envSchema.safeParse(env);

    if (!result.success) {
      return {
        isValid: false,
        env: null,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }

    return {
      isValid: true,
      env: result.data,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      env: null,
      errors: ['Failed to validate environment variables'],
    };
  }
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

// Function to get environment status for UI display
export function getEnvStatus(): {
  supabase: boolean;
  gemini: boolean;
  adminApi: boolean;
} {
  const { env } = validateEnv();
  
  return {
    supabase: Boolean(env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_ANON_KEY),
    gemini: Boolean(env?.GEMINI_API_KEY),
    adminApi: Boolean(env?.SUPABASE_SERVICE_ROLE_KEY),
  };
}
