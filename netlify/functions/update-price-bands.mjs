import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js'; // required for DD-MM-YYYY
dayjs.extend(customParseFormat);
import {
  fetchListCsv,
  parseUpdateListCsv,
} from "../../lib/nse.js";
import { disconnectRedis, updatePriceBandRows, getLastUpdateDetails, setLastUpdateDetails } from "../../lib/redis.js";

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
    if (!body.forceUpdate) {
        const lastUpdatedData = await getLastUpdateDetails();
        if (lastUpdatedData.date === date) {
          return new Response(
            JSON.stringify({
              date: lastUpdatedData.date,
              success: true,
              rowCount: lastUpdatedData.rows,
              storedCount: lastUpdatedData.stored,
              mismatchCount: lastUpdatedData.mismatch,
              uptodateCount: lastUpdatedData.uptodate,
              lastUpdatedAt: lastUpdatedData.t,
              message: "Price Bands already updated"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
    }
    const { url: csvUrl, response: csvText } = await fetchListCsv(date, "UPDATE");
    const rows = parseUpdateListCsv(csvText);
    const { stored: storedCount, mismatch: mismatchCount, uptodate: uptodateCount } = await updatePriceBandRows(rows);
    await setLastUpdateDetails(date, rows.length, storedCount, mismatchCount, uptodateCount);
    return new Response(
      JSON.stringify({
        date,
        success: true,
        url: csvUrl,
        rowCount: rows.length,
        storedCount, mismatchCount, uptodateCount,
        message: "Price Bands updated successfully"
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