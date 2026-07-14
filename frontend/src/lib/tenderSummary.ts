export interface ScopeCoverageRow {
  metric: string;
  result: string;
}

export interface BoqVendorSummary {
  vendorName: string;
  matchStatus: string;
  scopeCoverage: ScopeCoverageRow[];
  coverageSummary: string;
  keyDifferences: string[];
}

export interface BoqSummary {
  vendors: BoqVendorSummary[];
  overall: string;
  conclusion: string;
}

export interface PricingOverviewRow {
  metric: string;
  count: number;
}

export interface HistoricalPriceRow {
  item: string;
  vendorPrice: string;
  historicalPrice: string;
  variance: string;
}

export interface HistoricalVendorSummary {
  vendorName: string;
  pricingOverview: PricingOverviewRow[];
  aboveHistorical: HistoricalPriceRow[];
  belowHistorical: HistoricalPriceRow[];
  commercialObservation: string;
}

export interface HistoricalSummary {
  vendors: HistoricalVendorSummary[];
  overall: string;
  conclusion: string;
}

export interface NormalizedTenderSummary {
  boqSummary: BoqSummary;
  historicalSummary: HistoricalSummary;
}

export interface TenderSummaryData {
  _id?: string;
  tenderId?: string;
  summary?: Partial<{
    boqSummary: unknown;
    historicalSummary: unknown;
  }>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function normalizeScopeCoverage(rows: unknown): ScopeCoverageRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      metric: asString(row.metric).trim(),
      result: asString(row.result).trim(),
    }))
    .filter((row) => row.metric || row.result);
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => asString(item).trim())
    .filter(Boolean);
}

function normalizeBoqVendor(raw: unknown, index: number): BoqVendorSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const vendor = raw as Record<string, unknown>;

  const vendorName = asString(vendor.vendorName).trim() || `Vendor ${index + 1}`;
  const matchStatus = asString(vendor.matchStatus).trim();
  const coverageSummary = asString(vendor.coverageSummary).trim();
  const keyDifferences = normalizeStringList(vendor.keyDifferences);
  const scopeCoverage = normalizeScopeCoverage(vendor.scopeCoverage);

  const hasContent = matchStatus || coverageSummary || keyDifferences.length > 0 || scopeCoverage.length > 0;
  if (!hasContent) return null;

  return {
    vendorName,
    matchStatus,
    scopeCoverage,
    coverageSummary,
    keyDifferences,
  };
}

function normalizeBoqSummary(raw: unknown): BoqSummary {
  if (!raw || typeof raw !== 'object') {
    return { vendors: [], overall: '', conclusion: '' };
  }

  const section = raw as Record<string, unknown>;
  const overall = asString(section.overall).trim();
  const conclusion = asString(section.conclusion).trim();
  const legacyTitle = asString(section.title).trim();

  if (!Array.isArray(section.vendors)) {
    return {
      vendors: [],
      overall: overall || legacyTitle,
      conclusion: conclusion || overall,
    };
  }

  const vendors = section.vendors
    .map((vendor, index) => normalizeBoqVendor(vendor, index))
    .filter((vendor): vendor is BoqVendorSummary => vendor !== null);

  return {
    vendors,
    overall,
    conclusion,
  };
}

function normalizeHistoricalPriceRows(rows: unknown): HistoricalPriceRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      item: asString(row.item).trim(),
      vendorPrice: asString(row.vendorPrice).trim(),
      historicalPrice: asString(row.historicalPrice).trim(),
      variance: asString(row.variance).trim(),
    }))
    .filter((row) => row.item || row.vendorPrice || row.historicalPrice || row.variance);
}

function normalizePricingOverview(rows: unknown): PricingOverviewRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      metric: asString(row.metric).trim(),
      count: asNumber(row.count),
    }))
    .filter((row) => row.metric);
}

function normalizeHistoricalVendor(raw: unknown, index: number): HistoricalVendorSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const vendor = raw as Record<string, unknown>;

  const vendorName = asString(vendor.vendorName).trim() || `Vendor ${index + 1}`;
  const pricingOverview = normalizePricingOverview(vendor.pricingOverview);
  const aboveHistorical = normalizeHistoricalPriceRows(vendor.aboveHistorical);
  const belowHistorical = normalizeHistoricalPriceRows(vendor.belowHistorical);
  const commercialObservation = asString(vendor.commercialObservation).trim();

  const hasContent =
    pricingOverview.length > 0 ||
    aboveHistorical.length > 0 ||
    belowHistorical.length > 0 ||
    commercialObservation.length > 0;

  if (!hasContent) return null;

  return {
    vendorName,
    pricingOverview,
    aboveHistorical,
    belowHistorical,
    commercialObservation,
  };
}

function normalizeHistoricalSummary(raw: unknown): HistoricalSummary {
  if (!raw || typeof raw !== 'object') {
    return { vendors: [], overall: '', conclusion: '' };
  }

  const section = raw as Record<string, unknown>;
  const overall = asString(section.overall).trim();
  const conclusion = asString(section.conclusion).trim();
  const legacyTitle = asString(section.title).trim();

  if (!Array.isArray(section.vendors)) {
    return {
      vendors: [],
      overall: overall || legacyTitle,
      conclusion: conclusion || overall,
    };
  }

  const vendors = section.vendors
    .map((vendor, index) => normalizeHistoricalVendor(vendor, index))
    .filter((vendor): vendor is HistoricalVendorSummary => vendor !== null);

  return {
    vendors,
    overall,
    conclusion,
  };
}

export function normalizeTenderSummary(raw: TenderSummaryData | null | undefined): NormalizedTenderSummary | null {
  if (!raw?.summary) return null;

  const boqSummary = normalizeBoqSummary(raw.summary.boqSummary);
  const historicalSummary = normalizeHistoricalSummary(raw.summary.historicalSummary);

  const hasBoq =
    boqSummary.vendors.length > 0 || boqSummary.overall.length > 0 || boqSummary.conclusion.length > 0;
  const hasHistorical =
    historicalSummary.vendors.length > 0 ||
    historicalSummary.overall.length > 0 ||
    historicalSummary.conclusion.length > 0;

  if (!hasBoq && !hasHistorical) return null;

  return { boqSummary, historicalSummary };
}

export function hasSectionContent(section: BoqSummary | HistoricalSummary | undefined): boolean {
  if (!section) return false;
  return section.vendors.length > 0 || !!section.overall.trim() || !!section.conclusion.trim();
}
