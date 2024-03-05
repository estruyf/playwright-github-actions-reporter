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

    const result = getTableRows(tests, true);
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    const expected = [
      clonedTableHeaders,
      [
        { data: "Test 1", header: false },
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

    const result = getTableRows(tests, false);

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
    const result = getTableRows([], false);

    expect(result).toEqual([tableHeaders]);
  });

  it("should return an empty array if tests is empty (including error header)", () => {
    const result = getTableRows([], true);
    const clonedTableHeaders = Object.assign([], tableHeaders);
    clonedTableHeaders.push({ data: "Error", header: true });

    expect(result).toEqual([clonedTableHeaders]);
  });
});
