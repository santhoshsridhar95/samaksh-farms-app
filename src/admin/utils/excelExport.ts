type WorkbookShop = {
  id: number | string;
  customerName?: string;
  address?: string;
  phoneNumber?: string;
  location?: string;
  defaultBoxPrice?: number;
};

type WorkbookSale = {
  customerId?: number | string;
  customerName?: string;
  saleDate?: string;
  quantity?: number;
  returnedBoxes?: number;
  amountCollected?: number;
  unitPrice?: number;
  totalAmount?: number;
  pendingAmount?: number;
  remarks?: string;
};

type WorkbookSheet = {
  name: string;
  xml: string;
  rels?: string;
};

const employeeNames = ["Santhosh", "Shashank", "Sandeep"];

export function downloadSalesWorkbook(
  shops: WorkbookShop[],
  sales: WorkbookSale[],
) {
  const activeShops = shops.length > 0 ? shops : shopsFromSales(sales);
  const sheetNames = uniqueSheetNames(activeShops);
  const locations = Array.from(
    new Set(activeShops.map((shop) => shop.location || "R.T. Nagar")),
  );
  const workbookName =
    locations.length === 1
      ? `SalesSheet-${fileSafeName(locations[0])}.xlsx`
      : "SalesSheet-All-Locations.xlsx";

  const workbookSheets: WorkbookSheet[] = [
    {
      name: "Sheet1",
      xml: listingSheetXml(activeShops, sheetNames),
    },
    ...activeShops.map((shop, index) => ({
      name: sheetNames[index],
      xml: shopSheetXml(
        shop,
        sales.filter((sale) => String(sale.customerId) === String(shop.id)),
        sheetNames[index],
      ),
    })),
  ];

  const files: Record<string, string | Uint8Array> = {
    "[Content_Types].xml": contentTypesXml(workbookSheets.length),
    "_rels/.rels": rootRelsXml(),
    "xl/workbook.xml": workbookXml(workbookSheets),
    "xl/_rels/workbook.xml.rels": workbookRelsXml(workbookSheets.length),
    "xl/styles.xml": stylesXml(),
  };

  workbookSheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = sheet.xml;
  });

  const blob = new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = workbookName;
  link.click();
  URL.revokeObjectURL(url);
}

function listingSheetXml(shops: WorkbookShop[], sheetNames: string[]) {
  const rows = [
    rowXml(2, [emptyCell("A2"), emptyCell("B2"), textCell("C2", "left this area to put some other details")]),
    rowXml(6, [
      textCell("A6", "Sl No", 1),
      textCell("B6", "Shop Name", 1),
      textCell("C6", "Shop Address", 1),
      textCell("D6", "Contact no", 1),
      textCell("E6", "Sheet Name Link", 1),
    ]),
    ...shops.map((shop, index) =>
      rowXml(7 + index, [
        numberCell(`A${7 + index}`, index + 1),
        textCell(`B${7 + index}`, shop.customerName || "Shop"),
        textCell(`C${7 + index}`, shop.address || shop.location || ""),
        textCell(`D${7 + index}`, shop.phoneNumber || ""),
        textCell(`E${7 + index}`, "Open Sheet", 2),
      ]),
    ),
  ];
  const hyperlinks = shops
    .map(
      (_shop, index) =>
        `<hyperlink ref="E${7 + index}" location="'${escapeXml(sheetNames[index])}'!A1" display="Open Sheet"/>`,
    )
    .join("");

  return worksheetXml({
    columns:
      '<cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="43" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="18" customWidth="1"/></cols>',
    rows: rows.join(""),
    hyperlinks,
  });
}

function shopSheetXml(shop: WorkbookShop, sales: WorkbookSale[], sheetName: string) {
  const rows = [
    rowXml(1, [
      textCell("A1", "Name:", 3),
      textCell("B1", shop.customerName || "Shop", 3),
      emptyCell("C1", 3),
      emptyCell("D1", 3),
      emptyCell("E1"),
      textCell("F1", "Total Sales Calc:", 1),
      formulaCell("G1", "(B5-C5)*B3", 4),
      emptyCell("H1"),
      textCell("I1", "Back to Listing Page", 2),
    ]),
    rowXml(2, [
      textCell("A2", "Address:", 3),
      textCell("B2", shop.address || shop.location || "", 3),
      emptyCell("C2", 3),
      emptyCell("D2", 3),
      emptyCell("E2"),
      textCell("F2", "Amount Pending:", 1),
      formulaCell("G2", "G1-D5", 4),
    ]),
    rowXml(3, [
      textCell("A3", "Rate per Box:", 1),
      numberCell("B3", Number(shop.defaultBoxPrice) || 0),
    ]),
    rowXml(4, [
      textCell("A4", "Phone No", 1),
      textCell("B4", shop.phoneNumber || ""),
    ]),
    rowXml(5, [
      textCell("A5", "Total:", 1),
      formulaCell("B5", "SUM(B7:B1000)", 4),
      formulaCell("C5", "SUM(C7:C1000)", 4),
      formulaCell("D5", "SUM(D7:D1000)", 4),
      emptyCell("E5"),
      emptyCell("F5"),
      ...employeeNames.map((name, index) =>
        textCell(`${columnName(7 + index)}5`, name, 1),
      ),
    ]),
    rowXml(6, [
      textCell("A6", "Date", 1),
      textCell("B6", "Boxes count given", 1),
      textCell("C6", "Boxes returned", 1),
      textCell("D6", "Amount settled", 1),
      textCell("E6", "Amount with", 1),
      textCell("F6", "Total amount with", 1),
      formulaCell("G6", 'SUMIF(E:E,"Santhosh",D:D)', 1),
      formulaCell("H6", 'SUMIF(E:E,"Shashank",D:D)', 1),
      formulaCell("I6", 'SUMIF(E:E,"Sandeep",D:D)', 1),
    ]),
    ...sales.map((sale, index) => {
      const rowNumber = 7 + index;
      return rowXml(rowNumber, [
        dateCell(`A${rowNumber}`, sale.saleDate),
        numberCell(`B${rowNumber}`, Number(sale.quantity) || 0),
        numberCell(`C${rowNumber}`, Number(sale.returnedBoxes) || 0),
        numberCell(`D${rowNumber}`, Number(sale.amountCollected) || 0),
        textCell(`E${rowNumber}`, sale.amountCollected ? "Sandeep" : ""),
        formulaCell(`F${rowNumber}`, `(B${rowNumber}-C${rowNumber})*$B$3-D${rowNumber}`, 4),
      ]);
    }),
  ];

  return worksheetXml({
    columns:
      '<cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="16" customWidth="1"/><col min="6" max="9" width="16" customWidth="1"/></cols>',
    rows: rows.join(""),
    merges: '<mergeCells count="2"><mergeCell ref="B1:D1"/><mergeCell ref="B2:D2"/></mergeCells>',
    hyperlinks: `<hyperlink ref="I1" location="'Sheet1'!A1" display="Back to Listing Page"/>`,
    sheetName,
  });
}

function worksheetXml({
  columns,
  rows,
  merges = "",
  hyperlinks = "",
}: {
  columns: string;
  rows: string;
  merges?: string;
  hyperlinks?: string;
  sheetName?: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${columns}<sheetData>${rows}</sheetData>${merges}${hyperlinks ? `<hyperlinks>${hyperlinks}</hyperlinks>` : ""}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

function rowXml(rowNumber: number, cells: string[]) {
  return `<row r="${rowNumber}">${cells.join("")}</row>`;
}

function textCell(ref: string, value: string, style?: number) {
  return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t>${escapeXml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number, style?: number) {
  return `<c r="${ref}"${style ? ` s="${style}"` : ""}><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function dateCell(ref: string, value?: string) {
  if (!value) {
    return emptyCell(ref);
  }

  const date = new Date(value);
  const serial = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
  return numberCell(ref, serial, 5);
}

function formulaCell(ref: string, formula: string, style?: number) {
  return `<c r="${ref}"${style ? ` s="${style}"` : ""}><f>${escapeXml(formula)}</f></c>`;
}

function emptyCell(ref: string, style?: number) {
  return `<c r="${ref}"${style ? ` s="${style}"` : ""}/>`;
}

function workbookXml(sheets: WorkbookSheet[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("")}</sheets></workbook>`;
}

function workbookRelsXml(sheetCount: number) {
  const sheetRels = Array.from({ length: sheetCount }, (_value, index) => {
    const relId = index + 1;
    return `<Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${relId}.xml"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function contentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_value, index) => {
    const sheetNumber = index + 1;
    return `<Override PartName="/xl/worksheets/sheet${sheetNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCFE2F3"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC9DAF8"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function uniqueSheetNames(shops: WorkbookShop[]) {
  const used = new Set<string>();

  return shops.map((shop, index) => {
    const base = safeSheetName(shop.customerName || `Shop${index + 1}`) || `Shop${index + 1}`;
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate)) {
      const suffixText = String(suffix);
      candidate = `${base.slice(0, 31 - suffixText.length)}${suffixText}`;
      suffix += 1;
    }

    used.add(candidate);
    return candidate;
  });
}

function safeSheetName(value: string) {
  return value.replace(/[\\/?*[\]:]/g, "").replace(/\s+/g, "").slice(0, 31);
}

function fileSafeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Location";
}

function shopsFromSales(sales: WorkbookSale[]): WorkbookShop[] {
  const map = new Map<string, WorkbookShop>();

  sales.forEach((sale) => {
    const id = String(sale.customerId || sale.customerName || "Shop");

    if (!map.has(id)) {
      map.set(id, {
        id,
        customerName: sale.customerName,
        defaultBoxPrice: sale.unitPrice,
      });
    }
  });

  return Array.from(map.values());
}

function columnName(index: number) {
  let value = "";
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }

  return value;
}

function escapeXml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createZip(files: Record<string, string | Uint8Array>) {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => {
    const data = typeof content === "string" ? encoder.encode(content) : content;
    return {
      name,
      data,
      crc: crc32(data),
    };
  });
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, entry.crc, true);
    view.setUint32(18, entry.data.length, true);
    view.setUint32(22, entry.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    chunks.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, entry.crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  });

  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatUint8Arrays([...chunks, ...centralDirectory, end]);
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (let index = 0; index < data.length; index += 1) {
    crc ^= data[index];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
