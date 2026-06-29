import { parse } from "csv-parse/sync";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js'; // required for DD-MM-YYYY
dayjs.extend(customParseFormat);


const PRICEBANDS_LIST_CSV_BASE_URL = process.env.PRICEBANDS_LIST_CSV_BASE_URL;
const PRICEBANDS_LIST_CSV_HEADERS = {
  "User-Agent": process.env.PRICEBANDS_LIST_CSV_USER_AGENT,
  Accept: "text/csv,application/csv,text/plain,*/*",
  Referer: process.env.PRICEBANDS_LIST_CSV_REFERER,
};

export function buildSecListCsvUrl(date) {
  const customDateForUrl = dayjs(date, "DD-MM-YYYY").format("DDMMYYYY");
  if (customDateForUrl == "Invalid Date") {
    throw new Error(`${date} is invalid`)
  }
  return `${PRICEBANDS_LIST_CSV_BASE_URL}_${customDateForUrl}.csv`;
}

export async function fetchSeedListCsv(date) {
  const url = buildSecListCsvUrl(date);
  const response = await fetch(url, { headers: PRICEBANDS_LIST_CSV_HEADERS });
  if (!response.ok) {
    debugger
    throw new Error(response.statusText, {
      cause: `Request failed to ${url} for ${date}`,
      status: response.status,
    });
  }
  const textResponse = await response.text();
  return {
    url,
    response: textResponse,
  }
}

export function parseSecListCsv(csvText) {
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });

  return rows
    .map((row) => {
      const symbol = row.Symbol?.trim();
      const series = row.Series?.trim();
      const band = row.Band?.trim();
      const isFnO = band === "No Band" ? true : false;
      const remarks = row.Remarks?.trim();

      if (!symbol || !series) {
        return null;
      }

      return { symbol, series, band : isFnO ? 'FnO' : band, remarks: remarks === '-' ? null : remarks };
    })
    .filter((row) => row !== null);
}

export function buildRedisKey(symbol, series) {
  return `${symbol}<>${series}`;
}

export function getRedisKeyForLastSync(date) {
  return `PRICEBANDS<>DATASYNC`;
}
