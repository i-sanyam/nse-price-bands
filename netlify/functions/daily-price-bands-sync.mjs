import syncPriceBands from './sync-nse-pricebands-list.mjs'

export default async function handler() {
    return syncPriceBands();
}

export const config = {
    schedule: "30 3 * * 1-5",
}