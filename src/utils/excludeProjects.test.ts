import { excludeProjects, isProjectExcluded } from "./excludeProjects.js";
import { getSummaryDetails } from "./getSummaryDetails.js";

const createProject = (name: string | undefined, statuses: string[]) => {
  const tests = statuses.map((status) => ({
    results: [{ status, retry: 0 }],
  }));
  return {
    project: () => (name === undefined ? undefined : { name }),
    allTests: () => tests,
  };
};

const createSuite = (projects: any[]): any => ({
  suites: projects,
  allTests: () => projects.flatMap((p) => p.allTests()),
});

describe("excludeProjects", () => {
  describe("isProjectExcluded", () => {
    it("should not exclude anything without patterns", () => {
      expect(isProjectExcluded("setup")).toBe(false);
      expect(isProjectExcluded("setup", [])).toBe(false);
    });

    it("should match strings against the full project name", () => {
      expect(isProjectExcluded("setup", ["setup"])).toBe(true);
      expect(isProjectExcluded("setup-pages", ["setup"])).toBe(false);
      expect(isProjectExcluded("chromium", ["setup"])).toBe(false);
    });

    it("should match regexes", () => {
      expect(isProjectExcluded("setup-pages", [/^setup-/])).toBe(true);
      expect(isProjectExcluded("setup", [/^setup-/])).toBe(false);
      expect(isProjectExcluded("Setup-Pages", [/^setup-/i])).toBe(true);
    });

    it("should match global regexes every time", () => {
      const pattern = /^setup-/g;
      expect(isProjectExcluded("setup-pages", [pattern])).toBe(true);
      expect(isProjectExcluded("setup-pages", [pattern])).toBe(true);
    });

    it("should combine strings and regexes", () => {
      const patterns = ["setup", /^setup-/];
      expect(isProjectExcluded("setup", patterns)).toBe(true);
      expect(isProjectExcluded("setup-webparts", patterns)).toBe(true);
      expect(isProjectExcluded("chromium", patterns)).toBe(false);
    });

    it("should ignore patterns that are not a string or regex", () => {
      expect(isProjectExcluded("setup", [{} as any])).toBe(false);
    });
  });

  describe("excludeProjects", () => {
    it("should return the suite as is without patterns", () => {
      const suite = createSuite([createProject("setup", ["passed"])]);
      expect(excludeProjects(suite)).toBe(suite);
      expect(excludeProjects(suite, [])).toBe(suite);
    });

    it("should leave out the excluded projects", () => {
      const setup = createProject("setup", ["passed"]);
      const setupPages = createProject("setup-pages", ["passed", "passed"]);
      const chromium = createProject("chromium", ["passed", "skipped"]);
      const suite = createSuite([setup, setupPages, chromium]);

      const result = excludeProjects(suite, ["setup", /^setup-/]);
      expect(result.suites).toEqual([chromium]);
      expect(result.allTests().length).toBe(2);
    });

    it("should keep an excluded project with a failed test", () => {
      const setup = createProject("setup", ["passed", "failed"]);
      const setupPages = createProject("setup-pages", ["timedOut"]);
      const chromium = createProject("chromium", ["skipped"]);
      const suite = createSuite([setup, setupPages, chromium]);

      const result = excludeProjects(suite, ["setup", /^setup-/]);
      expect(result.suites).toEqual([setup, setupPages, chromium]);
    });

    it("should leave out excluded projects from the header totals", () => {
      const suite = createSuite([
        createProject("setup", ["passed"]),
        createProject("chromium", ["passed", "failed"]),
      ]);

      const result = getSummaryDetails(excludeProjects(suite, ["setup"]));
      expect(result).toEqual(["Total tests: 2", "Passed: 1", "Failed: 1"]);
    });

    it("should keep projects without a name", () => {
      const unnamed = createProject(undefined, ["passed"]);
      const suite = createSuite([unnamed]);

      expect(excludeProjects(suite, ["setup"]).suites).toEqual([unnamed]);
    });
  });
});
