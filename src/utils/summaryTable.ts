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
 * Spacer that makes the table fill the full width of the summary. GitHub sizes
 * tables to their content (`width: max-content`, `max-width: 100%`), so the
 * wide image stretches the table up to the page width. GitHub limits images
 * to the cell width, so it never overflows, and `align` floats it so it does
 * not add a line to the header.
 */
export const TABLE_SPACER = `<img width="10000" height="0" align="left">`;

/**
 * Percentages of the text columns, which add up to 100%. They share the free
 * space of the table between the text columns.
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
  const spacerIdx = widths.reduce(
    (last, width, idx) => (width ? idx : last),
    -1,
  );

  return columns.map((column, idx) => ({
    data: idx === spacerIdx ? `${column}${TABLE_SPACER}` : column,
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
