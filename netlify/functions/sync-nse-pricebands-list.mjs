import {
  fetchSecListCsv,
  parseSecListCsv,
} from "../../lib/nse.js";
import { disconnectRedis, storeSecListRows } from "../../lib/redis.js";

export default async function handler(req, context) {
  try {
    const body = await req.json();
    const { date, url: csvUrl, response: csvText } = await fetchSecListCsv(body.date);
    const rows = parseSecListCsv(csvText);
    const storedCount = await storeSecListRows(rows);

    return new Response(
      JSON.stringify({
        date,
        success: true,
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
        error,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
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

export const config = {
  // path: "/syncPriceBands",
  method: "POST",
}