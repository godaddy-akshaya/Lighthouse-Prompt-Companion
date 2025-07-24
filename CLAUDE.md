# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- **Start Development Server**: `npm run local` - Runs both the local HTTPS server and Next.js development server
- **Build Application**: `npm run build` - Builds the Next.js application
- **Start Production Server**: `npm run start` - Starts the production server

### Linting and Testing

- **Run ESLint**: `npm run lint` - Checks for code quality and style issues
- **Run ESLint with Auto-fix**: `npm run lint:fix` - Fixes linting issues when possible
- **Run Style Linting**: `npm run stylelint` - Checks SCSS files for style issues
- **Run Style Linting with Auto-fix**: `npm run stylelint:fix` - Fixes style issues when possible
- **Run Tests**: The repo appears to use Jest testing library with React Testing Library for component tests, though no specific test script is defined in package.json

### Other Utilities

- **Bundle Analysis**: `npm run analyze` - Analyzes the application bundle size
- **Size Limit Check**: `npm run size-limit` - Checks bundle size limits

## Code Architecture

### Tech Stack

- **Frontend Framework**: Next.js (React)
- **UI Components**: UXCore (@ux/* components) - GoDaddy's design system
- **Application Framework**: Gasket - GoDaddy's application framework
- **Authentication**: SSO integration
- **Visualization**: Amazon QuickSight embedded dashboards
- **API**: AWS Lambda via API Gateway
- **State Management**: Redux with next-redux-wrapper

### Project Structure

- **components/**: React components
  - **layout/**: Layout components
  - **filter-card/**: Filter UI components
  - **lexical-search/**: Search functionality components
  - **quicksight/**: QuickSight dashboard embedding
  - **upload/**: File upload components
- **config/**: Environment configurations
  - **local.js**: Local development settings
  - **base.js**: Default settings
  - **production.js**: Production settings
- **hooks/**: Custom React hooks for data fetching and state management
- **lib/**: Utility functions and services
  - **data/**: Data service with API communication functions
  - **middleware/**: Request/response middleware
- **lifecycles/**: Gasket lifecycle hooks
- **pages/**: Next.js pages
  - **api/**: API routes
  - **insights/**: Insights and dashboard pages
  - **summary/**: Summary pages
  - **table/**: Table-related pages
  - **view/**: Result viewing pages
- **public/**: Static assets
  - **locales/**: Internationalization files
- **redux/**: Redux store configuration
- **styles/**: Global styles

### Key Features

1. **Dashboard**: Main starting point where users select a table to work with
2. **Prompt Builder**: Interface for creating prompts to run against selected transcripts
3. **Run Status**: Track the status of submitted prompt jobs
4. **Results Viewer**: View and analyze results of completed prompt jobs
5. **Lexical Search**: Search queries using OpenSearch syntax
6. **Insights**: Embedded QuickSight dashboards for analytics

### Data Flow

1. **API Communication**: The application uses `@gasket/fetch` for secure API requests to AWS Lambda endpoints
2. **Custom Hooks**: React hooks (`use-table-list.js`, etc.) manage data fetching and state
3. **Authentication**: User authentication is managed through SSO and session tokens
4. **Proxy Mechanism**: API requests are proxied through Next.js API routes (`/api/aws/`)

### Development Pattern

1. Components use React functional components with hooks
2. Data fetching is abstracted in custom hooks and service files
3. UI is built using the UXCore component library (@ux/*)
4. Authentication is managed through a session utility
5. Error handling is consistent through custom error classes

### Security Considerations

1. Authentication is required for all API requests
2. The application uses HTTPS for local development
3. API requests include session tokens in headers
4. Sensitive operations require user authentication

### Environment Configuration

The application uses different configurations based on environment:
- **Local**: `config/local.js`
- **Development**: `config/base.js`
- **Production**: `config/production.js`

### Deployment

The application is containerized using Docker:
- Node.js version: 22.13.0
- HTTPS ports: 8080, 8443