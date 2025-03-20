# Lighthouse - LLM Insights Platform

Lighthouse is a web application that provides an interface for working with large language models to analyze text-based data. The platform allows users to craft, manage, and evaluate prompts against transcripts and other text data.

## Overview

GoDaddy Lighthouse is an insights platform powered by large language models. The platform enables users to:

- Run prompts against transcript data
- Search through transcript data using lexical queries
- Analyze results with visualization tools
- Create summaries of processed data
- View dashboards with insights about interactions

## Tech Stack

- **Frontend**: Next.js with React
- **UI Components**: UXCore (@ux/\*)
- **Framework**: Gasket (GoDaddy's application framework)
- **Authentication**: SSO integration
- **Visualization**: QuickSight embedding
- **API**: AWS Lambda via API Gateway
- **CI/CD**: Docker-based deployment

## Project Structure

```
lh/
├── components/        # React components
├── config/            # Environment configurations
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and services
├── lifecycles/        # Gasket lifecycle hooks
├── pages/             # Next.js pages
│   ├── api/           # API routes
│   └── [feature]/     # Feature-specific pages
├── public/            # Static assets
│   └── locales/       # Internationalization files
└── styles/            # Global styles
```

## Key Features

### Dashboard

The main dashboard provides a starting point where users can select a table to work with.

### Prompt Builder

Allows users to:

- Select filter parameters to define which transcripts to analyze
- Create prompts that will be run against the selected transcripts
- Configure LLM models and parameters
- Add evaluation prompts to assess responses

### Run Status

Track the status of submitted prompt jobs, including:

- Submitted
- In Progress
- Completed
- Cancelled

### Results Viewer

View and analyze the results of completed prompt jobs, with the ability to:

- Download results as CSV
- Create summary prompts to aggregate findings
- View detailed transcript and response information

### Lexical Search

Create and manage search queries using OpenSearch syntax to find specific patterns in transcripts:

- Build complex boolean queries
- Validate queries before submitting
- Save and reuse queries
- View hit statistics for queries

### Insights

View embedded QuickSight dashboards providing various analytics on:

- Lighthouse Intents
- Contact Driver metrics
- Intent Insights

## Development

### Prerequisites

- Node.js (version specified in Dockerfile: 22.13.0)
- NPM
- Docker (for containerized development)

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run local
   ```

### Environment Configuration

The application uses different configurations based on the environment:

- **Local**: `config/local.js`
- **Development**: `config/base.js`
- **Production**: `config/production.js`

### Available Scripts

- `npm run build`: Build the application
- `npm run start`: Start the production server
- `npm run local`: Start the development server
- `npm run lint`: Run ESLint
- `npm run stylelint`: Run stylelint for SCSS files

## Deployment

The application is containerized using Docker and can be deployed to various environments:

```
# Build the Docker image
docker build -t lighthouse-ui .

# Run the Docker container
docker run -p 8080:8080 -p 8443:8443 lighthouse-ui
```

## Authentication

The application uses GoDaddy's SSO for authentication, with different groups for different environments:

- Development: `lighthouse-ui-devs`
- Production: `lighthouse-ui-group`, `lighthouse-ui-devs`

## Additional Resources

For more information about Lighthouse, refer to:

- [Lighthouse Wiki](https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform)
