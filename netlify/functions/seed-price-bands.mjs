import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js'; // required for DD-MM-YYYY
dayjs.extend(customParseFormat);
import {
  fetchSeedListCsv,
  parseSecListCsv,
} from "../../lib/nse.js";
import { disconnectRedis, storePriceBandRows, getRedisClient, getLastSeedDetails, setLastSeedDetails } from "../../lib/redis.js";

function getValidDate (date) {
  if (date && !dayjs(date, "DD-MM-YYYY", true).isValid()) { // param date is invalid
    throw new Error(`${date} is invalid`)
  } else if (!date) { // when param date is not used, use current date
    date = dayjs().format("DD-MM-YYYY");
  }
  return date;
}

export default async function handler(req, context) {
  try {
    const body = await req.json();
    const date = getValidDate(body.date);
    if (!date) {
      throw new Error(`${date} is invalid`);
    }
    const lastSeedData = await getLastSeedDetails();
    if (lastSeedData.date === date) {
      return new Response(
        JSON.stringify({
          date: lastSeedData.date,
          success: true,
          rowCount: lastSeedData.rowCount,
          storedCount: lastSeedData.storedCount,
          message: "Price Bands already seeded"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const { url: csvUrl, response: csvText } = await fetchSeedListCsv(date);
    const rows = parseSecListCsv(csvText);
    const storedCount = await storePriceBandRows(rows);
    await setLastSeedDetails(date, rows.length, storedCount);
    return new Response(
      JSON.stringify({
        date,
        success: true,
        url: csvUrl,
        rowCount: rows.length,
        storedCount,
        message: "Price Bands seeded successfully"
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        cause: error.cause,
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
  method: "POST",
}