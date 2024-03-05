import { getHtmlTable } from "./getHtmlTable";

describe("getHtmlTable", () => {
  it("should return the HTML table with error column", () => {
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
      },
    ];

    const result = getHtmlTable(tests, true);

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
<td>Test 1</td>
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
</tbody>
</table>
`;

    expect(result.trim()).toEqual(expected.trim());
  });

  it("should return an empty HTML table if tests is empty (without error column)", () => {
    const result = getHtmlTable([], false);

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
</tbody>
</table>
`;

    expect(result.trim()).toEqual(expected.trim());
  });

  it("should return an empty HTML table if tests is empty (including error column)", () => {
    const result = getHtmlTable([], true);

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
</tbody>
</table>
`;

    expect(result.trim()).toEqual(expected.trim());
  });
});
