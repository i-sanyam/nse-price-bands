import Redis from "ioredis";
import { buildRedisKey, getRedisKeyForLastSync } from "./nse.js";

const BATCH_SIZE = 100;

let redisClient;

export function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_SERVER_URL;
  if (!redisUrl) {
    throw new Error("REDIS_SERVER_URL environment variable is required");
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
  });

  return redisClient;
}

export async function storePriceBandRows(rows) {
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

export async function hset(key, jsonValue) {
  const redis = getRedisClient();
  const r = await redis.hset(key, jsonValue);
  return r;
}

export async function hgetall(key) {
  const redis = getRedisClient();
  const r = await redis.hgetall(key);
  return r;
}

export async function getLastSeedDetails() {
  const key = getRedisKeyForLastSync();
  return hgetall(key);
}

export async function setLastSeedDetails(date, rowCount, storedCount) {
  const key = getRedisKeyForLastSync();
  const r = await hset(key, {
    date, rowCount, storedCount,
  });
  return r;
}

export async function getPriceBand(symbol, series) {
  const key = buildRedisKey(symbol, series);
  const data = await hgetall(key);
  debugger;
  return {
    band: data.band,
    remarks: data.remarks,
  };
}