import { readFile } from "fs/promises";
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

export async function GET() {
  try {
    const content = await readFile(CSV_PATH, "utf-8");
    const entries = parseCSV(content);

    if (entries.length === 0) {
      return Response.json({
        drinks_latest_week: null,
        revenue_latest_week: null,
        monthly_goal_progress: null,
        by_location: [],
      });
    }

    // Find the latest week
    const latestWeek = entries[entries.length - 1].week_of;

    // Get entries for the latest week
    const latestWeekEntries = entries.filter((e) => e.week_of === latestWeek);

    // Calculate stats for latest week
    const drinks_latest_week = latestWeekEntries.reduce(
      (sum, e) => sum + (Number(e.drinks_sold) || 0),
      0
    );
    const revenue_latest_week = latestWeekEntries.reduce(
      (sum, e) => sum + (Number(e.revenue) || 0),
      0
    );

    // Group by location for all time stats
    const byLocation = {};
    entries.forEach((entry) => {
      if (!byLocation[entry.location]) {
        byLocation[entry.location] = {
          location: entry.location,
          drinks_sold: 0,
          revenue: 0,
          loyalty_signups: 0,
          bags_sold: 0,
          entries_count: 0,
        };
      }
      byLocation[entry.location].drinks_sold +=
        Number(entry.drinks_sold) || 0;
      byLocation[entry.location].revenue += Number(entry.revenue) || 0;
      byLocation[entry.location].loyalty_signups +=
        Number(entry.loyalty_signups) || 0;
      byLocation[entry.location].bags_sold += Number(entry.bags_sold) || 0;
      byLocation[entry.location].entries_count += 1;
    });

    // Calculate monthly goal progress (assuming $15,000 goal)
    const MONTHLY_GOAL = 15000;
    const goal_progress_pct = Math.round(
      (revenue_latest_week / MONTHLY_GOAL) * 100
    );

    return Response.json({
      drinks_latest_week,
      revenue_latest_week,
      goal_progress_pct,
      by_location: Object.values(byLocation),
    });
  } catch (error) {
    console.error("Error reading entries:", error);
    return Response.json(
      { error: "Failed to read entries" },
      { status: 500 }
    );
  }
}
