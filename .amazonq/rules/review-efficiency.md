# Review Efficiency Guidelines

## Batch Similar Issues
- Group all XSS issues together for systematic fixing
- Combine all memory leak patterns into one fix session
- Address all error handling gaps in related files together

## Impact-Based Prioritization
1. **Critical** - Security vulnerabilities, data corruption, app crashes
2. **High** - Performance issues affecting user experience, memory leaks
3. **Medium** - Code maintainability, consistency issues
4. **Low** - Style preferences, minor optimizations

## Efficient Reporting
- Report only actionable issues with clear fix paths
- Skip issues that are "nice to have" but don't impact functionality
- Focus on patterns that appear in multiple files
- Provide specific line numbers and concrete solutions

## Smart Filtering Rules
- If it doesn't affect end users → Low priority
- If it doesn't cause bugs → Medium priority  
- If it could cause security issues → Critical priority
- If it impacts performance → High priority

## Review Scope Optimization
- For new features: Focus on security and integration points
- For bug fixes: Focus on error handling and edge cases
- For refactoring: Focus on maintaining existing functionality
- For performance: Focus on bottlenecks and resource usage