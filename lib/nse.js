import { parse } from "csv-parse/sync";

const PRICEBANDS_LIST_CSV_BASE_URL = process.env.PRICEBANDS_LIST_CSV_BASE_URL;
const PRICEBANDS_LIST_CSV_HEADERS = {
  "User-Agent": process.env.PRICEBANDS_LIST_CSV_USER_AGENT,
  Accept: "text/csv,application/csv,text/plain,*/*",
  Referer: process.env.PRICEBANDS_LIST_CSV_REFERER,
};

export function formatDateDDMMYYYY(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  return `${day}${month}${year}`;
}

export function buildSecListCsvUrl(date = new Date()) {
  return `${PRICEBANDS_LIST_CSV_BASE_URL}_${formatDateDDMMYYYY(date)}.csv`;
}

export async function fetchSecListCsv(date = new Date()) {
  const url = buildSecListCsvUrl(date);

  const response = await fetch(url, { headers: PRICEBANDS_LIST_CSV_HEADERS });

  if (!response.ok) {
    throw new Error(`Failed to fetch NSE CSV (${response.status}): ${url}`);
  }

  return {
    url, date,
    response: response.text(),
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
