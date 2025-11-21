# Development Guidelines for Claude

This document provides guidelines for Claude when working with this codebase.

## Code Quality Principles

1. **Write readable, clean, maintainable, self-documenting code**
   - Use descriptive variable and function names that clearly convey intent
   - Keep functions small and focused on a single responsibility
   - Prefer clarity over cleverness
   - Write code that explains itself without requiring extensive comments

2. **Follow TypeScript Best Practices**
   - Use strict TypeScript typing throughout the codebase
   - Avoid `any` types - use proper type definitions
   - Leverage TypeScript's type inference where appropriate
   - Define clear interfaces and types for component props and data structures

3. **React 19 Best Practices**
   - Use functional components with hooks
   - Properly manage component lifecycle and side effects
   - Optimize re-renders using memoization when necessary
   - Follow React's composition patterns

4. **Code Style and Formatting**
   - Use Biome for linting and formatting (run `bun run check`)
   - Follow the existing code style conventions in the project
   - Keep consistent indentation and spacing
   - Use meaningful commit messages

5. **Component Architecture**
   - Keep components modular and reusable
   - Separate concerns: UI components, business logic, and data management
   - Use Radix UI components for accessible UI primitives
   - Style with Tailwind CSS using the established patterns

6. **Testing**
   - Write tests for new features using Vitest
   - Ensure tests are meaningful and test behavior, not implementation
   - Run tests before committing: `bun run test`
   - Aim for good test coverage: `bun run coverage`

7. **Performance Considerations**
   - Use virtualization for large datasets (TanStack Virtual)
   - Optimize bundle size and avoid unnecessary dependencies
   - Lazy load components when appropriate
   - Profile and measure before optimizing

8. **Documentation**
   - Keep README.md up to date
   - Document complex algorithms or business logic
   - Add JSDoc comments for public APIs
   - Update changelog for significant changes

9. **Dependencies**
   - Keep dependencies up to date
   - Evaluate new dependencies carefully for size and maintenance
   - Prefer well-maintained, popular libraries
   - Check security vulnerabilities regularly
   - **IMPORTANT**: For complex data formats and validation, prefer battle-tested libraries over hand-rolled implementations
     - YAML parsing/serialization: Use `js-yaml` instead of custom implementations
     - CSV parsing/serialization: Use `papaparse` or `csv-stringify` instead of regex-based solutions
     - Data validation: Use `zod`, `yup`, or similar validation libraries instead of custom regex patterns
     - Rationale: These libraries handle edge cases, encoding issues, and standards compliance that custom code often misses

10. **Build and Development**
    - Ensure the build passes: `bun run build`
    - Test the demo build: `bun run build:demo`
    - Use the dev server for rapid development: `bun run dev`
    - Fix type errors and linting issues before committing

## Project-Specific Notes

- This is a JSON viewer component library built with React 19
- Uses Vite for building and bundling
- Uses TanStack Table for data grid functionality
- Uses TanStack Virtual for virtualization
- Uses Radix UI for accessible component primitives
- Uses Tailwind CSS 4 for styling
- Uses Biome for linting and formatting (not ESLint/Prettier)

## Workflow

1. Make changes following the guidelines above
2. Run `bun run check` to format and lint
3. Run `bun run test` to ensure tests pass
4. Run `bun run build` to verify the build works
5. Commit with clear, descriptive messages
6. Push changes to the appropriate branch
