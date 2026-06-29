import Redis from "ioredis";
import { buildRedisKey } from "./nse.js";

const BATCH_SIZE = 100;

let redisClient;

function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
  });

  return redisClient;
}

export async function storeSecListRows(rows) {
  const redis = getRedisClient();

  let stored = 0;

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const pipeline = redis.pipeline();

    for (const row of batch) {
      pipeline.hset(buildRedisKey(row.symbol, row.series), {
        band: row.band ?? "",
        remarks: row.remarks ?? "",
      });
    }

    await pipeline.exec();
    stored += batch.length;
  }

  return stored;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = undefined;
  }
}
