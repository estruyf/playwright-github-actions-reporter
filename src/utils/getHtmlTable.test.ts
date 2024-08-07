import { DisplayLevel } from "../models";
import { getHtmlTable } from "./getHtmlTable";

const defaultDisplayLevel: DisplayLevel[] = [
  "pass",
  "fail",
  "flaky",
  "skipped",
];

describe("getHtmlTable", () => {
  it("should return the HTML table with error column", async () => {
    const tests: any = [
      {
        title: "Test 1",
        results: [
          {
            status: "passed",
            duration: 1000,
            retry: 0,
            error: null,
          },
        ],
        parent: {
          title: "Parent Title",
        },
      },
      {
        title: "Test 2",
        results: [
          {
            status: "failed",
            duration: 2000,
            retry: 1,
            error: {
              message: "Test failed",
            },
          },
        ],
        parent: null,
      },
      {
        title: "Test 3",
        results: [
          {
            status: "failed",
            duration: null,
            retry: null,
            error: {
              message: "Test failed",
            },
          },
        ],
      },
    ];

    const result = await getHtmlTable(
      tests,
      false,
      false,
      true,
      defaultDisplayLevel
    );

    const expected = `
<br>
<table role="table">
<thead>
<tr>
<th>Test</th>
<th>Status</th>
<th>Duration</th>
<th>Retries</th>
<th>Error</th>
</tr>
</thead>
<tbody>
<tr>
<td>Parent Title > Test 1</td>
<td>✅ Pass</td>
<td>1s</td>
<td></td>
<td></td>
</tr>
<tr>
<td>Test 2</td>
<td>❌ Fail</td>
<td>2s</td>
<td>1</td>
<td>Test failed</td>
</tr>
<tr>
<td>Test 3</td>
<td>❌ Fail</td>
<td></td>
<td></td>
<td>Test failed</td>
</tr>
</tbody>
</table>
`;

    expect(result?.trim()).toEqual(expected.trim());
  });

  it("should return the HTML table with error column (excluding passed tests)", async () => {
    const tests: any = [
      {
        title: "Test 1",
        results: [
          {
            status: "passed",
            duration: 1000,
            retry: 0,
            error: null,
          },
        ],
        parent: {
          title: "Parent Title",
        },
      },
      {
        title: "Test 2",
        results: [
          {
            status: "failed",
            duration: 2000,
            retry: 1,
            error: {
              message: "Test failed",
            },
          },
        ],
        parent: null,
      },
      {
        title: "Test 3",
        results: [
          {
            status: "failed",
            duration: null,
            retry: null,
            error: {
              message: "Test failed",
            },
          },
        ],
      },
    ];

    const result = await getHtmlTable(tests, false, false, true, [
      "fail",
      "flaky",
      "skipped",
    ]);

    const expected = `
<br>
<table role="table">
<thead>
<tr>
<th>Test</th>
<th>Status</th>
<th>Duration</th>
<th>Retries</th>
<th>Error</th>
</tr>
</thead>
<tbody>
<tr>
<td>Test 2</td>
<td>❌ Fail</td>
<td>2s</td>
<td>1</td>
<td>Test failed</td>
</tr>
<tr>
<td>Test 3</td>
<td>❌ Fail</td>
<td></td>
<td></td>
<td>Test failed</td>
</tr>
</tbody>
</table>
`;

    expect(result?.trim()).toEqual(expected.trim());
  });

  it("should not return a table when no tests are provided (without error column)", async () => {
    const result = await getHtmlTable(
      [],
      false,
      false,
      false,
      defaultDisplayLevel
    );

    expect(result).toBeUndefined();
  });

  it("should not return a table when no tests are provided (including error column)", async () => {
    const result = await getHtmlTable(
      [],
      false,
      false,
      true,
      defaultDisplayLevel
    );

    expect(result).toBeUndefined();
  });

  it("should return the HTML table with annotations row", async () => {
    const tests: any = [
      {
        title: "Test 1",
        results: [
          {
            status: "passed",
            duration: 1000,
            retry: 0,
            error: null,
          },
          {
            status: "failed",
            duration: 2000,
            retry: 1,
            error: {
              message: "Test failed",
            },
          },
        ],
        annotations: [{ type: "info", description: "Annotation 1" }],
      },
    ];

    const result = await getHtmlTable(
      tests,
      true,
      false,
      false,
      defaultDisplayLevel
    );

    const expected = `
<br>
<table role="table">
<thead>
<tr>
<th>Test</th>
<th>Status</th>
<th>Duration</th>
<th>Retries</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="4"><p><strong>info</strong>: Annotation 1</p></td>
</tr>
<tr>
<td>Test 1</td>
<td>❌ Fail</td>
<td>2s</td>
<td>1</td>
</tr>
</tbody>
</table>`;

    expect(result?.trim()).toEqual(expected.trim());
  });

  it("should return the HTML table with annotations and tags columns", async () => {
    const tests: any = [
      {
        title: "Test 1",
        results: [
          {
            status: "passed",
            duration: 1000,
            retry: 0,
            error: null,
          },
          {
            status: "failed",
            duration: 2000,
            retry: 1,
            error: {
              message: "Test failed",
            },
          },
        ],
        tags: ["@tag1", "@tag2"],
        annotations: [{ type: "info", description: "Annotation 1" }],
      },
      {
        title: "Test 2",
        results: [
          {
            status: "failed",
            duration: 2000,
            retry: 1,
            error: {
              message: "Test failed",
            },
          },
        ],
        tags: ["@tag1"],
      },
    ];

    const result = await getHtmlTable(
      tests,
      true,
      true,
      true,
      defaultDisplayLevel
    );

    const expected = `
<br>
<table role="table">
<thead>
<tr>
<th>Test</th>
<th>Status</th>
<th>Duration</th>
<th>Retries</th>
<th>Tags</th>
<th>Error</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="6"><p><strong>info</strong>: Annotation 1</p></td>
</tr>
<tr>
<td>Test 1</td>
<td>❌ Fail</td>
<td>2s</td>
<td>1</td>
<td>tag1, tag2</td>
<td>Test failed</td>
</tr>
<tr>
<td>Test 2</td>
<td>❌ Fail</td>
<td>2s</td>
<td>1</td>
<td>tag1</td>
<td>Test failed</td>
</tr>
</tbody>
</table>`;

    expect(result?.trim()).toEqual(expected.trim());
  });
});
