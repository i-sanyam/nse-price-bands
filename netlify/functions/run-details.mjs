import { disconnectRedis, getLastSeedDetails, getLastUpdateDetails } from "../../lib/redis.js";
import { requireApiKey, API_KEY_TYPES } from "../../lib/auth.js";

export default async function handler(req) {
  const authResponse = requireApiKey(req, API_KEY_TYPES.WRITE);
  if (authResponse) {
    return authResponse;
  }

  const body = await req.json();
  const {runType} = body;
  if (!runType || !["SEED", "UPDATE"].includes(runType)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Run Type is required. Valid types are SEED, UPDATE',
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  try {
    const lastData = runType === "SEED" ? await getLastSeedDetails() : await getLastUpdateDetails();
    const response = {
      date: lastData.date,
      success: true,
      rowCount: lastData.rows,
      storedCount: lastData.stored,
      lastRunAt: lastData.t,
    };
    if (runType === 'UPDATE') {
      response.mismatchCount = lastData.mismatch;
      response.uptodateCount = lastData.uptodate;
    }
    return new Response(
      JSON.stringify(response),
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