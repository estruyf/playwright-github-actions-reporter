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
| description | Markdown or HTML to show below the title. See [Add context to the summary](#add-context-to-the-summary) | `""` |
| metadata | Key/value pairs to show as a list below the title. Empty values are skipped. See [Add context to the summary](#add-context-to-the-summary) | `{}` |
| useDetails | Use details in summary which creates expandable content | `false` |
| showAnnotations | Show annotations from tests | `true` |
| showAnnotationsInColumn | Shows annotations from tests but in a column.  To enable showAnnotations must be set to `true` | `false` |
| showTags | Show tags from tests | `true` |
| showError | Show error message in summary. All errors of a test are shown, e.g. every failed `expect.soft()`, with the cause and a link to the failing line on GitHub. When a test fails inside a `test.step` or a hook, the step is shown as well, e.g. `Failed at: Checkout › Add to cart` | `false` |
| errorFormat | How much of the error to show: `full` shows the complete message, `short` shows the first line of each error. Requires `showError` | `full` |
| maxErrorLength | Maximum length of an error in the `short` format and in the failed tests overview | `180` |
| showErrorSnippet | Show the code snippet of the error in a collapsible block. Only for the `full` format. Snippets are left out of the pull request comment | `false` |
| showFailedOverview | Show a table with all failed and timed out tests across all files below the summary header. Only rendered when at least one test failed and `fail` is part of `includeResults` | `false` |
| failedOverviewLimit | Maximum number of tests in the failed tests overview. The remaining tests are shown as a "+N more failed tests" line | `10` |
| showSlowestTests | Show a table with the N slowest tests below the summary header, sorted by the duration of their slowest attempt. Skipped tests are left out. Use `0` to turn it off | `0` |
| includeResults | Define which types of test results should be shown in the summary | `['pass', 'skipped', 'fail', 'flaky']` |
| excludeProjects | Projects to leave out of the summary and the pull request comment, as strings (exact project name) or regexes. See [Exclude projects](#exclude-projects) | `[]` |
| quiet | Do not show any output in the console | `false` |
| showArtifactsLink | Show a link to the artifacts section in the workflow overview | `false` |
| prComment | Add the test results as a comment on the pull request. See [Comment on the pull request](#comment-on-the-pull-request) | `false` |
| prCommentId | Extra id for the pull request comment, to give each matrix job its own comment, e.g. `${{ matrix.target }}`. Sharded runs get their own comment without it. See [Comment on the pull request](#comment-on-the-pull-request) | `""` |
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

## Sharding

When you [shard your tests](https://playwright.dev/docs/test-sharding), each shard writes its own summary. The title shows which shard it belongs to, for example `Test results (shard 2/4)`.

To get one summary for all shards instead, let each shard write a [blob report](https://playwright.dev/docs/test-sharding#merge-reports-cli) and merge them in a separate job with a config that uses this reporter. The merged summary has no shard label.

1. Add the `blob` reporter next to this reporter in your Playwright config, so each shard writes a blob report (and set `prComment` only in the merge config, to get a single comment):

    ```ts
    reporter: process.env.CI
      ? [['blob'], ['@estruyf/github-actions-reporter']]
      : 'html',
    ```

2. Create a `merge.config.ts` for the merge job:

    ```ts
    import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';

    export default {
      testDir: './tests',
      reporter: [
        ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
          title: 'All test results',
          showError: true
        }]
      ],
    };
    ```

3. Upload the `blob-report` folder of each shard as an artifact, download them all in the merge job, and run:

    ```bash
    npx playwright merge-reports --config=merge.config.ts ./all-blob-reports
    ```

The [sharding sample workflow](./.github/workflows/sharding.yml) of this repository shows the full setup, with [`playwright.sharding.config.ts`](./playwright.sharding.config.ts) for the shards and [`playwright.merge.config.ts`](./playwright.merge.config.ts) for the merge job.

## Failed runs

When a run fails, the summary shows why, below the test totals, for example `2 failed, 1 timed out`. The same message is used for the failed step in the workflow. It also covers runs that fail without a failing test:

- **Flaky tests with `failOnFlakyTests`**: the flaky tests get the ❌ icon and the message says `1 flaky test (failOnFlakyTests is enabled)`.
- **Global timeout or an interrupted run**: `Global timeout reached` or `Test run was interrupted`.
- **Errors outside of tests**: a failing global setup or teardown, or a worker fixture that fails during teardown. These errors are shown in an "Errors outside of tests" section at the top of the summary, also when `showError` is turned off.

## Step outputs

The reporter sets the test results as outputs of the step that runs your tests, so later steps can use them:

| Output | Description |
| --- | --- |
| `total` | Total number of tests |
| `passed` | Number of passed tests |
| `failed` | Number of failed tests |
| `flaky` | Number of tests that passed on a retry |
| `skipped` | Number of skipped tests |
| `timed-out` | Number of tests that timed out |
| `status` | Status of the run: `passed`, `failed`, `timedout` or `interrupted` |

Give the step an `id` to use them:

```yaml
- name: Run Playwright tests
  id: playwright
  run: npx playwright test

- name: Upload the report when tests failed
  if: ${{ !cancelled() && steps.playwright.outputs.failed != '0' }}
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Add context to the summary

Use the `description` and `metadata` options to show extra context between the title and the results, for example the tested environment or why this set of tests ran. The context is shown in the job summary and in the pull request comment.

```ts
import { defineConfig } from '@playwright/test';
import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';

export default defineConfig({
  reporter: [
    ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
      description: `Selection: **${process.env.SELECTION_MODE}**`,
      metadata: {
        Environment: process.env.TEST_ENV,
        Target: process.env.TEST_TARGET ?? 'all tests',
      }
    }]
  ],
});
```

- `description` supports markdown and HTML.
- `metadata` is shown as a list. Entries with an empty, `null` or `undefined` value are skipped, so you can use environment variables that are not always set.

## Exclude projects

When you use [project dependencies](https://playwright.dev/docs/test-global-setup-teardown#option-1-project-dependencies), for example to sign in before the tests run, the setup projects show up as their own sections in the summary. Use the `excludeProjects` option to leave them out:

```ts
import { defineConfig } from '@playwright/test';
import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';

export default defineConfig({
  reporter: [
    ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
      excludeProjects: ['setup', /^setup-/]
    }]
  ],
});
```

A string matches the full project name, a regex is tested against it. The tests of excluded projects are left out of the totals, the failed and slowest tests overviews, and the file sections.

> [!NOTE]
> An excluded project with a failed test is still shown, including in the totals. When a setup project fails, all tests that depend on it are skipped, so the failure explains why.

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
> Each reporter gets its own comment per workflow job and `title`. The jobs of a matrix share the same workflow job, so they would update the same comment. Sharded runs get one comment per shard automatically. For other matrix setups, pass a unique `prCommentId` per matrix job, for example `prCommentId: process.env.TEST_TARGET` with `TEST_TARGET: ${{ matrix.target }}` in the workflow.

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
