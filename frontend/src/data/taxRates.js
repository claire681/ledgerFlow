export const TAX_RATES = {

  // ── NORTH AMERICA ─────────────────────────────────────────
  US: {
    name:         'United States',
    currency:     'USD',
    corporateTax: 0.21,
    salesTax:     0.0,
    hasState:     true,
    note:         'Federal corporate tax is 21%. State taxes apply additionally.',
    states: {
      AL: { name: 'Alabama',              extraTax: 0.065,  salesTax: 0.04   },
      AK: { name: 'Alaska',               extraTax: 0.0,    salesTax: 0.0    },
      AZ: { name: 'Arizona',              extraTax: 0.049,  salesTax: 0.056  },
      AR: { name: 'Arkansas',             extraTax: 0.054,  salesTax: 0.065  },
      CA: { name: 'California',           extraTax: 0.0884, salesTax: 0.0725 },
      CO: { name: 'Colorado',             extraTax: 0.044,  salesTax: 0.029  },
      CT: { name: 'Connecticut',          extraTax: 0.075,  salesTax: 0.0635 },
      DE: { name: 'Delaware',             extraTax: 0.085,  salesTax: 0.0    },
      FL: { name: 'Florida',              extraTax: 0.055,  salesTax: 0.06   },
      GA: { name: 'Georgia',              extraTax: 0.055,  salesTax: 0.04   },
      HI: { name: 'Hawaii',               extraTax: 0.044,  salesTax: 0.04   },
      ID: { name: 'Idaho',                extraTax: 0.058,  salesTax: 0.06   },
      IL: { name: 'Illinois',             extraTax: 0.095,  salesTax: 0.0625 },
      IN: { name: 'Indiana',              extraTax: 0.049,  salesTax: 0.07   },
      IA: { name: 'Iowa',                 extraTax: 0.055,  salesTax: 0.06   },
      KS: { name: 'Kansas',               extraTax: 0.04,   salesTax: 0.065  },
      KY: { name: 'Kentucky',             extraTax: 0.05,   salesTax: 0.06   },
      LA: { name: 'Louisiana',            extraTax: 0.075,  salesTax: 0.0445 },
      ME: { name: 'Maine',                extraTax: 0.084,  salesTax: 0.055  },
      MD: { name: 'Maryland',             extraTax: 0.085,  salesTax: 0.06   },
      MA: { name: 'Massachusetts',        extraTax: 0.08,   salesTax: 0.0625 },
      MI: { name: 'Michigan',             extraTax: 0.06,   salesTax: 0.06   },
      MN: { name: 'Minnesota',            extraTax: 0.098,  salesTax: 0.06875},
      MS: { name: 'Mississippi',          extraTax: 0.05,   salesTax: 0.07   },
      MO: { name: 'Missouri',             extraTax: 0.04,   salesTax: 0.04225},
      MT: { name: 'Montana',              extraTax: 0.065,  salesTax: 0.0    },
      NE: { name: 'Nebraska',             extraTax: 0.058,  salesTax: 0.055  },
      NV: { name: 'Nevada',               extraTax: 0.0,    salesTax: 0.0685 },
      NH: { name: 'New Hampshire',        extraTax: 0.075,  salesTax: 0.0    },
      NJ: { name: 'New Jersey',           extraTax: 0.09,   salesTax: 0.06625},
      NM: { name: 'New Mexico',           extraTax: 0.059,  salesTax: 0.05125},
      NY: { name: 'New York',             extraTax: 0.065,  salesTax: 0.04   },
      NC: { name: 'North Carolina',       extraTax: 0.025,  salesTax: 0.0475 },
      ND: { name: 'North Dakota',         extraTax: 0.0141, salesTax: 0.05   },
      OH: { name: 'Ohio',                 extraTax: 0.0,    salesTax: 0.0575 },
      OK: { name: 'Oklahoma',             extraTax: 0.04,   salesTax: 0.045  },
      OR: { name: 'Oregon',               extraTax: 0.076,  salesTax: 0.0    },
      PA: { name: 'Pennsylvania',         extraTax: 0.0899, salesTax: 0.06   },
      RI: { name: 'Rhode Island',         extraTax: 0.07,   salesTax: 0.07   },
      SC: { name: 'South Carolina',       extraTax: 0.05,   salesTax: 0.06   },
      SD: { name: 'South Dakota',         extraTax: 0.0,    salesTax: 0.045  },
      TN: { name: 'Tennessee',            extraTax: 0.065,  salesTax: 0.07   },
      TX: { name: 'Texas',                extraTax: 0.0,    salesTax: 0.0625 },
      UT: { name: 'Utah',                 extraTax: 0.048,  salesTax: 0.0485 },
      VT: { name: 'Vermont',              extraTax: 0.085,  salesTax: 0.06   },
      VA: { name: 'Virginia',             extraTax: 0.06,   salesTax: 0.053  },
      WA: { name: 'Washington',           extraTax: 0.0,    salesTax: 0.065  },
      WV: { name: 'West Virginia',        extraTax: 0.065,  salesTax: 0.06   },
      WI: { name: 'Wisconsin',            extraTax: 0.079,  salesTax: 0.05   },
      WY: { name: 'Wyoming',              extraTax: 0.0,    salesTax: 0.04   },
      DC: { name: 'Washington D.C.',      extraTax: 0.0825, salesTax: 0.06   },
    },
  },

  CA: {
    name:         'Canada',
    currency:     'CAD',
    corporateTax: 0.15,
    salesTax:     0.05,
    hasState:     true,
    note:         'Federal corporate tax is 15%. Province tax applies additionally. GST is 5% federal.',
    states: {
      AB: { name: 'Alberta',               extraTax: 0.08,  salesTax: 0.05  },
      BC: { name: 'British Columbia',      extraTax: 0.12,  salesTax: 0.12  },
      MB: { name: 'Manitoba',              extraTax: 0.12,  salesTax: 0.12  },
      NB: { name: 'New Brunswick',         extraTax: 0.14,  salesTax: 0.15  },
      NL: { name: 'Newfoundland',          extraTax: 0.15,  salesTax: 0.15  },
      NS: { name: 'Nova Scotia',           extraTax: 0.14,  salesTax: 0.15  },
      NT: { name: 'Northwest Territories', extraTax: 0.119, salesTax: 0.05  },
      NU: { name: 'Nunavut',               extraTax: 0.12,  salesTax: 0.05  },
      ON: { name: 'Ontario',               extraTax: 0.115, salesTax: 0.13  },
      PE: { name: 'Prince Edward Island',  extraTax: 0.16,  salesTax: 0.15  },
      QC: { name: 'Quebec',                extraTax: 0.1175,salesTax: 0.14975},
      SK: { name: 'Saskatchewan',          extraTax: 0.12,  salesTax: 0.11  },
      YT: { name: 'Yukon',                 extraTax: 0.09,  salesTax: 0.05  },
    },
  },

  MX: {
    name:         'Mexico',
    currency:     'MXN',
    corporateTax: 0.30,
    salesTax:     0.16,
    hasState:     false,
    note:         'Flat 30% corporate tax rate. 16% VAT applies nationally.',
  },

  // ── EUROPE ────────────────────────────────────────────────
  GB: {
    name:         'United Kingdom',
    currency:     'GBP',
    corporateTax: 0.25,
    salesTax:     0.20,
    hasState:     false,
    note:         'Flat 25% corporate tax for profits over £250,000. 20% VAT.',
  },

  DE: {
    name:         'Germany',
    currency:     'EUR',
    corporateTax: 0.30,
    salesTax:     0.19,
    hasState:     false,
    note:         'Effective rate ~30% includes 15% federal corporate tax plus ~15% trade tax (Gewerbesteuer) which varies slightly by municipality.',
  },

  FR: {
    name:         'France',
    currency:     'EUR',
    corporateTax: 0.25,
    salesTax:     0.20,
    hasState:     false,
    note:         'Flat 25% corporate tax rate. 20% standard VAT rate.',
  },

  NL: {
    name:         'Netherlands',
    currency:     'EUR',
    corporateTax: 0.258,
    salesTax:     0.21,
    hasState:     false,
    note:         '19% on first €200,000 profit, 25.8% above that. 21% VAT.',
  },

  IT: {
    name:         'Italy',
    currency:     'EUR',
    corporateTax: 0.24,
    salesTax:     0.22,
    hasState:     false,
    note:         '24% corporate tax (IRES) plus 3.9% regional tax (IRAP). 22% VAT.',
  },

  ES: {
    name:         'Spain',
    currency:     'EUR',
    corporateTax: 0.25,
    salesTax:     0.21,
    hasState:     false,
    note:         'Flat 25% corporate tax. 21% standard VAT.',
  },

  PT: {
    name:         'Portugal',
    currency:     'EUR',
    corporateTax: 0.21,
    salesTax:     0.23,
    hasState:     false,
    note:         '21% corporate tax plus municipal surcharge up to 1.5%. 23% VAT.',
  },

  BE: {
    name:         'Belgium',
    currency:     'EUR',
    corporateTax: 0.25,
    salesTax:     0.21,
    hasState:     false,
    note:         'Flat 25% corporate tax. 21% VAT.',
  },

  SE: {
    name:         'Sweden',
    currency:     'SEK',
    corporateTax: 0.206,
    salesTax:     0.25,
    hasState:     false,
    note:         '20.6% corporate tax. 25% standard VAT.',
  },

  NO: {
    name:         'Norway',
    currency:     'NOK',
    corporateTax: 0.22,
    salesTax:     0.25,
    hasState:     false,
    note:         '22% corporate tax. 25% VAT.',
  },

  DK: {
    name:         'Denmark',
    currency:     'DKK',
    corporateTax: 0.22,
    salesTax:     0.25,
    hasState:     false,
    note:         '22% corporate tax. 25% VAT.',
  },

  FI: {
    name:         'Finland',
    currency:     'EUR',
    corporateTax: 0.20,
    salesTax:     0.24,
    hasState:     false,
    note:         '20% corporate tax. 24% VAT.',
  },

  CH: {
    name:         'Switzerland',
    currency:     'CHF',
    corporateTax: 0.085,
    salesTax:     0.077,
    hasState:     false,
    note:         'Federal rate 8.5%. Effective rate ~14-20% including cantonal taxes. 7.7% VAT.',
  },

  IE: {
    name:         'Ireland',
    currency:     'EUR',
    corporateTax: 0.125,
    salesTax:     0.23,
    hasState:     false,
    note:         '12.5% corporate tax on trading income — one of the lowest in Europe. 23% VAT.',
  },

  PL: {
    name:         'Poland',
    currency:     'PLN',
    corporateTax: 0.19,
    salesTax:     0.23,
    hasState:     false,
    note:         '19% corporate tax. 9% for small taxpayers. 23% VAT.',
  },

  CZ: {
    name:         'Czech Republic',
    currency:     'CZK',
    corporateTax: 0.19,
    salesTax:     0.21,
    hasState:     false,
    note:         '19% corporate tax. 21% VAT.',
  },

  AT: {
    name:         'Austria',
    currency:     'EUR',
    corporateTax: 0.24,
    salesTax:     0.20,
    hasState:     false,
    note:         '24% corporate tax (reduced from 25% in 2023). 20% VAT.',
  },

  GR: {
    name:         'Greece',
    currency:     'EUR',
    corporateTax: 0.22,
    salesTax:     0.24,
    hasState:     false,
    note:         '22% corporate tax. 24% VAT.',
  },

  HU: {
    name:         'Hungary',
    currency:     'HUF',
    corporateTax: 0.09,
    salesTax:     0.27,
    hasState:     false,
    note:         '9% corporate tax — lowest in EU. 27% VAT — highest in EU.',
  },

  RO: {
    name:         'Romania',
    currency:     'RON',
    corporateTax: 0.16,
    salesTax:     0.19,
    hasState:     false,
    note:         '16% corporate tax. 19% VAT.',
  },

  UA: {
    name:         'Ukraine',
    currency:     'UAH',
    corporateTax: 0.18,
    salesTax:     0.20,
    hasState:     false,
    note:         '18% corporate tax. 20% VAT.',
  },

  LU: {
    name:         'Luxembourg',
    currency:     'EUR',
    corporateTax: 0.17,
    salesTax:     0.17,
    hasState:     false,
    note:         '17% corporate tax. 17% VAT — lowest standard VAT in EU.',
  },

  // ── MIDDLE EAST ───────────────────────────────────────────
  AE: {
    name:         'United Arab Emirates',
    currency:     'AED',
    corporateTax: 0.09,
    salesTax:     0.05,
    hasState:     false,
    note:         '9% corporate tax introduced June 2023. 5% VAT.',
  },

  SA: {
    name:         'Saudi Arabia',
    currency:     'SAR',
    corporateTax: 0.20,
    salesTax:     0.15,
    hasState:     false,
    note:         '20% corporate tax for foreign companies. 15% VAT.',
  },

  IL: {
    name:         'Israel',
    currency:     'ILS',
    corporateTax: 0.23,
    salesTax:     0.17,
    hasState:     false,
    note:         '23% corporate tax. 17% VAT.',
  },

  TR: {
    name:         'Turkey',
    currency:     'TRY',
    corporateTax: 0.25,
    salesTax:     0.18,
    hasState:     false,
    note:         '25% corporate tax. 18% VAT.',
  },

  // ── AFRICA ────────────────────────────────────────────────
  NG: {
    name:         'Nigeria',
    currency:     'NGN',
    corporateTax: 0.30,
    salesTax:     0.075,
    hasState:     false,
    note:         '30% corporate tax for large companies. 0% for small companies under ₦25M turnover. 7.5% VAT.',
  },

  ZA: {
    name:         'South Africa',
    currency:     'ZAR',
    corporateTax: 0.27,
    salesTax:     0.15,
    hasState:     false,
    note:         '27% corporate tax (reduced from 28% in 2022). 15% VAT.',
  },

  KE: {
    name:         'Kenya',
    currency:     'KES',
    corporateTax: 0.30,
    salesTax:     0.16,
    hasState:     false,
    note:         '30% corporate tax for resident companies. 16% VAT.',
  },

  GH: {
    name:         'Ghana',
    currency:     'GHS',
    corporateTax: 0.25,
    salesTax:     0.125,
    hasState:     false,
    note:         '25% corporate tax. 12.5% VAT.',
  },

  EG: {
    name:         'Egypt',
    currency:     'EGP',
    corporateTax: 0.225,
    salesTax:     0.14,
    hasState:     false,
    note:         '22.5% corporate tax. 14% VAT.',
  },

  ET: {
    name:         'Ethiopia',
    currency:     'ETB',
    corporateTax: 0.30,
    salesTax:     0.15,
    hasState:     false,
    note:         '30% corporate tax. 15% VAT.',
  },

  TZ: {
    name:         'Tanzania',
    currency:     'TZS',
    corporateTax: 0.30,
    salesTax:     0.18,
    hasState:     false,
    note:         '30% corporate tax. 18% VAT.',
  },

  UG: {
    name:         'Uganda',
    currency:     'UGX',
    corporateTax: 0.30,
    salesTax:     0.18,
    hasState:     false,
    note:         '30% corporate tax. 18% VAT.',
  },

  MA: {
    name:         'Morocco',
    currency:     'MAD',
    corporateTax: 0.31,
    salesTax:     0.20,
    hasState:     false,
    note:         '31% corporate tax for profits over MAD 1M. 20% VAT.',
  },

  // ── ASIA PACIFIC ──────────────────────────────────────────
  AU: {
    name:         'Australia',
    currency:     'AUD',
    corporateTax: 0.30,
    salesTax:     0.10,
    hasState:     false,
    note:         '30% corporate tax. 25% for small businesses under AUD 50M turnover. 10% GST is federal — no state differences for corporate tax.',
  },

  NZ: {
    name:         'New Zealand',
    currency:     'NZD',
    corporateTax: 0.28,
    salesTax:     0.15,
    hasState:     false,
    note:         '28% corporate tax. 15% GST.',
  },

  JP: {
    name:         'Japan',
    currency:     'JPY',
    corporateTax: 0.2759,
    salesTax:     0.10,
    hasState:     false,
    note:         'Effective corporate tax ~27.6% including national, local, and enterprise taxes. 10% consumption tax.',
  },

  CN: {
    name:         'China',
    currency:     'CNY',
    corporateTax: 0.25,
    salesTax:     0.13,
    hasState:     false,
    note:         '25% corporate tax. 15% for high-tech enterprises. 13% VAT standard rate.',
  },

  IN: {
    name:         'India',
    currency:     'INR',
    corporateTax: 0.25,
    salesTax:     0.18,
    hasState:     false,
    note:         '25% for domestic companies with turnover under ₹400 crore. 18% GST standard rate.',
  },

  SG: {
    name:         'Singapore',
    currency:     'SGD',
    corporateTax: 0.17,
    salesTax:     0.09,
    hasState:     false,
    note:         '17% corporate tax. 9% GST (increased from 8% in 2024).',
  },

  MY: {
    name:         'Malaysia',
    currency:     'MYR',
    corporateTax: 0.24,
    salesTax:     0.06,
    hasState:     false,
    note:         '24% corporate tax. 6% service tax.',
  },

  ID: {
    name:         'Indonesia',
    currency:     'IDR',
    corporateTax: 0.22,
    salesTax:     0.11,
    hasState:     false,
    note:         '22% corporate tax. 11% VAT (increased from 10% in 2022).',
  },

  TH: {
    name:         'Thailand',
    currency:     'THB',
    corporateTax: 0.20,
    salesTax:     0.07,
    hasState:     false,
    note:         '20% corporate tax. 7% VAT (temporarily reduced from 10%).',
  },

  PH: {
    name:         'Philippines',
    currency:     'PHP',
    corporateTax: 0.25,
    salesTax:     0.12,
    hasState:     false,
    note:         '25% corporate tax. 20% for domestic corporations with net income over PHP 5M. 12% VAT.',
  },

  PK: {
    name:         'Pakistan',
    currency:     'PKR',
    corporateTax: 0.29,
    salesTax:     0.17,
    hasState:     false,
    note:         '29% corporate tax for banking companies. 17% sales tax.',
  },

  VN: {
    name:         'Vietnam',
    currency:     'VND',
    corporateTax: 0.20,
    salesTax:     0.10,
    hasState:     false,
    note:         '20% standard corporate tax. 10% VAT standard rate.',
  },

  BD: {
    name:         'Bangladesh',
    currency:     'BDT',
    corporateTax: 0.275,
    salesTax:     0.15,
    hasState:     false,
    note:         '27.5% corporate tax for listed companies. 15% VAT.',
  },

  KR: {
    name:         'South Korea',
    currency:     'KRW',
    corporateTax: 0.22,
    salesTax:     0.10,
    hasState:     false,
    note:         '22% corporate tax on income over KRW 20B. 10% VAT.',
  },

  // ── LATIN AMERICA ─────────────────────────────────────────
  BR: {
    name:         'Brazil',
    currency:     'BRL',
    corporateTax: 0.34,
    salesTax:     0.17,
    hasState:     false,
    note:         '34% effective rate includes 15% IRPJ, 10% surtax, and 9% CSLL. 17% ICMS average.',
  },

  AR: {
    name:         'Argentina',
    currency:     'ARS',
    corporateTax: 0.35,
    salesTax:     0.21,
    hasState:     false,
    note:         '35% corporate tax. 21% VAT.',
  },

  CL: {
    name:         'Chile',
    currency:     'CLP',
    corporateTax: 0.27,
    salesTax:     0.19,
    hasState:     false,
    note:         '27% corporate tax for large companies. 19% VAT.',
  },

  CO: {
    name:         'Colombia',
    currency:     'COP',
    corporateTax: 0.35,
    salesTax:     0.19,
    hasState:     false,
    note:         '35% corporate tax. 19% VAT.',
  },
};