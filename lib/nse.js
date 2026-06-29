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

export function buildNseCsvUrl(date, useCase) {
  debugger;
  const customDateForUrl = dayjs(date, "DD-MM-YYYY").format("DDMMYYYY");
  if (customDateForUrl == "Invalid Date") {
    throw new Error(`${date} is invalid`)
  }
  if (!useCase) {
    throw new Error('useCase is required');
  }
  let url;
  if (useCase === "SEED") {
    url = process.env.PRICEBANDS_SEED_LIST_CSV_BASE_URL;
  } else if (useCase === "UPDATE") {
    debugger;
    url = process.env.PRICEBANDS_UPDATE_LIST_CSV_BASE_URL;
  }
  if (!url) {
    throw new Error('url is required for buildNseCsvUrl')
  }
  return `${url}_${customDateForUrl}.csv`;
}

export async function fetchListCsv(date, useCase) {
  const url = buildNseCsvUrl(date, useCase);
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

export function parseSeedListCsv(csvText) {
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

export function parseUpdateListCsv(csvText) {
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
      const from = row.From?.trim();
      const to = row.To?.trim();

      if (!symbol || !series) {
        return null;
      }

      return { symbol, series, from, to };
    })
    .filter((row) => row !== null);
}

export function buildRedisKey(symbol, series) {
  return `${symbol}<>${series}`;
}

export function getRedisKeyForLastSync(date) {
  return `PRICEBANDS<>DATASYNC`;
}

export function getRedisKeyForLastUpdate(date) {
  return `PRICEBANDS<>DATAUPDATE`;
}
