# GitHub Actions Reporter for Playwright

A Playwright reporter that writes your test results to the [job summary](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#adding-a-job-summary) of a GitHub Actions run. It can also:

- show the error details of failed tests, with a link to the failing line
- show an overview of the failed and slowest tests
- explain why a run failed and expose the results as step outputs
- add workflow annotations on the failing lines
- add the results as a comment on the pull request
- show the screenshots of failed tests from blob storage

> [!NOTE]
> The summary is only written when the tests run in GitHub Actions. When you run your tests locally, the reporter only passes through the console output of your tests.

## Installation

Install from npm:

```bash
npm install @estruyf/github-actions-reporter
```

## Usage

Add the reporter to your `playwright.config.ts` file:

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

### Example without details

![Example without details](./assets/example-without-details.png)

### Example with details

With the `useDetails` option, each test file is shown as a collapsible section.

![Example with details](./assets/example-with-details.png)

## Configuration

Pass the options as the second item of the reporter entry:

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

### General

| Option | Description | Default |
| --- | --- | --- |
| title | Title of the summary. Use an empty string (`""`) to remove the heading | `Test results` |
| description | Markdown or HTML to show below the title. See [Add context to the summary](#add-context-to-the-summary) | `""` |
| metadata | Key/value pairs to show as a list below the title. See [Add context to the summary](#add-context-to-the-summary) | `{}` |
| useDetails | Show each test file as a collapsible section | `false` |
| showTags | Show the tags of the tests | `true` |
| showAnnotations | Show the annotations of the tests, above the test row | `true` |
| showAnnotationsInColumn | Show the annotations in a column instead of above the test row. Requires `showAnnotations` | `false` |
| includeResults | Which test results to show in the file sections: `pass`, `fail`, `flaky` and/or `skipped` | `['pass', 'skipped', 'fail', 'flaky']` |
| excludeProjects | Projects to leave out of the summary, as strings (exact project name) or regexes. See [Exclude projects](#exclude-projects) | `[]` |
| showArtifactsLink | Show a link to the artifacts section of the workflow run | `false` |
| quiet | Do not pass through the console output of the tests | `false` |
| debug | Log the reporter options to the console when the run starts | `false` |

### Errors

| Option | Description | Default |
| --- | --- | --- |
| showError | Show the errors of failed tests. See [Error details](#error-details) | `false` |
| errorFormat | `full` shows the complete error message, `short` shows the first line of each error. Requires `showError` | `full` |
| maxErrorLength | Maximum length of an error in the `short` format and in the failed tests overview | `180` |
| showErrorSnippet | Show the code around the failing line in a collapsible block. Only for the `full` format | `false` |

### Overview tables

| Option | Description | Default |
| --- | --- | --- |
| showFailedOverview | Show a table with all failed tests at the top of the summary. See [Failed and slowest tests](#failed-and-slowest-tests) | `false` |
| failedOverviewLimit | Maximum number of tests in the failed tests overview | `10` |
| showSlowestTests | Show a table with the N slowest tests at the top of the summary. Use `0` to turn it off | `0` |

### Workflow integration

| Option | Description | Default |
| --- | --- | --- |
| workflowAnnotations | Add workflow annotations for failed and flaky tests. See [Workflow annotations](#workflow-annotations) | `false` |
| prComment | Add the results as a comment on the pull request. See [Comment on the pull request](#comment-on-the-pull-request) | `false` |
| prCommentId | Extra id to give each matrix job its own pull request comment. See [Comment on the pull request](#comment-on-the-pull-request) | `""` |
| githubToken | Token used to comment on the pull request | `process.env.GITHUB_TOKEN` |

### Attachments

| Option | Description | Default |
| --- | --- | --- |
| azureStorageUrl | URL of the Azure Storage container where the screenshots are stored. See [Showing result attachments](#showing-result-attachments) | `""` |
| azureStorageSAS | Shared Access Signature (SAS) token to upload to the Azure Storage container | `""` |

## The summary

### Add context to the summary

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

### Error details

With `showError: true`, the summary gets an Error column with:

- all errors of the test, for example every failed `expect.soft()`
- the cause of the error, when there is one
- a link to the failing line on GitHub, for example `fail.spec.ts:22`
- the `test.step` or hook in which the test failed, for example `Failed at: Checkout › Add to cart (SKU 42)`

Error messages from Playwright can be long, as they include the call log and the expected and received values. To keep the tables compact, use `errorFormat: 'short'`. It shows the first line of each error, without colors, and cuts it off at `maxErrorLength` characters.

With `showErrorSnippet: true`, the code around the failing line is added in a collapsible block. This only works with the `full` format. The snippets are left out of the pull request comment, as they can make the comment too large.

```ts
['@estruyf/github-actions-reporter', <GitHubActionOptions>{
  showError: true,
  errorFormat: 'short',
  maxErrorLength: 120
}]
```

### Failed and slowest tests

When a run has many test files, the overview tables show what matters at the top of the summary:

- `showFailedOverview: true` adds a "Failed tests" table with the file, test and short error of every failed and timed out test. It is only shown when at least one test failed and `fail` is part of `includeResults`. When there are more than `failedOverviewLimit` failed tests, the rest is shown as a "+N more failed tests" line.
- `showSlowestTests: 5` adds a "Slowest tests" table with the 5 slowest tests, sorted by the duration of their slowest attempt. Skipped tests are left out.

### Exclude projects

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

A string matches the full project name, a regex is tested against it. The tests of excluded projects are left out of the totals, the overview tables, the file sections and the pull request comment.

> [!NOTE]
> An excluded project with a failed test is still shown, including in the totals. When a setup project fails, all tests that depend on it are skipped, so the failure explains why.

### Showing result attachments

If you want to show attachments like when you use pixel matching, you need to provide the configuration for the blob service where the images will be stored.

> [!NOTE]
> GitHub does not have an API to link images to the summary. Therefore, you need to store the images in a blob storage service and provide the URL to the images.

> [!IMPORTANT]
> To show the attachments, you need to make sure to enable `showError` as well.

![Example with attachments](./assets/example-with-attachments.png)

#### Azure Blob Storage

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
- Update the `playwright.config.ts` file with the following configuration:

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

## Workflow integration

### Failed runs

When a run fails, the summary shows why, below the test totals, for example `2 failed, 1 timed out`. The same message is used for the failed step in the workflow. It also covers runs that fail without a failing test:

- **Flaky tests with `failOnFlakyTests`**: the flaky tests get the ❌ icon and the message says `1 flaky test (failOnFlakyTests is enabled)`.
- **Global timeout or an interrupted run**: `Global timeout reached` or `Test run was interrupted`.
- **Errors outside of tests**: a failing global setup or teardown, or a worker fixture that fails during teardown. These errors are shown in an "Errors outside of tests" section at the top of the summary, also when `showError` is turned off.

### Step outputs

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
  uses: actions/upload-artifact@v7
  with:
    name: playwright-report
    path: playwright-report/
```

### Workflow annotations

With the `workflowAnnotations` option, the reporter adds a [workflow annotation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-an-error-message) for each failed test. Annotations are shown on the workflow run, and inline on the "Files changed" tab of a pull request when the pull request changes the annotated file:

- Failed and timed out tests get an error on the line where the test failed.
- Flaky tests get a warning, or an error when `failOnFlakyTests` is enabled.
- Errors outside of tests, like a failing global setup, get an error as well.

> [!NOTE]
> Playwright's built-in [`github` reporter](https://playwright.dev/docs/test-reporters#github-actions-annotations) also adds annotations. Do not enable this option when you use both reporters, or each failure is annotated twice. GitHub shows at most 10 errors and 10 warnings per step.

### Comment on the pull request

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

Each reporter gets its own comment per workflow job and `title`. The jobs of a matrix share the same workflow job, so they would update the same comment:

- **Sharded runs** get one comment per shard automatically. To get a single comment for all shards, see [Sharding](#sharding).
- **Other matrix setups** need a unique `prCommentId` per matrix job. Pass the matrix value through an environment variable, as the Playwright config cannot read the matrix directly:

    ```yaml
    - name: Run Playwright tests
      run: npx playwright test
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TEST_TARGET: ${{ matrix.target }}
    ```

    ```ts
    ['@estruyf/github-actions-reporter', <GitHubActionOptions>{
      prComment: true,
      prCommentId: process.env.TEST_TARGET
    }]
    ```

### Sharding

When you [shard your tests](https://playwright.dev/docs/test-sharding), each shard writes its own summary. The title shows which shard it belongs to, for example `Test results (shard 2/4)`.

To get one summary for all shards instead, let each shard write a [blob report](https://playwright.dev/docs/test-sharding#merge-reports-cli), and merge the reports in a separate job with a config that uses this reporter. The merged summary has no shard label.

1. Use the `blob` reporter for the shards:

    ```ts
    reporter: process.env.CI ? [['blob']] : 'html',
    ```

    To keep the summary per shard as well, add this reporter next to it: `[['blob'], ['@estruyf/github-actions-reporter']]`.

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

    For a single pull request comment with the results of all shards, set `prComment` in this config only, and pass the `GITHUB_TOKEN` to the merge step.

3. Upload the `blob-report` folder of each shard as an artifact, download them all in the merge job, and run:

    ```bash
    npx playwright merge-reports --config=merge.config.ts ./all-blob-reports
    ```

The [sharding sample workflow](./.github/workflows/sharding.yml) of this repository shows the full setup, with [`playwright.sharding.config.ts`](./playwright.sharding.config.ts) for the shards and [`playwright.merge.config.ts`](./playwright.merge.config.ts) for the merge job.

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fplaywright-github-actions-reporter)
