# Amazon Q Developer Integration Guide

## Quick Setup (5 minutes)

### 1. Install Amazon Q Developer Extension
- Open VS Code in this Codespace
- Install "Amazon Q Developer" extension
- Enable "Show Code With References" in settings

### 2. Test Metadata Endpoint
```bash
curl -X POST https://your-domain/api/q/metadata \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_Q_META_KEY", "tables":["products","notes"], "sample_rows":3}'
```

### 3. Use Q Prompts
Copy prompts from `/utils/qPrompts.ts`:

**Find Files:**
```
/model Claude Sonnet 4
Search the repo for files mentioning "StockManagementPage", "IndexedDB", "pending_sync". Return JSON: {"found_files":[...]} only.
```

**Validate Schema:**
Paste metadata JSON, then:
```
Confirm table & column names exist. Return corrected SQL if needed.
```

**Parse Stock Notes:**
```
System: You are a strict JSON-only extractor...
User: Parse this note: "Bought 20 bags chicken, cooked 5 bags"
```

## Database Tables Added
- `summaries` - Daily aggregated insights
- `ai_audit_logs` - AI interaction tracking

## Next Steps
1. Set `Q_META_KEY` environment variable
2. Run `create-summaries-table.sql`
3. Test Q Developer with repository analysis
4. Use standardized prompts for consistent results