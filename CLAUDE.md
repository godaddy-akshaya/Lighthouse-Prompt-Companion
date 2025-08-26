# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- **Start Development Server**: `npm run local` - Runs both the local HTTPS server and Next.js development server
- **Build Application**: `npm run build` - Builds the Next.js application
- **Start Production Server**: `npm run start` - Starts the production server
- **Development Build**: `npm run build:dev` - Builds the application with development environment
- **Start Development Build**: `npm run start:dev` - Starts the server with the development build

### Linting and Testing

- **Run ESLint**: `npm run lint` - Checks for code quality and style issues
- **Run ESLint with Auto-fix**: `npm run lint:fix` - Fixes linting issues when possible
- **Run Style Linting**: `npm run stylelint` - Checks SCSS files for style issues
- **Run Style Linting with Auto-fix**: `npm run stylelint:fix` - Fixes style issues when possible
- **Post-test Checks**: `npm run posttest` - Runs lint and stylelint after tests

### Other Utilities

- **Bundle Analysis**: `npm run analyze` - Analyzes the application bundle size
- **Size Limit Check**: `npm run size-limit` - Checks bundle size limits

## Code Architecture

### Tech Stack

- **Frontend Framework**: Next.js (React)
- **UI Components**: UXCore (@ux/* components) - GoDaddy's design system
- **Application Framework**: Gasket - GoDaddy's application framework
- **Authentication**: SSO integration with cookie-based auth
- **Visualization**: Amazon QuickSight embedded dashboards
- **API**: AWS Lambda via API Gateway (proxied through Next.js API routes)
- **State Management**: React hooks for local state, Context for shared state

### Project Structure

- **components/**: React components
  - **layout/**: Layout components like two-column layout
  - **filter-card/**: Filter UI components for data filtering
  - **lexical-search/**: Search functionality components with OpenSearch syntax
  - **quicksight/**: QuickSight dashboard embedding components
  - **upload/**: File upload components for data import
- **config/**: Environment configurations
  - **local.js**: Local development settings
  - **base.js**: Default settings
  - **production.js**: Production settings
- **hooks/**: Custom React hooks for data fetching and state management
- **lib/**: Utility functions and services
  - **data/**: Data service with API communication functions
  - **session.js**: Session management utilities
- **lifecycles/**: Gasket lifecycle hooks
- **pages/**: Next.js pages
  - **api/**: API routes that proxy requests to AWS Lambda endpoints
  - **insights/**: Insights and dashboard pages
  - **lexical-search/**: Search functionality pages
  - **view/**: Result viewing pages
- **public/**: Static assets
  - **locales/**: Internationalization files
- **styles/**: Global styles

### Data Flow

1. **API Communication**: 
   - The application uses `@gasket/fetch` for secure API requests
   - API requests are proxied through Next.js API routes (`/api/aws/[id].js`) to AWS Lambda endpoints
   - Authentication is handled by including the SSO JWT token in request headers

2. **State Management**:
   - Custom hooks like `useTableList` and `useAiModels` manage data fetching and component state
   - Component state is managed with React hooks
   - Data service functions in `lib/data/data.service.js` handle API communication

3. **Authentication Flow**:
   - User authentication is managed through SSO integration
   - Session tokens are stored and retrieved using the session utility
   - API requests include authentication tokens in headers

4. **Error Handling**:
   - Custom error classes like `NetworkError` provide structured error information
   - Error states are managed in custom hooks
   - API responses are validated and parsed consistently

### Key Features

1. **Dashboard**: Main starting point where users select a table to work with
   - Table selection is managed through the `TableSelect` component
   - Uses the `useTableList` hook to fetch available tables

2. **Prompt Builder**: Interface for creating prompts to run against selected transcripts
   - AI model selection through the `useAiModels` hook
   - Filter options for narrowing down data scope
   - Form validation and submission handling

3. **Run Status**: Track the status of submitted prompt jobs
   - Status tracking through API endpoints
   - Job cancellation functionality

4. **Results Viewer**: View and analyze results of completed prompt jobs
   - Result fetching based on run ID
   - Summary prompt generation for aggregating findings

5. **Lexical Search**: Search queries using OpenSearch syntax
   - Query validation through API endpoints
   - Saved query management
   - Hit statistics visualization

6. **Insights**: Embedded QuickSight dashboards for analytics
   - Dashboard embedding using the Amazon QuickSight Embedding SDK
   - Dashboard URL generation through API endpoints

### Environment Configuration

The application uses different configurations based on the environment:
- **Local**: Configuration in `config/local.js` points to development API endpoints
- **Development**: Configuration in `config/base.js` has shared settings
- **Production**: Configuration in `config/production.js` points to production endpoints

API endpoints are configured in the corresponding environment files and are accessed through a proxy mechanism to handle authentication and error parsing consistently.

### Security Considerations

1. Authentication is required for all API requests through SSO tokens
2. The application uses HTTPS for both development and production
3. API requests include authentication headers
4. Proxy mechanism provides an additional layer of security for API calls