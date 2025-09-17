# Workspace Analysis Approach

## Problem-Solving Methodology

When encountering any issue, error, or implementing new features, always follow this systematic approach:

### 1. ANALYZE & SCAN FIRST
Before making any changes, identify all related components:

**Files to Check:**
- **Services**: `/services/` - Business logic, API calls, data processing
- **Components**: `/components/` - UI components that might be affected
- **Pages**: `/pages/` - Page-level components using the functionality
- **Utils**: `/utils/` - Helper functions, validation, security
- **Hooks**: `/hooks/` - React hooks for state management
- **API**: `/api/` - Backend endpoints and serverless functions
- **Types**: `/types.ts`, `/src/types/` - TypeScript definitions

**Database Tables to Consider:**
- **Core Tables**: `user_profiles`, `products`, `sales`, `expenses`, `notes`
- **Related Tables**: Check foreign keys and relationships
- **present tables in Database**
ai_analysis
ai_audit_logs
ai_conversations
branch_stock
daily_sales_summary
expense_summary
expenses
notes
product_performance
products
sales
summaries
user_profiles
workers

### 2. IDENTIFY DEPENDENCIES
Map out what affects what:
- Which components use which services?
- Which database tables are related?
- Which API endpoints are involved?
- What authentication/permissions are needed?

### 3. TRACE DATA FLOW
Follow the data path:
```
User Input → Component → Service → API → Database → Response → UI Update
```

### 4. CHECK EXISTING PATTERNS
Look for similar implementations:
- How are other features implemented?
- What patterns are already established?
- Are there existing utilities to reuse?

### 5. MINIMAL IMPACT CHANGES
- Modify only what's necessary
- Reuse existing code patterns
- Don't break existing functionality
- Test related components

## Example Analysis Process

**Problem**: "Add new feature X"

**Step 1 - Scan Related Files:**
```bash
# Find related components
find . -name "*.tsx" -type f | xargs grep -l "keyword"

# Find related services  
find ./services -name "*.ts" -type f

# Check database schema
grep -r "table_name" *.sql
```

**Step 2 - Identify Impact:**
- Which pages will use this feature?
- What database tables need updates?
- Which services need modification?
- What new API endpoints are needed?

**Step 3 - Plan Implementation:**
- List all files that need changes
- Identify potential breaking changes
- Plan testing approach
- Consider rollback strategy

This approach ensures comprehensive understanding before making changes, reducing bugs and maintaining code quality.