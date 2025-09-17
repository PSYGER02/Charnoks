# Code Review Filters - What to Skip

## Skip These File Types (Unless Security Issues)
- Configuration files (vite.config.ts, package.json) - only review for security
- Setup scripts - only check for credential exposure
- Type definition files - only if causing runtime errors

## Skip These Code Patterns
- Tailwind CSS class repetition - acceptable for UI consistency
- React key warnings using index - only flag if list reordering is expected
- Console.log statements - only flag in production builds
- TODO comments - only flag if blocking functionality
- Deprecated method warnings (substr vs slice) - low priority unless performance critical

## Always Review These Patterns
- User input handling without sanitization
- Database queries with user input
- Authentication/authorization logic
- Error messages displayed to users
- File upload handling
- API endpoint security
- State management race conditions
- Memory cleanup (useEffect cleanup, event listeners)

## Context-Aware Filtering
- In development files: Focus on security and data integrity
- In UI components: Focus on XSS prevention and performance
- In API files: Focus on input validation and error handling
- In utility files: Focus on edge cases and error boundaries