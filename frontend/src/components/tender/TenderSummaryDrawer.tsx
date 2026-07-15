'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
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

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 0,
  boxShadow: 'none',
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
};

const accordionSummarySx = {
  minHeight: 48,
  px: 2,
  bgcolor: 'grey.50',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '&.Mui-expanded': { minHeight: 48 },
  '& .MuiAccordionSummary-content': { my: 1 },
};

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
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isPositive ? 'success.main' : 'warning.main',
            flexShrink: 0,
          }}
        />
      )}
      <Typography variant="body2" fontWeight={500}>{label}</Typography>
    </Box>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.75, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
    >
      {children}
    </Typography>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
      {message}
    </Typography>
  );
}

function SummaryTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;
  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell
                key={header}
                sx={{ fontWeight: 600, py: 1, fontSize: '0.75rem', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} sx={{ py: 1, fontSize: '0.8125rem', borderColor: 'divider' }}>
                  {cell}
                </TableCell>
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
        fontWeight: 500,
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
      <Box sx={{ mb: 2 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
            {vendor.coverageSummary}
          </Typography>
        </>
      )}

      <SectionHeading>{t('tenders.summaryKeyDifferences')}</SectionHeading>
      {vendor.keyDifferences.length > 0 ? (
        <Box component="ul" sx={{ m: 0, pl: 2, mb: 0 }}>
          {vendor.keyDifferences.map((item, index) => (
            <Typography key={index} component="li" variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 0.5 }}>
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
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {priceHeaders.map((header) => (
              <TableCell
                key={header}
                sx={{ fontWeight: 600, py: 1, fontSize: '0.75rem', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.item}-${index}`}>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem', borderColor: 'divider' }}>{row.item || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem', borderColor: 'divider' }}>{row.vendorPrice || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem', borderColor: 'divider' }}>{row.historicalPrice || '—'}</TableCell>
              <TableCell sx={{ py: 1, fontSize: '0.8125rem', borderColor: 'divider' }}><VarianceCell value={row.variance} /></TableCell>
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
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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
    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
      {hasOverall && (
        <Box sx={{ mb: hasConclusion ? 2.5 : 0 }}>
          <SectionHeading>{t('tenders.summaryOverall')}</SectionHeading>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {overall}
          </Typography>
        </Box>
      )}
      {hasConclusion && (
        <Box>
          <SectionHeading>{t('tenders.summaryConclusion')}</SectionHeading>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {conclusion}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function SectionTabBar({
  summaryTab,
  showBoqTab,
  showHistoricalTab,
  onChange,
}: {
  summaryTab: 'boq' | 'historical';
  showBoqTab: boolean;
  showHistoricalTab: boolean;
  onChange: (tab: 'boq' | 'historical') => void;
}) {
  const { t } = useLanguage();

  if (!showBoqTab && !showHistoricalTab) return null;

  return (
    <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
      {showBoqTab && (
        <Button
          onClick={() => onChange('boq')}
          disableRipple
          sx={{
            px: 2,
            py: 1.25,
            minWidth: 0,
            borderRadius: 0,
            textTransform: 'none',
            fontWeight: summaryTab === 'boq' ? 600 : 500,
            fontSize: '0.875rem',
            color: summaryTab === 'boq' ? 'text.primary' : 'text.secondary',
            borderBottom: summaryTab === 'boq' ? '2px solid' : '2px solid transparent',
            borderColor: summaryTab === 'boq' ? 'primary.main' : 'transparent',
            mb: '-1px',
            '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
          }}
        >
          {t('tenders.summaryTabBoq')}
        </Button>
      )}
      {showHistoricalTab && (
        <Button
          onClick={() => onChange('historical')}
          disableRipple
          sx={{
            px: 2,
            py: 1.25,
            minWidth: 0,
            borderRadius: 0,
            textTransform: 'none',
            fontWeight: summaryTab === 'historical' ? 600 : 500,
            fontSize: '0.875rem',
            color: summaryTab === 'historical' ? 'text.primary' : 'text.secondary',
            borderBottom: summaryTab === 'historical' ? '2px solid' : '2px solid transparent',
            borderColor: summaryTab === 'historical' ? 'primary.main' : 'transparent',
            mb: '-1px',
            '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
          }}
        >
          {t('tenders.summaryTabHistorical')}
        </Button>
      )}
    </Box>
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
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  const normalizedSummary = useMemo(() => normalizeTenderSummary(tenderSummary), [tenderSummary]);

  const boqSection = normalizedSummary?.boqSummary;
  const historicalSection = normalizedSummary?.historicalSummary;
  const activeSection = summaryTab === 'boq' ? boqSection : historicalSection;
  const vendors = activeSection?.vendors ?? [];
  const hasVendorPanels = vendors.length > 0;
  const hasNarrative = !!(activeSection?.overall.trim() || activeSection?.conclusion.trim());
  const showBoqTab = hasSectionContent(boqSection);
  const showHistoricalTab = hasSectionContent(historicalSection);

  const panelIds = useMemo(
    () => vendors.map((_, index) => `vendor-${summaryTab}-${index}`),
    [vendors, summaryTab]
  );

  useEffect(() => {
    if (!open) return;
    setSummaryTab(showBoqTab ? 'boq' : 'historical');
  }, [open, tenderSummary?._id, showBoqTab]);

  useEffect(() => {
    setExpandedPanels(panelIds);
  }, [panelIds]);

  useEffect(() => {
    if (summaryTab === 'boq' && !showBoqTab && showHistoricalTab) {
      setSummaryTab('historical');
    } else if (summaryTab === 'historical' && !showHistoricalTab && showBoqTab) {
      setSummaryTab('boq');
    }
  }, [summaryTab, showBoqTab, showHistoricalTab]);

  const handleAccordionChange = (panelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanels((prev) =>
      isExpanded ? [...prev, panelId] : prev.filter((id) => id !== panelId)
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 680, md: 720 },
          maxWidth: '100%',
          boxShadow: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>{t('tenders.summaryTitle')}</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {normalizedSummary && !loading && !error && (showBoqTab || showHistoricalTab) && (
          <SectionTabBar
            summaryTab={summaryTab}
            showBoqTab={showBoqTab}
            showHistoricalTab={showHistoricalTab}
            onChange={setSummaryTab}
          />
        )}

        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Alert severity="error" variant="outlined">{error}</Alert>
          ) : !normalizedSummary ? (
            <Alert severity="info" variant="outlined">{t('tenders.summaryNotFound')}</Alert>
          ) : !hasVendorPanels && !hasNarrative ? (
            <Alert severity="info" variant="outlined">{t('tenders.summaryPartialEmpty')}</Alert>
          ) : (
            <>
              {hasVendorPanels && (
                <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
                  {vendors.map((vendor, index) => {
                    const panelId = panelIds[index];
                    const vendorLabel = vendor.vendorName || `${t('tenders.summaryVendorFallback')} ${index + 1}`;

                    return (
                      <Accordion
                        key={panelId}
                        expanded={expandedPanels.includes(panelId)}
                        onChange={handleAccordionChange(panelId)}
                        disableGutters
                        elevation={0}
                        sx={{
                          ...panelSx,
                          '&:not(:last-child)': { borderBottom: 0 },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon fontSize="small" />}
                          sx={accordionSummarySx}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {vendorLabel}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 2, py: 2 }}>
                          {summaryTab === 'boq' ? (
                            <BoqVendorPanel vendor={vendor as BoqVendorSummary} />
                          ) : (
                            <HistoricalVendorPanel vendor={vendor as HistoricalVendorSummary} />
                          )}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {!hasVendorPanels && hasNarrative && (
                <Alert severity="info" variant="outlined" sx={{ mb: 0 }}>
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
