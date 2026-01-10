# CI/CD Pipeline Guide

This document describes the CI/CD pipeline for the Events platform, which builds and deploys both the Node.js backend and React frontend together.

## Overview

The pipeline consists of three main jobs:

1. **ESLint** - Code quality scanning and security analysis
2. **Build** - Install dependencies, build React, and run tests
3. **Deploy** - Deploy the complete application to Azure

## Workflows

### Main Production Workflow (`main_celfons.yml`)

Triggers on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

### Development Workflow (`dev_celfons(events-dev).yml`)

Triggers on:
- Push to `dev` branch
- Manual workflow dispatch

## Build Process

### 1. ESLint Job

```yaml
- Install ESLint 8.10.0 and SARIF formatter
- Run ESLint on all JavaScript files
- Upload results to GitHub CodeQL for security analysis
```

**Benefits:**
- Early detection of code quality issues
- Security vulnerability scanning
- Integrated with GitHub Security tab

### 2. Build Job

```yaml
- Checkout code
- Setup Node.js 22.x with npm cache
- Cache node_modules for faster subsequent builds
- Install dependencies with npm ci
- Build React application (webpack production build)
- Run tests with coverage
- Upload artifacts for deployment
```

**Key Features:**
- **npm cache**: Speeds up dependency installation by caching npm packages
- **node_modules cache**: Speeds up builds by caching installed dependencies
- **Separate React build step**: Explicitly builds React bundles
- **Coverage reports**: Generates test coverage for quality tracking
- **Artifact optimization**: Only uploads necessary files (excludes node_modules, coverage, .git)

**Build Artifacts Include:**
- Source code
- React production bundles (`public/js/react-build/`)
- Configuration files
- Package manifests

### 3. Deploy Job

```yaml
- Download build artifacts
- Install production dependencies only (--omit=dev)
- Verify React build artifacts exist
- Login to Azure
- Deploy to Azure Web App
```

**Key Features:**
- **Production dependencies only**: Reduces deployment size
- **Artifact verification**: Ensures React builds are present before deployment
- **Security**: Uses Azure OIDC authentication (no secrets in code)

## Performance Optimizations

### 1. NPM Cache

```yaml
- name: Set up Node.js version
  uses: actions/setup-node@v4
  with:
    node-version: '22.x'
    cache: 'npm'
```

Caches npm packages between runs, significantly reducing download time.

### 2. Node Modules Cache

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

Caches installed node_modules, avoiding reinstallation when package-lock.json hasn't changed.

**Cache Invalidation:**
- Cache key includes hash of package-lock.json
- Any dependency change triggers cache miss and fresh install
- OS-specific caching ensures compatibility

### 3. Optimized Artifact Upload

```yaml
path: |
  .
  !node_modules
  !coverage
  !.git
retention-days: 1
```

**Benefits:**
- Smaller artifacts = faster upload/download
- node_modules reinstalled in deploy job (production only)
- Reduced storage costs with 1-day retention
- Faster deployment pipeline

## Build Scripts

### Development

```bash
npm run dev                 # Start development server
npm run build:react:dev    # Build React in development mode
```

### Production

```bash
npm run build              # Build React in production mode
npm run build:react        # Same as above (production)
```

### CI/CD Specific

```bash
npm run ci:install         # Install dependencies (CI optimized)
npm run ci:build          # Build React for CI
npm run ci:test           # Run tests with coverage
```

### Utilities

```bash
npm run clean             # Remove build artifacts and coverage
npm run lint              # Run ESLint
npm run test:coverage     # Run tests with coverage report
```

## Build Output

### React Build

Location: `public/js/react-build/`

Files generated:
- `index.bundle.js` - Events listing page
- `admin.bundle.js` - Admin dashboard
- `event-details.bundle.js` - Event details page
- `users.bundle.js` - User management page

### Test Coverage

Location: `coverage/`

Formats:
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- Text summary in console

## Environment Variables

The workflows use the following secrets:

### Azure Authentication (OIDC)
- `AZUREAPPSERVICE_CLIENTID_*`
- `AZUREAPPSERVICE_TENANTID_*`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_*`

These are configured in GitHub repository settings under Secrets and variables > Actions.

## Troubleshooting

### Build Fails - Dependencies

```bash
# Clear npm cache
npm cache clean --force

# Delete package-lock.json and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Build Fails - React Build

```bash
# Check webpack config
cat webpack.config.js

# Build locally to see errors
npm run build:react:dev

# Check output directory
ls -la public/js/react-build/
```

### Deploy Fails - Missing Artifacts

If deployment fails with "React build artifacts missing":

1. Check build job logs for webpack errors
2. Verify artifact upload includes `public/js/react-build/`
3. Ensure webpack.config.js output path is correct

### Cache Issues

If experiencing stale dependency issues:

1. Manually clear cache in GitHub Actions
2. Update cache key in workflow
3. Delete and recreate package-lock.json

## Best Practices

### ✅ DO

- Always use `npm ci` in CI/CD (not `npm install`)
- Cache dependencies for faster builds
- Run tests before deployment
- Verify artifacts before deployment
- Use production builds for deployment
- Keep artifact retention short (1 day) to save costs

### ❌ DON'T

- Don't commit `node_modules/` to git
- Don't commit build artifacts to git
- Don't use `npm install` in CI/CD
- Don't skip tests in deployment pipeline
- Don't upload unnecessary files in artifacts

## Monitoring

### GitHub Actions

- View workflow runs: Actions tab in GitHub
- Check ESLint results: Security tab > Code scanning
- Monitor build times: Actions tab > specific run

### Azure Portal

- Application logs: Azure Portal > App Service > Log stream
- Deployment history: Azure Portal > App Service > Deployment Center
- Application Insights: Azure Portal > Application Insights

## Future Improvements

Potential enhancements:

1. **Separate Frontend/Backend Builds**: Use npm workspaces or monorepo structure
2. **Build Matrix**: Test across multiple Node.js versions
3. **E2E Tests**: Add Playwright or Cypress tests
4. **Preview Deployments**: Deploy PR previews to staging slots
5. **Deployment Slots**: Blue-green deployment strategy
6. **CDN Integration**: Serve React bundles from Azure CDN
7. **Bundle Analysis**: Track bundle sizes over time

## Support

For issues or questions:
- Check workflow logs in GitHub Actions
- Review this documentation
- Contact DevOps team
