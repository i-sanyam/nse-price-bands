import seedPriceBands from './seed-price-bands.mjs'

export default async function handler() {
    return seedPriceBands();
}

export const config = {
    schedule: "30 3 * * 1-5",
}