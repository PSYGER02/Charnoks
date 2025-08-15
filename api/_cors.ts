import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_ALLOWED = '*';

export function setCorsHeaders(res: VercelResponse, origin?: string) {
  const allowed = process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED;
  const origins = allowed.split(',').map(s => s.trim());

  const allowOrigin = origins.includes('*') ? '*' : (origin && origins.includes(origin) ? origin : origins[0]);

  res.setHeader('Access-Control-Allow-Origin', allowOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Security headers recommended
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  return res;
}

export function handlePreflight(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req.headers.origin as string | undefined);
    res.status(204).end();
    return true;
  }
  setCorsHeaders(res, req.headers.origin as string | undefined);
  return false;
}

export default { setCorsHeaders, handlePreflight };
