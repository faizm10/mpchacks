const fs = require('fs');

const MERCHANT_GEOCODES = {
  'WSDOT COMMERCIAL VEHIC|WA':   { lat: 47.00,  lng: -122.90 },
  'AB TRANSP 403-340-5075|AB':   { lat: 53.54,  lng: -113.49 },
  'MNA*MICHELIN CANADA|QC':      { lat: 45.56,  lng: -73.74  },
  'OKC SIZE & WEIGHTS PER|OK':   { lat: 35.47,  lng: -97.52  },
  "TOOT'N TOTUM #100 -|TX":      { lat: 36.04,  lng: -100.80 },
  'COFFEE CUP #8|SD':            { lat: 43.95,  lng: -100.30 },
  'TXDMV OS PERMIT TPE|TX':      { lat: 30.27,  lng: -97.74  },
  'SD DEPT OF TRANS OPS|SD':     { lat: 44.37,  lng: -100.35 },
  'CENEX-FUOC OF CARPIO|ND':     { lat: 48.45,  lng: -101.71 },
  'NDHP-E PERMIT|ND':            { lat: 46.81,  lng: -100.78 },
  'PZG**MT DEPT TRANSPORT|MT':   { lat: 46.60,  lng: -112.02 },
  'FLYING J 550|ND':             { lat: 48.23,  lng: -101.29 },
  'FLYING J 725|TX':             { lat: 29.74,  lng: -94.97  },
  'PETRO #339 SPOKANE|WA':       { lat: 47.67,  lng: -117.41 },
  'VCN*KANSASMVPERMIT|KS':       { lat: 39.05,  lng: -95.69  },
  "LOVE'S #0448 INSIDE|WA":      { lat: 47.25,  lng: -122.44 },
  "LOVE'S #0687 INSIDE|IL":      { lat: 39.63,  lng: -90.21  },
  "LOVE'S #0789 INSIDE|MT":      { lat: 47.50,  lng: -111.30 },
  "LOVE'S #0337 INSIDE|MN":      { lat: 43.65,  lng: -93.37  },
  "LOVE'S #0655 INSIDE|KS":      { lat: 38.47,  lng: -100.90 },
  "LOVE'S #0772 INSIDE|NY":      { lat: 42.34,  lng: -77.32  },
  'PILOT 1025|TX':               { lat: 29.77,  lng: -95.22  },
  'PILOT 1103|WA':               { lat: 48.16,  lng: -122.19 },
  'PILOT 917|MT':                { lat: 47.50,  lng: -111.30 },
  'TDOT OSOW PERMITS|TN':        { lat: 36.17,  lng: -86.78  },
  'PHILLIPS 66 - VALENTIN|NE':   { lat: 42.88,  lng: -100.55 },
  'ILLINOIS DEPARTMENT OF|IL':   { lat: 39.80,  lng: -89.65  },
  'IOWA 80 TRUCKSTOP|IA':        { lat: 41.61,  lng: -90.76  },
  'IOWA 80 TRUCKSTOP FU|IA':     { lat: 41.61,  lng: -90.76  },
  'KWIK TRIP #234|WI':           { lat: 43.82,  lng: -91.24  },
  'MCSD OSOW|IN':                { lat: 39.79,  lng: -86.15  },
  'VCN*IDAHODOT|ID':             { lat: 43.62,  lng: -116.20 },
  'BC PERMIT CENTRE|BC':         { lat: 48.43,  lng: -123.37 },
  'MI SUPERLOAD|MB':             { lat: 49.90,  lng: -97.14  },
  'AB TRANSP 403-340-5075|AB':   { lat: 53.54,  lng: -113.49 },
  'PROVINCIAL PERMIT CENT|BC':   { lat: 55.76,  lng: -120.24 },
  'IA DOT MOTOR CARRIER S|IA':   { lat: 41.73,  lng: -93.61  },
  'MNDOT OSOW PERMITS|MN':       { lat: 44.95,  lng: -93.10  },
  'CASEYS #3364|ND':             { lat: 47.45,  lng: -99.13  },
  'MARATHON 272195|SD':          { lat: 44.90,  lng: -97.11  },
  'TOOT\'N TOTUM #100 -|TX':     { lat: 36.04,  lng: -100.80 },
};

const STATE_CENTROIDS = {
  'AB': { lat: 53.93, lng: -116.58 }, 'BC': { lat: 53.73, lng: -127.65 },
  'ON': { lat: 51.25, lng: -85.32  }, 'MB': { lat: 53.76, lng: -98.81  },
  'SK': { lat: 52.94, lng: -106.45 }, 'QC': { lat: 52.94, lng: -73.55  },
  'NB': { lat: 46.56, lng: -66.46  }, 'NS': { lat: 44.68, lng: -63.74  },
  'YT': { lat: 64.28, lng: -135.00 },
  'TX': { lat: 31.97, lng: -99.90  }, 'ND': { lat: 47.55, lng: -101.00 },
  'SD': { lat: 44.37, lng: -100.35 }, 'WA': { lat: 47.40, lng: -120.50 },
  'MT': { lat: 46.88, lng: -110.36 }, 'KS': { lat: 38.53, lng: -96.73  },
  'MN': { lat: 46.73, lng: -94.68  }, 'IA': { lat: 42.07, lng: -93.50  },
  'IL': { lat: 40.63, lng: -89.40  }, 'IN': { lat: 40.27, lng: -86.13  },
  'KY': { lat: 37.67, lng: -84.67  }, 'TN': { lat: 35.86, lng: -86.66  },
  'NE': { lat: 41.49, lng: -99.90  }, 'CO': { lat: 39.55, lng: -105.78 },
  'WY': { lat: 42.75, lng: -107.30 }, 'ID': { lat: 44.07, lng: -114.74 },
  'OR': { lat: 44.57, lng: -122.07 }, 'CA': { lat: 36.78, lng: -119.42 },
  'NV': { lat: 38.80, lng: -116.42 }, 'UT': { lat: 39.32, lng: -111.09 },
  'AZ': { lat: 34.05, lng: -111.09 }, 'NM': { lat: 34.52, lng: -105.87 },
  'OK': { lat: 35.47, lng: -97.52  }, 'MO': { lat: 38.46, lng: -92.29  },
  'WI': { lat: 44.27, lng: -89.62  }, 'MI': { lat: 44.31, lng: -85.60  },
  'OH': { lat: 40.39, lng: -82.76  }, 'VA': { lat: 37.43, lng: -78.66  },
  'NC': { lat: 35.63, lng: -79.81  }, 'SC': { lat: 33.84, lng: -80.94  },
  'GA': { lat: 32.16, lng: -82.90  }, 'FL': { lat: 27.77, lng: -81.69  },
  'AL': { lat: 32.32, lng: -86.90  }, 'MS': { lat: 32.74, lng: -89.68  },
  'LA': { lat: 31.17, lng: -91.87  }, 'AR': { lat: 34.97, lng: -92.37  },
  'PA': { lat: 41.20, lng: -77.19  }, 'NY': { lat: 42.97, lng: -75.52  },
  'MD': { lat: 39.05, lng: -76.64  }, 'WV': { lat: 38.49, lng: -80.95  },
  'AK': { lat: 64.20, lng: -153.39 }, 'MA': { lat: 42.23, lng: -71.53  },
  'CT': { lat: 41.60, lng: -72.69  }, 'NJ': { lat: 40.06, lng: -74.41  },
  'DC': { lat: 38.91, lng: -77.02  }, 'NH': { lat: 43.45, lng: -71.56  },
  'ME': { lat: 45.25, lng: -69.44  },
};

const transactions = JSON.parse(fs.readFileSync('./output/transactions.json'));

transactions.forEach(t => {
  const key = `${t.merchant}|${t.state}`;
  if (MERCHANT_GEOCODES[key]) {
    t.lat = MERCHANT_GEOCODES[key].lat;
    t.lng = MERCHANT_GEOCODES[key].lng;
  } else if (STATE_CENTROIDS[t.state]) {
    t.lat = STATE_CENTROIDS[t.state].lat;
    t.lng = STATE_CENTROIDS[t.state].lng;
  } else {
    t.lat = 49.0;
    t.lng = -98.0;
  }
});

fs.writeFileSync('./output/transactions.json', JSON.stringify(transactions, null, 2));
console.log('Geocoding complete');
