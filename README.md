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
| title | Title of the report | `Test results` |
| useDetails | Use details in summary which creates expandable content | `false` |
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
