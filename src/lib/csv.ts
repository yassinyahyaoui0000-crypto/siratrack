function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);

  if (
    normalized.includes(",") ||
    normalized.includes("\"") ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
}

export function buildCsv(
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
  headers: string[],
) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}
