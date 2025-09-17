# Efficient Code Review Strategy

## Priority Focus Areas (Review These First)
1. **Security vulnerabilities** - XSS, injection, authentication bypasses
2. **Memory leaks** - Uncleaned timeouts, event listeners, subscriptions
3. **Data consistency** - Race conditions, stale data, cache mismatches
4. **Performance bottlenecks** - Unnecessary re-renders, inefficient loops, blocking operations

## Ignore These Common Patterns (Low Priority)
- Hard-coded strings/numbers unless they're security-related
- Minor naming inconsistencies unless they cause confusion
- Cosmetic code style issues (spacing, formatting)
- Missing TypeScript types unless they cause runtime errors
- Unused imports/variables unless they impact bundle size significantly
- Magic numbers in UI components (margins, delays) unless they affect UX

## Focus on Root Causes, Not Symptoms
- Look for systemic patterns across multiple files
- Identify architectural issues that cause multiple smaller problems
- Prioritize fixes that prevent entire classes of bugs
- Focus on user-facing impact over developer convenience

## Efficient Review Process
1. **Scan for security first** - Input validation, output encoding, auth checks
2. **Check data flow** - How data moves between components, potential race conditions
3. **Identify performance patterns** - Expensive operations, unnecessary computations
4. **Look for error boundaries** - What happens when things fail

## Skip These Unless Explicitly Asked
- Code formatting and style consistency
- Documentation completeness
- Test coverage analysis
- Dependency version updates
- Build configuration optimizations