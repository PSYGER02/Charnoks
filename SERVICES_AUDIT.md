# Services Architecture Analysis
*Generated on September 24, 2025*

## Current Services Directory Audit

### ✅ **KEEP - Client-Side Services** (According to Specification)
```
services/ (Client-Side - KEEP)
├── ✅ aiAssistant.ts              # Client AI coordinator
├── ✅ AIAgentService.ts           # Client AI workflow
├── ✅ connectionService.ts        # Network detection
├── ✅ enhancedSyncService.ts      # Enhanced sync logic
├── ✅ expenseService.ts           # Client expense operations
├── ✅ offlineFirstDataService.ts  # Offline data management
├── ✅ offlineService.ts           # IndexedDB operations
├── ✅ optimizedAIService.ts       # Client AI optimization
├── ✅ productService.ts           # Client product operations  
├── ✅ salesService.ts             # Client sales operations
├── ✅ smartSaveService.ts         # Offline-first data access
├── ✅ stockService.ts             # Client stock operations
├── ✅ supabaseService.ts          # Client auth & RLS
├── ✅ syncService.ts              # Client synchronization
└── ✅ mcpClient.ts                # Already exists - MCP client
```

### ❌ **REMOVE - Server-Side Services** (Move to MCP Server)
```
services/ (Server-Side - REMOVE)
├── ❌ chickenMemoryService.ts     # MCP memory graph integration
├── ❌ unifiedAI.ts                # Multi-role AI orchestration  
├── ❌ rateLimitService.ts         # Server-side rate limiting
└── ❌ [Additional server files identified below]
```

### 🔍 **ANALYZE - Unclear Classification**
```
services/ (Need Classification)
├── 🔍 aiAssistant-enhanced.ts     # Enhanced version?
├── 🔍 aiService.optimized.ts      # Optimized version?
├── 🔍 chatHistoryService.ts       # Client or server chat?
├── 🔍 chickenBusinessAI.ts        # Uses SERVICE_ROLE_KEY - SERVER?
├── 🔍 chickenBusinessAI-enhanced.ts # Enhanced version?
├── 🔍 dataFixService.ts           # Data migration/fix - SERVER?
├── 🔍 edgeFunctionClient.ts       # Edge function client - CLIENT?
├── 🔍 geminiService.ts            # Client Gemini calls - CLIENT?
├── 🔍 mcpIntegration.ts           # MCP integration - CLIENT?
├── 🔍 offlineDataInitService.ts   # Offline data init - CLIENT?
├── 🔍 smartStockIntegration.ts    # Stock integration - CLIENT?
├── 🔍 smartSyncService.ts         # Smart sync - CLIENT?  
├── 🔍 summaryService.ts           # Data summaries - CLIENT/SERVER?
├── 🔍 unifiedDataService.ts       # Unified data access - CLIENT?
├── 🔍 workerBranchSyncService.ts  # Worker sync - CLIENT?
└── 🔍 workerService.ts            # Worker management - CLIENT?
```

## Files Using Server-Side Features (SERVICE_ROLE_KEY)

### ❌ **chickenBusinessAI.ts** - NEEDS REFACTORING
- **Issue**: Uses `VITE_SUPABASE_SERVICE_ROLE_KEY` (dangerous in client)
- **Action**: Refactor to use client-side auth or move to server
- **Dependencies**: References server-side services

## Missing from Specification
These files exist but weren't mentioned in your specification:

### Duplicate/Enhanced Files
- `aiAssistant-enhanced.ts` vs `aiAssistant.ts`
- `aiService.optimized.ts` vs `optimizedAIService.ts`  
- `chickenBusinessAI-enhanced.ts` vs `chickenBusinessAI.ts`

### Additional Services Not in Spec
- `chatHistoryService.ts`
- `dataFixService.ts`
- `edgeFunctionClient.ts`
- `summaryService.ts`
- `unifiedDataService.ts`
- `workerBranchSyncService.ts`
- `workerService.ts`

## Recommended Actions

### Phase 1: Remove Clear Server-Side Services
```bash
# Remove confirmed server-side services
rm services/chickenMemoryService.ts
rm services/unifiedAI.ts  
rm services/rateLimitService.ts
```

### Phase 2: Fix Security Issues
```bash
# chickenBusinessAI.ts uses SERVICE_ROLE_KEY - needs refactoring
# Either move to server or refactor for client-side use
```

### Phase 3: Clean Up Duplicates
```bash
# Remove duplicate/enhanced versions if not needed
rm services/aiAssistant-enhanced.ts
rm services/aiService.optimized.ts
rm services/chickenBusinessAI-enhanced.ts
```