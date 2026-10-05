import {
  getColumnWidths,
  getTableHeaders,
  getTableHtml,
} from "./summaryTable.js";

describe("summaryTable", () => {
  describe("getColumnWidths", () => {
    it("should give the full width to the test column when it is the only text column", () => {
      expect(
        getColumnWidths(["File", "Test", "Duration", "Retries"]),
      ).toEqual([undefined, "100%", undefined, undefined]);
    });

    it("should share the width between the test and error columns", () => {
      expect(
        getColumnWidths(["Test", "Status", "Duration", "Retries", "Error"]),
      ).toEqual(["40%", undefined, undefined, undefined, "60%"]);
    });

    it("should add up to 100% when the percentages are rounded", () => {
      expect(
        getColumnWidths(["Test", "Status", "Annotations", "Error"]),
      ).toEqual(["33%", undefined, "17%", "50%"]);
      expect(getColumnWidths(["Test", "Annotations"])).toEqual(["67%", "33%"]);
    });

    it("should not set a width without text columns", () => {
      expect(getColumnWidths(["File", "Duration"])).toEqual([
        undefined,
        undefined,
      ]);
    });
  });

  describe("getTableHeaders", () => {
    it("should only add a width to the text columns", () => {
      expect(getTableHeaders(["File", "Test", "Error"])).toEqual([
        { data: "File", header: true },
        { data: "Test", header: true, width: "40%" },
        { data: "Error", header: true, width: "60%" },
      ]);
    });
  });

  describe("getTableHtml", () => {
    it("should render the rows like @actions/core with the column widths", () => {
      expect(
        getTableHtml([
          getTableHeaders(["Test", "Status"]),
          [{ data: "My test" }, "✅&nbsp;Pass"],
          [{ data: "Annotation", colspan: "2", header: false }],
        ]),
      ).toBe(
        `<table><tr><th width="100%">Test</th><th>Status</th></tr><tr><td>My test</td><td>✅&nbsp;Pass</td></tr><tr><td colspan="2">Annotation</td></tr></table>`,
      );
    });
  });
});
