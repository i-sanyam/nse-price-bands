import { disconnectRedis, getPriceBand } from "../../lib/redis.js";

export default async function handler(req) {
    const body = await req.json();
    const { symbol, series } = body;
    if (!symbol || !series) {
        return new Response(
            JSON.stringify({
              success: false,
              message: 'Series and Symbol are required',
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
    }
  try {
    const priceBandDetails = await getPriceBand(symbol, series);
    debugger;
    return new Response(
      JSON.stringify({
        band: priceBandDetails.band,
        remarks: priceBandDetails.remarks,
      }),
      {
        status: 200,
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