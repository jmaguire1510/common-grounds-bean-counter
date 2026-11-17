import { readFile } from "fs/promises";
import { join } from "path";

const CSV_PATH = join(process.cwd(), "data", "entries.csv");

export async function GET() {
  try {
    const content = await readFile(CSV_PATH, "utf-8");

    return new Response(content, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="entries.csv"',
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to export entries" },
      { status: 500 }
    );
  }
}
