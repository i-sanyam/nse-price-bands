import {
  fetchSecListCsv,
  formatDateDDMMYYYY,
  parseSecListCsv,
} from "../../lib/nse.js";
import { disconnectRedis, storeSecListRows } from "../../lib/redis.js";

export default async function handler() {
  try {
    const { date, url: csvUrl, response: csvText } = await fetchSecListCsv();
    const rows = parseSecListCsv(csvText);
    const storedCount = await storeSecListRows(rows);

    return new Response(
      JSON.stringify({
        ok: true,
        date: formatDateDDMMYYYY(date),
        url: csvUrl,
        rowCount: rows.length,
        storedCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Price Bands List Sync Failed:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        date: formatDateDDMMYYYY(),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  } finally {
    await disconnectRedis();
  }
}
