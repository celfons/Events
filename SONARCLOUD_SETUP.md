# SonarCloud Integration Setup Guide

This repository is now configured for SonarCloud analysis. Follow these steps to complete the integration.

## Prerequisites

1. A SonarCloud account (free for open source projects)
2. Admin access to this GitHub repository
3. GitHub Actions enabled on the repository

## Setup Steps

### 1. Create SonarCloud Organization and Project

1. Go to [SonarCloud](https://sonarcloud.io/) and sign in with your GitHub account
2. Click on "Analyze new project" or go to https://sonarcloud.io/projects/create
3. Import this GitHub repository
4. The organization should be `celfons` (as configured in sonar-project.properties)
5. The project key should be `celfons_Events` (as configured in sonar-project.properties)

### 2. Configure GitHub Repository Secrets

Add the following secret to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the following secret:
   - **Name**: `SONAR_TOKEN`
   - **Value**: Get this from SonarCloud:
     - Go to SonarCloud
     - Click on your avatar → My Account → Security
     - Generate a new token with a descriptive name (e.g., "GitHub Actions")
     - Copy the token and paste it as the secret value

## What's Configured

### Files Added

1. **sonar-project.properties** - Main SonarCloud configuration file
   - Project identification (key, organization, name)
   - Source and test directories
   - Exclusions for node_modules, coverage, etc.
   - Coverage report path (coverage/lcov.info)

2. **.github/workflows/main_celfons.yml** (modified) - Main deployment workflow with integrated SonarCloud analysis
   - Runs on push to main, pull requests, and workflow_dispatch
   - Executes tests with coverage
   - Performs SonarCloud analysis
   - Checks quality gate status
   - Creates GitHub issues if quality gate fails (main branch only)
   - Builds and deploys to Azure Web App (main branch only)

3. **package.json** (modified) - Jest configuration updated
   - Added coverage reporters: text, lcov, and html
   - Ensures LCOV format for SonarCloud integration

### Workflow Features

The main workflow now includes integrated SonarCloud analysis:

- **Automatic Analysis**: Runs on every push to main and every pull request
- **Test Coverage Integration**: Automatically uploads Jest coverage reports
- **Quality Gate Check**: Validates code quality standards
- **Issue Creation**: Automatically creates GitHub issues if quality gate fails on main branch
- **PR Decoration**: Adds quality metrics directly to pull requests

## How to Use

### Automatic Analysis

Once configured, SonarCloud analysis will run automatically:

1. On every push to the `main` branch
2. On every pull request to `main`

No manual intervention is required!

### View Results

1. **On GitHub**: Check the "Actions" tab to see workflow runs
2. **On SonarCloud**: Visit https://sonarcloud.io/project/overview?id=celfons_Events
3. **On Pull Requests**: Quality metrics will appear as comments on PRs

### Run Tests Locally with Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Coverage reports will be generated in:
# - coverage/lcov-report/index.html (HTML format)
# - coverage/lcov.info (LCOV format for SonarCloud)
```

## Quality Gate

The quality gate will check:

- **Bugs**: Code that could cause issues
- **Vulnerabilities**: Security issues
- **Code Smells**: Maintainability issues
- **Coverage**: Test coverage percentage
- **Duplications**: Duplicated code blocks
- **Technical Debt**: Estimated time to fix issues

If the quality gate fails on the main branch, an issue will be automatically created with details.

## Troubleshooting

### "SONAR_TOKEN not found" Error

Make sure you've added the `SONAR_TOKEN` secret to your GitHub repository as described in step 2 above.

### Coverage Not Showing

1. Ensure tests are running successfully in the workflow
2. Check that `coverage/lcov.info` is being generated
3. Verify the `sonar.javascript.lcov.reportPaths` property in `sonar-project.properties`

### Quality Gate Fails Immediately

This is normal for the first run. SonarCloud needs to establish a baseline. Subsequent runs will use this baseline for comparison.

## Configuration Customization

### Adjust Quality Gate

You can customize quality gate rules in SonarCloud:

1. Go to your project on SonarCloud
2. Navigate to Project Settings → Quality Gate
3. Choose an existing gate or create a custom one

### Modify Coverage Exclusions

Edit `sonar-project.properties`:

```properties
# Exclude additional files from coverage
sonar.coverage.exclusions=**/__tests__/**,**/*.test.js,your/custom/path/**
```

### Change Analysis Frequency

Edit `.github/workflows/main_celfons.yml` to modify when analysis runs:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Add more branches
  pull_request:
    types: [opened, synchronize, reopened]
```

## Next Steps

1. Complete the setup steps above
2. Push a commit to trigger the first analysis
3. Review the results on SonarCloud
4. Address any critical issues identified
5. Monitor quality metrics on subsequent commits

## Resources

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

For questions or issues with this configuration, please open an issue in this repository.
