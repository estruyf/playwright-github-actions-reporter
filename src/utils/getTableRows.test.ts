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

describe("getTableRows", () => {
  it("should return the table rows with headers and data", () => {
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

    const result = getTableRows(tests, false, false, true);
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

  it("should return the table rows without error column if showError is false", () => {
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

    const result = getTableRows(tests, false, false, false);

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

  it("should return an empty array if tests is empty (without error header)", () => {
    const result = getTableRows([], false, false, false);

    expect(result).toEqual([tableHeaders]);
  });

  it("should return an empty array if tests is empty (including error header)", () => {
    const result = getTableRows([], false, false, true);
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    expect(result).toEqual([clonedTableHeaders]);
  });

  it("should return the table rows with annotations", () => {
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

    const result = getTableRows(tests, true, false, false);

    const expected = [
      tableHeaders,
      [
        {
          data: "<b>info</b>: Annotation 1\n<b>info</b>: Annotation 2",
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
      [{ data: "<b>doc</b>: Annotation 3", header: false, colspan: "4" }],
      [
        { data: "Test 2", header: false },
        { data: "❌ Fail", header: false },
        { data: "2s", header: false },
        { data: "1", header: false },
      ],
    ];

    expect(result).toEqual(expected);
  });

  it("should return the table rows with annotations and tags", () => {
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

    const result = getTableRows(tests, true, true, true);

    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Tags", header: true });
    clonedTableHeaders.push({ data: "Error", header: true });

    const expected = [
      clonedTableHeaders,
      [{ data: "<b>info</b>: Annotation 1", header: false, colspan: "6" }],
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
});
