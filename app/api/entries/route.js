import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const CSV_PATH = join(process.cwd(), "data", "entries.csv");

function parseCSV(content) {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",");
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const entry = {};
    headers.forEach((header, index) => {
      entry[header.trim()] = values[index]?.trim() || "";
    });
    entries.push(entry);
  }

  return entries;
}

function entriesToCSV(entries) {
  if (entries.length === 0) {
    return "week_of,location,drinks_sold,revenue,loyalty_signups,bags_sold,notes\n";
  }

  const headers = Object.keys(entries[0]);
  let csv = headers.join(",") + "\n";

  for (const entry of entries) {
    const values = headers.map((header) => entry[header] || "");
    csv += values.join(",") + "\n";
  }

  return csv;
}

export async function GET() {
  try {
    const content = await readFile(CSV_PATH, "utf-8");
    const entries = parseCSV(content);
    return Response.json({ entries });
  } catch (error) {
    return Response.json(
      { error: "Failed to read entries" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.week_of ||
      !body.location ||
      body.drinks_sold === "" ||
      body.revenue === ""
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Read existing entries
    const content = await readFile(CSV_PATH, "utf-8");
    const entries = parseCSV(content);

    // Add new entry
    const newEntry = {
      week_of: body.week_of,
      location: body.location,
      drinks_sold: body.drinks_sold,
      revenue: body.revenue,
      loyalty_signups: body.loyalty_signups || "",
      bags_sold: body.bags_sold || "",
      notes: body.notes || "",
    };

    entries.push(newEntry);

    // Write back to CSV
    const updatedCSV = entriesToCSV(entries);
    await writeFile(CSV_PATH, updatedCSV, "utf-8");

    return Response.json({ success: true, entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error("Error saving entry:", error);
    return Response.json(
      { error: "Failed to save entry" },
      { status: 500 }
    );
  }
}
