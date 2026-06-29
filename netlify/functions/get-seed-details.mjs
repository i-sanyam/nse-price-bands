import { disconnectRedis, getLastSeedDetails } from "../../lib/redis.js";

export default async function handler() {
  try {
    const lastSeedData = await getLastSeedDetails();
    return new Response(
      JSON.stringify({
        date: lastSeedData.date,
        success: true,
        rowCount: lastSeedData.rowCount,
        storedCount: lastSeedData.storedCount,
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
  method: "GET",
}