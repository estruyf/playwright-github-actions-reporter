// Same shape as the summary table of @actions/core, plus a column width
export interface SummaryTableCell {
  data: string;
  header?: boolean;
  colspan?: string;
  rowspan?: string;
  width?: string;
}

export type SummaryTableRow = (SummaryTableCell | string)[];

// How the text columns share the width of the table, all other columns are
// as wide as their content
const COLUMN_WEIGHTS: Record<string, number> = {
  Test: 2,
  Annotations: 1,
  Error: 3,
};

/**
 * GitHub sizes tables to their content (`width: max-content`). When the
 * percentages of the text columns add up to 100% and at least one other
 * column has no width, the table fills the full width instead.
 */
export const getColumnWidths = (columns: string[]): (string | undefined)[] => {
  const totalWeight = columns.reduce(
    (total, column) => total + (COLUMN_WEIGHTS[column] || 0),
    0,
  );
  if (totalWeight === 0) {
    return columns.map(() => undefined);
  }

  const lastWeighted = columns.reduce(
    (last, column, idx) => (COLUMN_WEIGHTS[column] ? idx : last),
    -1,
  );
  let remaining = 100;

  return columns.map((column, idx) => {
    const weight = COLUMN_WEIGHTS[column];
    if (!weight) {
      return undefined;
    }

    // The last text column gets the rest, so rounding still adds up to 100%
    if (idx === lastWeighted) {
      return `${remaining}%`;
    }

    const percentage = Math.round((weight / totalWeight) * 100);
    remaining -= percentage;
    return `${percentage}%`;
  });
};

export const getTableHeaders = (columns: string[]): SummaryTableCell[] => {
  const widths = getColumnWidths(columns);

  return columns.map((data, idx) => ({
    data,
    header: true,
    ...(widths[idx] ? { width: widths[idx] } : {}),
  }));
};

/**
 * Renders the rows like `summary.addTable` of @actions/core does, which does
 * not support a column width.
 */
export const getTableHtml = (rows: SummaryTableRow[]): string => {
  const body = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          if (typeof cell === "string") {
            return `<td>${cell}</td>`;
          }

          const { header, data, colspan, rowspan, width } = cell;
          const tag = header ? "th" : "td";
          const attrs = Object.entries({ colspan, rowspan, width })
            .filter(([, value]) => value)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join("");

          return `<${tag}${attrs}>${data}</${tag}>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table>${body}</table>`;
};
