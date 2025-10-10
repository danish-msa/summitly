# Library Structure

This directory contains the core business logic, utilities, and shared resources for the application.

## Directory Structure

```
src/lib/
├── api/           # API functions and data fetching
├── constants/     # Application constants and configuration
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── validations/   # Form validation schemas
```

## API (`/api`)

Contains all API-related functions:
- `properties.ts` - Property listing API functions
- Future: `auth.ts`, `users.ts`, `agents.ts`

## Constants (`/constants`)

Application-wide constants:
- `navigation.ts` - Navigation menu structure
- `sample-data.ts` - Sample data for development

## Types (`/types`)

TypeScript type definitions:
- `index.ts` - All application types and interfaces

## Utils (`/utils`)

Utility functions:
- `format.ts` - Data formatting utilities
- `validation.ts` - Form validation utilities

## Usage

Import from the lib directory:

```typescript
// Import types
import { PropertyListing, User } from '@/lib/types';

// Import API functions
import { getListings, fetchPropertyTypes } from '@/lib/api/properties';

// Import utilities
import { formatCurrency, isValidEmail } from '@/lib/utils';

// Import constants
import { navLinks } from '@/lib/constants/navigation';
```

## Best Practices

1. **API Functions**: Keep all external API calls in the `/api` directory
2. **Types**: Define all TypeScript interfaces in `/types`
3. **Constants**: Store all magic strings and configuration in `/constants`
4. **Utils**: Create pure functions for common operations
5. **Validation**: Keep form validation logic in `/validations`
