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
| showAnnotationsInColumn | Shows annotations from tests but in a column.  To enable showAnnotations must be set to `true` | `false` |
| showTags | Show tags from tests | `true` |
| showError | Show error message in summary | `false` |
| showFailedOverview | Show a table with all failed and timed out tests across all files below the summary header. Only rendered when at least one test failed and `fail` is part of `includeResults` | `false` |
| failedOverviewLimit | Maximum number of tests in the failed tests overview. The remaining tests are shown as a "+N more failed tests" line | `10` |
| showSlowestTests | Show a table with the N slowest tests below the summary header, sorted by the duration of their slowest attempt. Skipped tests are left out. Use `0` to turn it off | `0` |
| includeResults | Define which types of test results should be shown in the summary | `['pass', 'skipped', 'fail', 'flaky']` |
| quiet | Do not show any output in the console | `false` |
| showArtifactsLink | Show a link to the artifacts section in the workflow overview | `false` |
| prComment | Add the test results as a comment on the pull request. See [Comment on the pull request](#comment-on-the-pull-request) | `false` |
| githubToken | Token used to comment on the pull request | `process.env.GITHUB_TOKEN` |
| azureStorageUrl | URL to the Azure Storage account where the screenshots are stored (optional) | `""` |
| azureStorageSAS | Shared Access Signature (SAS) token to access the Azure Storage account (optional) | `""` |

To use these option, you can update the reporter configuration:

```ts
import { defineConfig } from '@playwright/test';
import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';

export default defineConfig({
  reporter: [
    ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
      title: 'My custom title',
      useDetails: true,
      showError: true
    }]
  ],
});
```

## Comment on the pull request

Next to the job summary, the reporter can add the test results as a comment on the pull request. When the workflow runs again, the reporter updates its existing comment instead of adding a new one.

To enable it:

1. Set the `prComment` option to `true`:

    ```ts
    import { defineConfig } from '@playwright/test';
    import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';

    export default defineConfig({
      reporter: [
        ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
          prComment: true
        }]
      ],
    });
    ```

2. Run the workflow on the `pull_request` event, give it the `pull-requests: write` permission, and pass the `GITHUB_TOKEN` to the Playwright step:

    ```yaml
    on:
      pull_request:

    permissions:
      contents: read
      pull-requests: write

    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          # ...
          - name: Run Playwright tests
            run: npx playwright test
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ```

> [!NOTE]
> The comment is only added when the workflow runs for a pull request. If the comment fails (for example, pull requests from forks get a read-only token), the reporter logs a warning and does not fail the run.

> [!TIP]
> Each reporter gets its own comment per workflow job and `title`. When you use a matrix strategy, give each matrix job a different `title`, or the jobs update the same comment.

### Example without details

![Example without details](./assets/example-without-details.png)

### Example with details

![Example with details](./assets/example-with-details.png)

## Showing result attachments

If you want to show attachments like when you use pixel matching, you need to provide the configuration for the blob service where the images will be stored.

> [!NOTE]
> GitHub does not have an API to link images to the summary. Therefore, you need to store the images in a blob storage service and provide the URL to the images.

> [!IMPORTANT]
> To show the attachments, you need to make sure to enable `showError` as well.

![Example with attachments](./assets/example-with-attachments.png)

### Azure Blob Storage

If you are using Azure Blob Storage, you need to provide the `azureStorageUrl` and `azureStorageSAS` configuration options.

Follow the next steps to get the URL and SAS token:

- Go to your Azure Portal
- Navigate to your storage account or create a new one
- Navigate to **data storage** > **containers**
- Create a new container. Set the access level to **Blob (anonymous read access for blobs only)**
- Open the container, and click on **Shared access signature**
- Create a new shared access signature with the following settings:
  - Allowed permissions: **Create**
  - Expiry time: **Custom** (set the time you want)
  - Allowed protocols: **HTTPS only**
- Click on **Generate SAS and URL**
- Copy the **Blob SAS token**, this will be your `azureStorageSAS` value
- Copy the **Blob service URL** and append the container name to it, this will be your `azureStorageUrl` value. Example: `https://<name>.blob.core.windows.net/<container-name>`.
- Update the `playwright.config.js` file with the following configuration:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['@estruyf/github-actions-reporter', {
      showError: true,
      azureStorageUrl: 'https://<name>.blob.core.windows.net/<container-name>',
      azureStorageSAS: '<your-sas-token>'
    }]
  ],
});
```

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter)
