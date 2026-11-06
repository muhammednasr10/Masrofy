function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value: string) {
  return escapeHtml(value);
}

function downloadBlob(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTransactionsExcel(headers: string[], rows: string[][], filename: string) {
  const allRows = [headers, ...rows];
  const body = allRows
    .map(
      (row) =>
        `<Row>${row
          .map(
            (cell) =>
              `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`,
          )
          .join("")}</Row>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Transactions"><Table>${body}</Table></Worksheet>
</Workbook>`;

  downloadBlob(xml, "application/vnd.ms-excel;charset=utf-8", filename);
}

export function downloadTransactionsPdf(title: string, headers: string[], rows: string[][]) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");

  if (!popup) {
    return;
  }

  const head = headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("");
  const body = rows
    .map(
      (row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");

  popup.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: start; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  <script>window.addEventListener("load", function () { window.print(); });</script>
</body>
</html>`);
  popup.document.close();
}
