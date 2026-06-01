/** Approximate centroids for North American states / provinces (lng, lat). */

export const US_STATE: Record<string, [number, number]> = {
  AL: [-86.9023, 32.8067],
  AK: [-152.4044, 61.3707],
  AZ: [-111.4312, 33.7298],
  AR: [-92.3731, 34.9697],
  CA: [-119.6816, 36.1162],
  CO: [-105.3111, 39.0598],
  CT: [-72.7554, 41.5978],
  DE: [-75.5071, 39.3185],
  FL: [-81.5158, 27.7663],
  GA: [-83.6431, 33.0406],
  HI: [-157.4983, 21.0943],
  ID: [-114.4788, 44.2405],
  IL: [-89.3985, 40.3495],
  IN: [-86.2816, 39.8494],
  IA: [-93.2105, 42.0115],
  KS: [-98.4842, 38.5266],
  KY: [-84.6701, 37.6681],
  LA: [-91.8749, 31.1695],
  ME: [-69.3819, 44.6939],
  MD: [-76.8021, 39.0639],
  MA: [-71.5301, 42.2302],
  MI: [-84.5467, 43.3266],
  MN: [-94.6859, 46.7296],
  MS: [-89.6678, 32.7416],
  MO: [-92.1893, 38.4561],
  MT: [-110.4544, 46.9219],
  NE: [-99.9018, 41.1254],
  NV: [-117.0554, 38.3135],
  NH: [-71.5653, 43.4525],
  NJ: [-74.521, 40.2989],
  NM: [-106.2485, 34.8405],
  NY: [-74.9481, 42.1657],
  NC: [-79.8064, 35.6301],
  ND: [-99.784, 47.5289],
  OH: [-82.7649, 40.3888],
  OK: [-97.5349, 35.5653],
  OR: [-122.0709, 44.572],
  PA: [-77.2098, 40.5908],
  RI: [-71.5118, 41.6809],
  SC: [-80.945, 33.8569],
  SD: [-99.9018, 44.2998],
  TN: [-86.6923, 35.7478],
  TX: [-97.5635, 31.0545],
  UT: [-111.891, 40.1503],
  VT: [-72.7107, 44.0459],
  VA: [-78.1694, 37.7693],
  WA: [-121.4905, 47.4009],
  WV: [-80.9696, 38.4912],
  WI: [-89.6165, 44.2685],
  WY: [-107.3025, 42.7559],
  DC: [-77.0369, 38.9072],
};

export const CA_PROVINCE: Record<string, [number, number]> = {
  AB: [-114.0719, 53.9333],
  BC: [-123.3656, 49.2827],
  MB: [-97.1384, 49.8951],
  NB: [-66.6431, 45.9636],
  NL: [-52.7126, 47.5615],
  NS: [-63.5752, 44.6486],
  NT: [-114.3718, 62.454],
  NU: [-85.9212, 64.2823],
  ON: [-79.3832, 43.6532],
  PE: [-63.1311, 46.2382],
  QC: [-71.208, 46.8139],
  SK: [-106.6702, 52.1332],
  YT: [-135.0568, 60.7212],
};

function hashJitter(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const a = ((h & 0xffff) / 0xffff - 0.5) * 1.8;
  const b = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 1.2;
  return [a, b];
}

export type GeoPoint = {
  lng: number;
  lat: number;
  region: string;
};

/** Resolve lng/lat for a transaction location in North America. */
export function geocodeLocation(
  city: string,
  state: string,
  country: string,
): GeoPoint | null {
  const region = (state || "").trim().toUpperCase();
  const c = (country || "").trim().toUpperCase();

  let base: [number, number] | undefined;
  if (c === "USA" || c === "US") {
    base = US_STATE[region];
  } else if (c === "CAN" || c === "CA") {
    base = CA_PROVINCE[region];
  }

  if (!base) return null;

  const [jx, jy] = hashJitter(`${city}|${region}|${c}`);
  return {
    lng: base[0] + jx,
    lat: base[1] + jy,
    region,
  };
}

export const NORTH_AMERICA_BOUNDS = {
  minLng: -130,
  maxLng: -60,
  minLat: 24,
  maxLat: 55,
};

export function inNorthAmerica(lng: number, lat: number): boolean {
  return (
    lng >= NORTH_AMERICA_BOUNDS.minLng &&
    lng <= NORTH_AMERICA_BOUNDS.maxLng &&
    lat >= NORTH_AMERICA_BOUNDS.minLat &&
    lat <= NORTH_AMERICA_BOUNDS.maxLat
  );
}
