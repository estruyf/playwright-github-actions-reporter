import { DisplayLevel } from "../models";
import { getTableRows } from "./getTableRows";

const tableHeaders = [
  {
    data: "Test",
    header: true,
  },
  {
    data: "Status",
    header: true,
  },
  {
    data: "Duration",
    header: true,
  },
  {
    data: "Retries",
    header: true,
  },
];

const tableHeadersWithAnnotationColumn = [...tableHeaders,...[{ data: "Annotations", header: true }]];

const defaultDisplayLevel: DisplayLevel[] = [
  "pass",
  "fail",
  "flaky",
  "skipped",
];

describe("getTableRows", () => {
  it("should return the table rows with headers and data", async () => {
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
    ];

    const result = await getTableRows(
      tests,
      false,
      false,
      true,
      defaultDisplayLevel
    );
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    const expected = [
      clonedTableHeaders,
      [
        { data: "Parent Title > Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
        { data: "", header: false },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
        { data: "Test failed", header: false },
      ],
    ];

    expect(result).toEqual(expected);
  });

  it("should return the table rows with headers and data (excluding passed tests)", async () => {
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
    ];

    const result = await getTableRows(tests, false, false, true, [
      "fail",
      "flaky",
      "skipped",
    ]);
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    const expected = [
      clonedTableHeaders,
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
        { data: "Test failed", header: false },
      ],
    ];

    expect(result).toEqual(expected);
  });

  it("should return the table rows without error column if showError is false", async () => {
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

    const result = await getTableRows(
      tests,
      false,
      false,
      false,
      defaultDisplayLevel
    );

    expect(result).toEqual([
      tableHeaders,
      [
        { data: "Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
      ],
    ]);
  });

  it("should return an empty array if tests is empty (without error header)", async () => {
    const result = await getTableRows(
      [],
      false,
      false,
      false,
      defaultDisplayLevel
    );

    expect(result).toEqual([]);
  });

  it("should return an empty array if tests is empty (including error header)", async () => {
    const result = await getTableRows(
      [],
      false,
      false,
      true,
      defaultDisplayLevel
    );
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    expect(result).toEqual([]);
  });

  it("should return the table rows with annotations", async () => {
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
        annotations: [
          { type: "info", description: "Annotation 1" },
          { type: "info", description: "Annotation 2" },
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
        annotations: [{ type: "doc", description: "Annotation 3" }],
      },
    ];

    const result = await getTableRows(
      tests,
      true,
      false,
      false,
      defaultDisplayLevel
    );

    const expected = [
      tableHeaders,
      [
        {
          data: `<ul>
<li><strong>info</strong>: Annotation 1</li>
<li><strong>info</strong>: Annotation 2</li>
</ul>`,
          header: false,
          colspan: "4",
        },
      ],
      [
        { data: "Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
      ],
      [
        {
          data: "<p><strong>doc</strong>: Annotation 3</p>",
          header: false,
          colspan: "4",
        },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
      ],
    ];

    expect(result).toEqual(expected);
  });

  it("should return the table rows with annotations and tags", async () => {
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

    const result = await getTableRows(
      tests,
      true,
      true,
      true,
      defaultDisplayLevel
    );

    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Tags", header: true });
    clonedTableHeaders.push({ data: "Error", header: true });

    const expected = [
      clonedTableHeaders,
      [
        {
          data: "<p><strong>info</strong>: Annotation 1</p>",
          header: false,
          colspan: "6",
        },
      ],
      [
        { data: "Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
        { data: "tag1, tag2", header: false },
        { data: "", header: false },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
        { data: "tag1", header: false },
        { data: "Test failed", header: false },
      ],
    ];

    expect(result).toEqual(expected);
  });

  it("should return the table rows with annotations in column", async () => {
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
        annotations: [
          { type: "info", description: "Annotation 1" },
          { type: "info", description: "Annotation 2" },
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
        annotations: [{ type: "doc", description: "Annotation 3" }],
      },
    ];

    const result = await getTableRows(
      tests,
      true,
      false,
      false,
      defaultDisplayLevel,
      true
    );
    const expected = [
      tableHeadersWithAnnotationColumn,
      [
        { data: "Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
        {
          data: `<ul>
<li><strong>info</strong>: Annotation 1</li>
<li><strong>info</strong>: Annotation 2</li>
</ul>`,
          header: false,
        },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
        {
          data: "<p><strong>doc</strong>: Annotation 3</p>",
          header: false,
        },
      ],
    ];

    expect(result).toEqual(expected);
  });
  it("should return the table rows with annotations in column without annotations", async () => {
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

    const result = await getTableRows(
      tests,
      true,
      false,
      false,
      defaultDisplayLevel,
      true
    );
    const expected = [
      tableHeadersWithAnnotationColumn,
      [
        { data: "Test 1", header: false },
        { data: "✅ Pass", header: false },
        { data: "1s", header: false },
        { data: "", header: false },
        {
          data: "",
          header: false,
        },
      ],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
        {
          data: "",
          header: false,
        },
      ],
    ];

    expect(result).toEqual(expected);
  });
});
