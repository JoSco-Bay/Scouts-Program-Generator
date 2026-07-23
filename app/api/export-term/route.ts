import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, PageOrientation, VerticalAlign,
} from "docx";
import type { GroupConfig, TermRow } from "@/lib/types";

const SECTION_DOCX = {
  Joeys:     { accent: "C17F24", pale: "FEF3DC", header: "2C3E6B", titleText: "000000" },
  Cubs:      { accent: "E8B800", pale: "FFFACC", header: "3D2800", titleText: "000000" },
  Scouts:    { accent: "6BBF5A", pale: "E8F5E4", header: "1A4D12", titleText: "000000" },
  Venturers: { accent: "AA2A33", pale: "F5E0E2", header: "AA2A33", titleText: "FFFFFF" },
} as const;

const COL_WIDTHS = [895, 1500, 1144, 2977, 1984, 1027, 939]; // Date, Topic, Location, Focus/Notes, Bring, Leader, Asst Patrol
const TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0);
const HEADER_LABELS = ["DATE", "TOPIC THEME", "LOCATION", "FOCUS NOTES", "BRING", "LEADER", "ASST PATROL"];
const BODY_SIZE = 19; // half-points = 9.5pt

function formatTime12(t: string): string {
  if (!t) return "";
  if (/am|pm/i.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  const h = parseInt(m[1], 10), min = m[2];
  return `${h % 12 || 12}:${min}${h >= 12 ? "pm" : "am"}`;
}

function parseDateParts(date: string): { top: string; month: string } {
  const m = (date || "").match(/^(\S+),?\s+(\d+)\s+(\S+)$/);
  if (m) return { top: `${m[1]} ${m[2]}`, month: m[3] };
  return { top: date || "", month: "" };
}

function run(text: string, opts: Partial<{ bold: boolean; color: string; size: number; italics: boolean }> = {}) {
  return new TextRun({ text, font: "Arial", size: opts.size ?? BODY_SIZE, bold: opts.bold, color: opts.color ?? "000000", italics: opts.italics });
}

function para(children: TextRun[]) {
  return new Paragraph({ children, spacing: { after: 20 } });
}

function cell(children: Paragraph[], width: number, fill?: string, columnSpan?: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    children: children.length ? children : [new Paragraph({ children: [] })],
  });
}

function cellBorders() {
  const line = { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" };
  return { top: line, bottom: line, left: line, right: line };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const termName: string = body.termName || "Term Plan";
    const config: GroupConfig | undefined = body.config;
    const rows: TermRow[] = Array.isArray(body.rows) ? body.rows : [];

    if (!config) {
      return Response.json({ error: "Missing group config" }, { status: 400 });
    }

    const palette = SECTION_DOCX[config.section] || SECTION_DOCX.Joeys;
    const sessionCount = rows.filter(r => r.rowType === "session").length;

    const titleRow = new TableRow({
      children: [
        cell(
          [para([run(`${termName}  —  ${config.section}`, { bold: true, size: 24, color: palette.titleText })])],
          TABLE_WIDTH, palette.accent, 7,
        ),
      ],
    });

    const metaRow = new TableRow({
      children: [
        cell(
          [para([run(`${config.groupName} · ${config.meetingDay}s · ${sessionCount} sessions`, { size: BODY_SIZE })])],
          TABLE_WIDTH, "D9D9D9", 7,
        ),
      ],
    });

    const headerRow = new TableRow({
      children: HEADER_LABELS.map((label, i) =>
        cell([para([run(label, { bold: true, color: "1E3A5F", size: BODY_SIZE })])], COL_WIDTHS[i], "BDD7EE"),
      ),
    });

    const dataRows = rows.map(row => {
      const fill = row.rowType === "session" ? palette.pale : "FFFFFF";
      const { top, month } = parseDateParts(row.date);
      const time = formatTime12(row.time);

      const dateParas = [
        para([run(top, { bold: true })]),
      ];
      if (month) dateParas.push(para([run(month)]));
      if (time) dateParas.push(para([run(time, { size: 16, color: "6B7280" })]));

      const topicParas = [para([run(row.topic || "")])];
      if (row.consentRequired) topicParas.push(para([run("⚠ Consent required", { bold: true, color: "C0392B", size: 16 })]));

      const focusParas: Paragraph[] = [];
      if (row.oasFocus) focusParas.push(para([run(row.oasFocus, { bold: true, color: palette.header })]));
      if (row.sessionNotes) focusParas.push(para([run(row.sessionNotes)]));

      return new TableRow({
        children: [
          cell(dateParas, COL_WIDTHS[0], fill),
          cell(topicParas, COL_WIDTHS[1], fill),
          cell([para([run(row.location || "")])], COL_WIDTHS[2], fill),
          cell(focusParas, COL_WIDTHS[3], fill),
          cell([para([run(row.bring || "")])], COL_WIDTHS[4], fill),
          cell([para([run(row.leader || "")])], COL_WIDTHS[5], fill),
          cell([para([run(row.assistantPatrol || "")])], COL_WIDTHS[6], fill),
        ],
      });
    });

    const table = new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: COL_WIDTHS,
      borders: cellBorders(),
      rows: [titleRow, metaRow, headerRow, ...dataRows],
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [table],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = (termName || "term-plan").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  } catch (err: unknown) {
    console.error("export-term error:", err);
    return Response.json({ error: (err as Error).message || "Failed to generate Word document" }, { status: 500 });
  }
}
