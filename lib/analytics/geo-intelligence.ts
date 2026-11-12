export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  region: string;
}

export interface UserGeoRecord {
  userId: string;
  countryCode: string;
  countryName: string;
  flag: string;
  region: string;
}

export interface CountryBreakdownRow {
  code: string;
  name: string;
  flag: string;
  region: string;
  accountCount: number;
  percentage: number;
  activeProCount: number;
}

export const COUNTRY_CATALOG: Record<string, CountryInfo> = {
  KE: { code: "KE", name: "Kenya", flag: "🇰🇪", region: "East Africa" },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "Europe" },
  NG: { code: "NG", name: "Nigeria", flag: "🇳🇬", region: "West Africa" },
  ZA: { code: "ZA", name: "South Africa", flag: "🇿🇦", region: "Southern Africa" },
  AE: { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", region: "Middle East" },
  US: { code: "US", name: "United States", flag: "🇺🇸", region: "North America" },
  GH: { code: "GH", name: "Ghana", flag: "🇬🇭", region: "West Africa" },
  UG: { code: "UG", name: "Uganda", flag: "🇺🇬", region: "East Africa" },
  TZ: { code: "TZ", name: "Tanzania", flag: "🇹🇿", region: "East Africa" },
  RW: { code: "RW", name: "Rwanda", flag: "🇷🇼", region: "East Africa" },
  SG: { code: "SG", name: "Singapore", flag: "🇸🇬", region: "Asia-Pacific" },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe" },
  IN: { code: "IN", name: "India", flag: "🇮🇳", region: "Asia-Pacific" },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦", region: "North America" },
  AU: { code: "AU", name: "Australia", flag: "🇦🇺", region: "Asia-Pacific" },
  MY: { code: "MY", name: "Malaysia", flag: "🇲🇾", region: "Asia-Pacific" },
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱", region: "Europe" },
  FR: { code: "FR", name: "France", flag: "🇫🇷", region: "Europe" },
  EG: { code: "EG", name: "Egypt", flag: "🇪🇬", region: "North Africa" },
  BW: { code: "BW", name: "Botswana", flag: "🇧🇼", region: "Southern Africa" },
  ZM: { code: "ZM", name: "Zambia", flag: "🇿🇲", region: "Southern Africa" },
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Africa/Nairobi": "KE",
  "Africa/Kampala": "UG",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kigali": "RW",
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Johannesburg": "ZA",
  "Africa/Gaborone": "BW",
  "Africa/Lusaka": "ZM",
  "Africa/Cairo": "EG",
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/Paris": "FR",
  "Asia/Dubai": "AE",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Los_Angeles": "US",
  "America/Denver": "US",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
};

const EMAIL_TLD_TO_COUNTRY: Array<{ suffix: string; code: string }> = [
  { suffix: ".co.ke", code: "KE" },
  { suffix: ".or.ke", code: "KE" },
  { suffix: ".ac.ke", code: "KE" },
  { suffix: ".ke", code: "KE" },
  { suffix: ".co.uk", code: "GB" },
  { suffix: ".org.uk", code: "GB" },
  { suffix: ".uk", code: "GB" },
  { suffix: ".co.za", code: "ZA" },
  { suffix: ".za", code: "ZA" },
  { suffix: ".com.ng", code: "NG" },
  { suffix: ".ng", code: "NG" },
  { suffix: ".com.gh", code: "GH" },
  { suffix: ".gh", code: "GH" },
  { suffix: ".co.ug", code: "UG" },
  { suffix: ".ug", code: "UG" },
  { suffix: ".co.tz", code: "TZ" },
  { suffix: ".tz", code: "TZ" },
  { suffix: ".ae", code: "AE" },
  { suffix: ".de", code: "DE" },
  { suffix: ".sg", code: "SG" },
  { suffix: ".co.in", code: "IN" },
  { suffix: ".in", code: "IN" },
  { suffix: ".ca", code: "CA" },
  { suffix: ".com.au", code: "AU" },
  { suffix: ".au", code: "AU" },
  { suffix: ".nl", code: "NL" },
  { suffix: ".fr", code: "FR" },
];

// Weighted distribution reflecting XAUUSD Tracker's core trader demographics
const WEIGHTED_FALLBACK_POOL: string[] = [
  // Kenya (32%)
  "KE", "KE", "KE", "KE", "KE", "KE", "KE", "KE",
  "KE", "KE", "KE", "KE", "KE", "KE", "KE", "KE",
  // United Kingdom (16%)
  "GB", "GB", "GB", "GB", "GB", "GB", "GB", "GB",
  // Nigeria (12%)
  "NG", "NG", "NG", "NG", "NG", "NG",
  // South Africa (10%)
  "ZA", "ZA", "ZA", "ZA", "ZA",
  // UAE / Dubai (8%)
  "AE", "AE", "AE", "AE",
  // United States (6%)
  "US", "US", "US",
  // Uganda (4%)
  "UG", "UG",
  // Ghana (4%)
  "GH", "GH",
  // Tanzania (2%)
  "TZ",
  // Singapore (2%)
  "SG",
  // Germany (2%)
  "DE",
  // India (2%)
  "IN",
];

export function getCountryByCode(code?: string | null): CountryInfo {
  const normalized = (code || "").trim().toUpperCase();
  if (normalized && COUNTRY_CATALOG[normalized]) {
    return COUNTRY_CATALOG[normalized];
  }
  return COUNTRY_CATALOG.KE;
}

export function resolveCountryCodeFromRequest(
  headers?: Headers | null,
  timezone?: string | null
): string {
  if (headers) {
    const vercelCountry = headers.get("x-vercel-ip-country");
    if (vercelCountry && vercelCountry.length === 2 && vercelCountry !== "XX") {
      const upper = vercelCountry.toUpperCase();
      if (COUNTRY_CATALOG[upper]) return upper;
    }

    const cfCountry = headers.get("cf-ipcountry");
    if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX") {
      const upper = cfCountry.toUpperCase();
      if (COUNTRY_CATALOG[upper]) return upper;
    }
  }

  if (timezone && TIMEZONE_TO_COUNTRY[timezone]) {
    return TIMEZONE_TO_COUNTRY[timezone];
  }

  if (timezone) {
    if (timezone.startsWith("Africa/")) return "KE";
    if (timezone.startsWith("Europe/")) return "GB";
    if (timezone.startsWith("America/")) return "US";
    if (timezone.startsWith("Asia/")) return "AE";
  }

  return "KE";
}

function deterministicHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function inferUserCountry(params: {
  userId: string;
  email: string;
  recordedCountryCode?: string | null;
  paymentProviders?: string[];
  paymentCurrencies?: string[];
}): CountryInfo {
  const { userId, email, recordedCountryCode, paymentProviders, paymentCurrencies } =
    params;

  // 1. Explicit recorded country at registration or visit
  if (recordedCountryCode && COUNTRY_CATALOG[recordedCountryCode.toUpperCase()]) {
    return COUNTRY_CATALOG[recordedCountryCode.toUpperCase()];
  }

  // 2. Email TLD inspection
  const lowerEmail = email.toLowerCase().trim();
  for (const entry of EMAIL_TLD_TO_COUNTRY) {
    if (lowerEmail.endsWith(entry.suffix)) {
      return getCountryByCode(entry.code);
    }
  }

  // 3. Payment currency / provider signals
  if (paymentCurrencies?.includes("KES")) {
    return COUNTRY_CATALOG.KE;
  }
  if (paymentCurrencies?.includes("NGN")) {
    return COUNTRY_CATALOG.NG;
  }
  if (paymentCurrencies?.includes("ZAR")) {
    return COUNTRY_CATALOG.ZA;
  }
  if (paymentCurrencies?.includes("GHS")) {
    return COUNTRY_CATALOG.GH;
  }
  if (paymentProviders?.includes("INTASEND")) {
    return COUNTRY_CATALOG.KE;
  }

  // 4. Deterministic fallback from userId
  const idx = deterministicHash(userId + lowerEmail) % WEIGHTED_FALLBACK_POOL.length;
  const code = WEIGHTED_FALLBACK_POOL[idx] || "KE";
  return getCountryByCode(code);
}

export function computeCountryBreakdown(
  users: Array<{
    id: string;
    email: string;
    isPro: boolean;
    recordedCountryCode?: string | null;
    paymentProviders?: string[];
    paymentCurrencies?: string[];
  }>
): {
  userGeoMap: Record<string, CountryInfo>;
  breakdown: CountryBreakdownRow[];
  topCountry: CountryBreakdownRow | null;
  regionSummary: Array<{ region: string; count: number; percentage: number }>;
} {
  const userGeoMap: Record<string, CountryInfo> = {};
  const counts: Record<
    string,
    { info: CountryInfo; accountCount: number; activeProCount: number }
  > = {};
  const regionCounts: Record<string, number> = {};

  const total = users.length;

  for (const user of users) {
    const info = inferUserCountry({
      userId: user.id,
      email: user.email,
      recordedCountryCode: user.recordedCountryCode,
      paymentProviders: user.paymentProviders,
      paymentCurrencies: user.paymentCurrencies,
    });

    userGeoMap[user.id] = info;

    if (!counts[info.code]) {
      counts[info.code] = { info, accountCount: 0, activeProCount: 0 };
    }
    counts[info.code].accountCount += 1;
    if (user.isPro) {
      counts[info.code].activeProCount += 1;
    }

    regionCounts[info.region] = (regionCounts[info.region] ?? 0) + 1;
  }

  const breakdown: CountryBreakdownRow[] = Object.values(counts)
    .map((entry) => ({
      code: entry.info.code,
      name: entry.info.name,
      flag: entry.info.flag,
      region: entry.info.region,
      accountCount: entry.accountCount,
      percentage:
        total > 0 ? Math.round((entry.accountCount / total) * 1000) / 10 : 0,
      activeProCount: entry.activeProCount,
    }))
    .sort((a, b) => b.accountCount - a.accountCount);

  const regionSummary = Object.entries(regionCounts)
    .map(([region, count]) => ({
      region,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    userGeoMap,
    breakdown,
    topCountry: breakdown[0] ?? null,
    regionSummary,
  };
}

