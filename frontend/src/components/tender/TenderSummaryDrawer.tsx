'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Drawer,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLanguage } from '@/context/LanguageContext';
import {
  type BoqVendorSummary,
  type HistoricalVendorSummary,
  type TenderSummaryData,
  hasSectionContent,
  normalizeTenderSummary,
} from '@/lib/tenderSummary';

interface TenderSummaryDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  tenderSummary: TenderSummaryData | null;
}

function MatchStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = status.trim() || t('tenders.summaryNotAvailable');
  const normalized = label.toLowerCase();
  const isPositive = normalized.includes('fully') || normalized.includes('mostly');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {label !== t('tenders.summaryNotAvailable') && (
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: isPositive ? 'success.main' : 'warning.main',
            flexShrink: 0,
          }}
        />
      )}
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
    </Box>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: '0.08em' }}
    >
      {children}
    </Typography>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
      {message}
    </Typography>
  );
}

function SummaryTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;
  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            {headers.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700, py: 1 }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} sx={{ py: 1, fontSize: '0.8125rem' }}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function VarianceCell({ value }: { value: string }) {
  const display = value.trim() || '—';
  const isPositive = display.startsWith('+');
  const isNegative = display.startsWith('-');
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{
        fontWeight: 600,
        color: isPositive ? 'error.main' : isNegative ? 'success.main' : 'text.primary',
      }}
    >
      {display}
    </Typography>
  );
}

function BoqVendorPanel({ vendor }: { vendor: BoqVendorSummary }) {
  const { t } = useLanguage();

  return (
    <Box>
      <SectionHeading>{t('tenders.summaryMatchStatus')}</SectionHeading>
      <Box sx={{ mb: 2.5 }}>
        <MatchStatusBadge status={vendor.matchStatus} />
      </Box>

      {vendor.scopeCoverage.length > 0 && (
        <>
          <SectionHeading>{t('tenders.summaryScopeCoverage')}</SectionHeading>
          <SummaryTable
            headers={[t('tenders.summaryMetric'), t('tenders.summaryResult')]}
            rows={vendor.scopeCoverage.map((row) => [row.metric, row.result])}
          />
        </>
      )}

      {vendor.coverageSummary.trim() && (
        <>
          <SectionHeading>{t('tenders.summaryCoverageSummary')}</SectionHeading>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2.5 }}>
            {vendor.coverageSummary}
          </Typography>
        </>
      )}

      <SectionHeading>{t('tenders.summaryKeyDifferences')}</SectionHeading>
      {vendor.keyDifferences.length > 0 ? (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {vendor.keyDifferences.map((item, index) => (
            <Typography key={index} component="li" variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 0.75 }}>
              {item}
            </Typography>
          ))}
        </Box>
      ) : (
        <EmptyHint message={t('tenders.summaryNoItems')} />
      )}
    </Box>
  );
}

function HistoricalVendorPanel({ vendor }: { vendor: HistoricalVendorSummary }) {
  const { t } = useLanguage();
  const priceHeaders = [
    t('tenders.summaryItem'),
    t('tenders.summaryVendorPrice'),
    t('tenders.summaryHistoricalPrice'),
    t('tenders.summaryVariance'),
  ];

  const renderPriceTable = (rows: HistoricalVendorSummary['aboveHistorical']) => (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            {priceHeaders.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700, py: 1 }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.item}-${index}`}>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem' }}>{row.item || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem' }}>{row.vendorPrice || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem' }}>{row.historicalPrice || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem' }}><VarianceCell value={row.variance} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <SectionHeading>{t('tenders.summaryPricingOverview')}</SectionHeading>
      {vendor.pricingOverview.length > 0 ? (
        <SummaryTable
          headers={[t('tenders.summaryMetric'), t('tenders.summaryCount')]}
          rows={vendor.pricingOverview.map((row) => [row.metric, String(row.count)])}
        />
      ) : (
        <EmptyHint message={t('tenders.summaryNoItems')} />
      )}

      <SectionHeading>{t('tenders.summaryAboveHistorical')}</SectionHeading>
      {vendor.aboveHistorical.length > 0 ? renderPriceTable(vendor.aboveHistorical) : (
        <EmptyHint message={t('tenders.summaryNoItems')} />
      )}

      <SectionHeading>{t('tenders.summaryBelowHistorical')}</SectionHeading>
      {vendor.belowHistorical.length > 0 ? renderPriceTable(vendor.belowHistorical) : (
        <EmptyHint message={t('tenders.summaryNoItems')} />
      )}

      {vendor.commercialObservation.trim() && (
        <>
          <SectionHeading>{t('tenders.summaryCommercialObservation')}</SectionHeading>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {vendor.commercialObservation}
          </Typography>
        </>
      )}
    </Box>
  );
}

function OverallConclusion({ overall, conclusion }: { overall: string; conclusion: string }) {
  const { t } = useLanguage();
  const hasOverall = !!overall.trim();
  const hasConclusion = !!conclusion.trim();

  if (!hasOverall && !hasConclusion) return null;

  return (
    <Card
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {hasOverall && (
          <Box sx={{ mb: hasConclusion ? 2 : 0 }}>
            <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
              {t('tenders.summaryOverall')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {overall}
            </Typography>
          </Box>
        )}
        {hasOverall && hasConclusion && <Divider sx={{ my: 2 }} />}
        {hasConclusion && (
          <Box>
            <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
              {t('tenders.summaryConclusion')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {conclusion}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function TenderSummaryDrawer({
  open,
  onClose,
  loading,
  error,
  tenderSummary,
}: TenderSummaryDrawerProps) {
  const { t } = useLanguage();
  const [summaryTab, setSummaryTab] = useState<'boq' | 'historical'>('boq');
  const [vendorTab, setVendorTab] = useState(0);

  const normalizedSummary = useMemo(() => normalizeTenderSummary(tenderSummary), [tenderSummary]);

  const boqSection = normalizedSummary?.boqSummary;
  const historicalSection = normalizedSummary?.historicalSummary;
  const activeSection = summaryTab === 'boq' ? boqSection : historicalSection;
  const vendors = activeSection?.vendors ?? [];
  const selectedVendor = vendors[vendorTab] ?? vendors[0];
  const hasVendorPanel = !!selectedVendor;
  const hasNarrative = !!(activeSection?.overall.trim() || activeSection?.conclusion.trim());
  const showBoqTab = hasSectionContent(boqSection);
  const showHistoricalTab = hasSectionContent(historicalSection);

  useEffect(() => {
    if (!open) return;
    setSummaryTab(showBoqTab ? 'boq' : 'historical');
    setVendorTab(0);
  }, [open, tenderSummary?._id, showBoqTab]);

  useEffect(() => {
    if (vendorTab >= vendors.length) {
      setVendorTab(Math.max(0, vendors.length - 1));
    }
  }, [vendorTab, vendors.length]);

  useEffect(() => {
    if (summaryTab === 'boq' && !showBoqTab && showHistoricalTab) {
      setSummaryTab('historical');
    } else if (summaryTab === 'historical' && !showHistoricalTab && showBoqTab) {
      setSummaryTab('boq');
    }
  }, [summaryTab, showBoqTab, showHistoricalTab]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 720, md: 780 }, maxWidth: '100%' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" fontWeight={700}>{t('tenders.summaryTitle')}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {normalizedSummary && !loading && !error && (showBoqTab || showHistoricalTab) && (
          <Box sx={{ px: 2, pt: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            {(showBoqTab || showHistoricalTab) && (
              <ToggleButtonGroup
                value={summaryTab}
                exclusive
                fullWidth
                onChange={(_, value: 'boq' | 'historical' | null) => {
                  if (!value) return;
                  if (value === 'boq' && !showBoqTab) return;
                  if (value === 'historical' && !showHistoricalTab) return;
                  setSummaryTab(value);
                  setVendorTab(0);
                }}
                sx={{
                  mb: vendors.length > 1 ? 1.5 : 2,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    borderRadius: '10px !important',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      color: 'primary.contrastText',
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      borderColor: 'transparent',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)',
                      },
                    },
                  },
                  '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
                    ml: 1,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                {showBoqTab && <ToggleButton value="boq">{t('tenders.summaryTabBoq')}</ToggleButton>}
                {showHistoricalTab && <ToggleButton value="historical">{t('tenders.summaryTabHistorical')}</ToggleButton>}
              </ToggleButtonGroup>
            )}

            {vendors.length > 1 && (
              <Tabs
                value={Math.min(vendorTab, Math.max(vendors.length - 1, 0))}
                onChange={(_, value: number) => setVendorTab(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40, py: 1, textTransform: 'none', fontWeight: 600 },
                }}
              >
                {vendors.map((vendor, index) => (
                  <Tab
                    key={`${vendor.vendorName}-${index}`}
                    label={vendor.vendorName || `${t('tenders.summaryVendorFallback')} ${index + 1}`}
                  />
                ))}
              </Tabs>
            )}
          </Box>
        )}

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !normalizedSummary ? (
            <Alert severity="info">{t('tenders.summaryNotFound')}</Alert>
          ) : !hasVendorPanel && !hasNarrative ? (
            <Alert severity="info">{t('tenders.summaryPartialEmpty')}</Alert>
          ) : (
            <>
              {hasVendorPanel && vendors.length === 1 && (
                <Chip
                  label={selectedVendor.vendorName || t('tenders.summaryVendorFallback')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2, fontWeight: 600 }}
                />
              )}

              {hasVendorPanel && (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {summaryTab === 'boq' ? (
                      <BoqVendorPanel vendor={selectedVendor as BoqVendorSummary} />
                    ) : (
                      <HistoricalVendorPanel vendor={selectedVendor as HistoricalVendorSummary} />
                    )}
                  </CardContent>
                </Card>
              )}

              {!hasVendorPanel && hasNarrative && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('tenders.summaryNoVendorBreakdown')}
                </Alert>
              )}

              {activeSection && (
                <OverallConclusion overall={activeSection.overall} conclusion={activeSection.conclusion} />
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

export type { TenderSummaryData };
