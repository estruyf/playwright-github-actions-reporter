# GitHub Actions Reporter for Playwright

This action reports test results from Playwright to GitHub summaries.

## Installation

Install from npm:
  
```bash
npm install @estruyf/github-actions-reporter
```

## Usage

You can configure the reporter by adding it to the `playwright.config.js` file:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['@estruyf/github-actions-reporter']
  ],
});
```

> More information on how to use reporters can be found in the [Playwright documentation](https://playwright.dev/docs/test-reporters).

## Configuration

The reporter supports the following configuration options:

| Option | Description | Default |
| --- | --- | --- |
| title | Title of the report. Use an empty string (`""`) to remove the heading.  | `Test results` |
| useDetails | Use details in summary which creates expandable content | `false` |
| showAnnotations | Show annotations from tests | `true` |
| showTags | Show tags from tests | `true` |
| showError | Show error message in summary | `false` |

To use these option, you can update the reporter configuration:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['@estruyf/github-actions-reporter', {
      title: 'My custom title',
      useDetails: true,
      showError: true
    }]
  ],
});
```

### Example without details

![Example without details](./assets/example-without-details.png)

### Example with details

![Example with details](./assets/example-with-details.png)

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter)
