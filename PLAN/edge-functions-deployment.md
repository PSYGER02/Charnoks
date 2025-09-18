# EDGE FUNCTIONS DEPLOYMENT GUIDE

## PART 1: /sync ENDPOINT ✅ IMPLEMENTED

### Files Created:
- `/api/sync.ts` - Edge Function for batch operations
- `/services/edgeFunctionClient.ts` - Client service with rate limiting

### Gemini Rate Limits Integration:
```
Model                    RPM    TPM        RPD
gemini-2.0-flash-lite    30     1,000,000  200   ← Default (fastest)
gemini-2.0-flash         15     1,000,000  200
gemini-2.5-flash-lite    15     250,000    1,000
gemini-2.5-flash         10     250,000    250
gemini-2.5-pro           5      250,000    100
gemini-embedding         100    30,000     1,000
```

### Key Features Implemented:
- **Batch Processing**: Max 50 items per request
- **Idempotency**: local_uuid deduplication
- **Rate Limiting**: Integrated with existing rateLimitService
- **Authentication**: x-client-key header validation
- **Auto-sync**: Every 30 seconds + online event
- **Queue Management**: Auto-batch when 10+ items queued

### Environment Variables Needed:
```bash
# Supabase Edge Function Secrets
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SYNC_CLIENT_KEY=your-random-client-key
GEMINI_API_KEY=your-gemini-api-key

# Client Environment (.env)
VITE_SUPABASE_URL=your-project-url
VITE_SYNC_CLIENT_KEY=same-client-key-as-above
```

### Deployment Steps:
1. **Install Supabase CLI**: `npm install -g supabase`
2. **Login**: `supabase login`
3. **Link Project**: `supabase link --project-ref your-project-id`
4. **Deploy Function**: `supabase functions deploy sync --project-ref your-project-id`
5. **Set Secrets**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
   supabase secrets set SYNC_CLIENT_KEY=your-random-key
   ```

### Usage Example:
```typescript
import { edgeFunctionClient } from './services/edgeFunctionClient';

// Queue operations for sync
await edgeFunctionClient.queueForSync({
  kind: 'operation',
  op_type: 'cook',
  branch_id: 'branch-1',
  quantity_parts: 40
});

// Manual batch sync
const result = await edgeFunctionClient.syncBatch([
  { kind: 'note', content: 'Bought 20 bags chicken' },
  { kind: 'operation', op_type: 'purchase', quantity_bags: 20 }
]);
```

### Response Format:
```json
{
  "results": [
    {"local_uuid": "uuid-1", "status": "inserted", "id": "db-id"},
    {"local_uuid": "uuid-2", "status": "duplicate", "existing_id": "existing-id"},
    {"local_uuid": "uuid-3", "status": "error", "error": "validation failed"}
  ]
}
```

## NEXT: PART 2 - /parseNote ENDPOINT

### Planned Features:
- Raw note → structured JSON parsing
- Embedding generation for RAG
- Human-in-the-loop validation
- Model selection based on complexity
- Strict JSON schema validation

### Model Selection Strategy:
- **Simple notes**: gemini-2.0-flash-lite (30 RPM)
- **Complex parsing**: gemini-2.5-flash (10 RPM)  
- **High accuracy**: gemini-2.5-pro (5 RPM)
- **Embeddings**: gemini-embedding (100 RPM)

### Implementation Priority:
1. ✅ Batch sync endpoint (/sync)
2. ✅ Note parsing endpoint (/parseNote) 
3. ✅ RAG similarity search (/similarNotes)
4. 📋 Rate limiting dashboard
5. 🔍 Error monitoring & alerts
6. 📊 Usage analytics

## PART 2: /parseNote & /similarNotes ENDPOINTS ✅ IMPLEMENTED

### Files Created:
- `/api/parseNote.ts` - AI note parsing with embeddings
- `/api/similarNotes.ts` - RAG similarity search
- Enhanced `/services/edgeFunctionClient.ts` with model selection

### Key Features:
- **Smart Model Selection**: Auto-selects optimal Gemini model based on content complexity
- **Rate Limiting**: 60 requests per hour per client
- **Embedding Generation**: Automatic vector embeddings for RAG
- **Fallback Parsing**: Graceful handling of invalid LLM responses
- **Similarity Search**: Find related notes using vector similarity
- **Audit Logging**: All AI interactions logged for debugging

### Model Selection Logic:
```typescript
// Simple notes (≤20 words): gemini-2.0-flash-lite (30 RPM)
// Medium complexity: gemini-2.0-flash (15 RPM) 
// Complex operations (>50 words, multiple ops): gemini-2.5-flash (10 RPM)
```

### Usage Examples:
```typescript
// Parse note with auto model selection
const result = await edgeFunctionClient.parseNote(
  "Bought 20 bags chicken, cooked 5 bags, sent 3 bags to branch 2",
  { user_role: 'worker', user_id: 'user-123' }
);

// Find similar notes
const similar = await edgeFunctionClient.getSimilarNotes(
  "chicken purchase", 5
);
```

### Deployment Commands:
```bash
# Deploy all functions
supabase functions deploy parseNote --project-ref your-project-id
supabase functions deploy similarNotes --project-ref your-project-id

# Set Gemini API key
supabase secrets set GEMINI_API_KEY=your-gemini-key
```