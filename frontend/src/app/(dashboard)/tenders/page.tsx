'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, CardActionArea, Chip, Button,
  TextField, InputAdornment, CircularProgress, Alert, Grid, MenuItem, Divider,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, CalendarToday as CalIcon,
  ArrowForward as ArrowIcon, Inbox as InboxIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface ProposalStats {
  appliedCount: number;
  acceptedCount: number;
  rejectedCount?: number; // Only for company/admin, never shown to vendor
}

interface Tender {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'active' | 'inactive';
  category?: string;
  proposalStats?: ProposalStats;
}

export default function TendersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode } = useThemeMode();
  const router = useRouter();
  const isDark = mode === 'dark';
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const CATEGORY_OPTIONS: { value: string; labelKey: string }[] = [
    { value: 'Information Technology', labelKey: 'tenders.categoryIT' },
    { value: 'Construction & Infrastructure', labelKey: 'tenders.categoryConstruction' },
    { value: 'Professional Services', labelKey: 'tenders.categoryProfessional' },
    { value: 'Supply & Procurement', labelKey: 'tenders.categorySupply' },
    { value: 'Maintenance & Facilities', labelKey: 'tenders.categoryMaintenance' },
    { value: 'Consulting', labelKey: 'tenders.categoryConsulting' },
    { value: 'Other', labelKey: 'tenders.categoryOther' },
  ];

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const { data } = await apiClient.get('/tenders', { params });
      setTenders(data.tenders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('tenders.loadTendersError'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, t]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const daysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const isExpired = (deadline: string) => new Date(deadline) < new Date();

  return (
    <DashboardLayout>
      <Box>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
              {user?.role === 'vendor' ? t('tenders.activeTendersTitle') : t('tenders.tendersTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {tenders.length === 1 ? t('tenders.tendersFound', { count: 1 }) : t('tenders.tendersFoundPlural', { count: tenders.length })}
            </Typography>
          </Box>
          {(user?.role === 'companyUser' || user?.role === 'admin') && (
            <Button
              id="create-tender-btn"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/tenders/create')}
              sx={{
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
              }}
            >
              {t('tenders.postTender')}
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

        {/* ── Filters ── */}
        <Card elevation={0} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            id="tender-search"
            placeholder={t('tenders.searchPlaceholderFull')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="category-filter"
            select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label={t('tenders.category')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">{t('tenders.allCategories')}</MenuItem>
            {CATEGORY_OPTIONS.map((c) => (
              <MenuItem key={c.value} value={c.value}>{t(c.labelKey)}</MenuItem>
            ))}
          </TextField>
          {user?.role !== 'vendor' && (
            <TextField
              id="status-filter"
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label={t('tenders.status')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">{t('tenders.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('tenders.active')}</MenuItem>
              <MenuItem value="inactive">{t('tenders.inactive')}</MenuItem>
            </TextField>
          )}
        </Card>

        {/* ── Tender cards ── */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : tenders.length === 0 ? (
          <Card elevation={0} sx={{ py: 8, textAlign: 'center' }}>
            <InboxIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              {t('tenders.noTendersFound')}
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={0.5}>
              {search ? t('tenders.adjustSearch') : t('tenders.noTendersPublished')}
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {tenders.map((tender) => {
              const expired = isExpired(tender.deadline);
              const days = daysLeft(tender.deadline);
              const closingSoon = !expired && days <= 7;

              return (
                <Grid item xs={12} sm={6} lg={4} key={tender._id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: isDark
                          ? '0 8px 32px rgba(0,0,0,0.5)'
                          : '0 8px 28px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => router.push(`/tenders/${tender._id}`)}
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 3 }}
                    >
                      {/* Status badges */}
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                        {tender.status === 'active' && !expired ? (
                          <Chip label={t('tenders.active')} size="small" color="success" />
                        ) : expired ? (
                          <Chip label={t('tenders.closed')} size="small" color="error" />
                        ) : (
                          <Chip label={t('tenders.inactive')} size="small" color="default" />
                        )}
                        {closingSoon && (
                          <Chip label={t('tenders.daysLeft', { days })} size="small" color="warning" />
                        )}
                        {tender.category && (
                          <Chip label={CATEGORY_OPTIONS.find((o) => o.value === tender.category) ? t(CATEGORY_OPTIONS.find((o) => o.value === tender.category)!.labelKey) : tender.category} size="small" variant="outlined" />
                        )}
                        {/* Proposal stats: vendor sees applied + accepted only; company/admin sees all */}
                        {tender.proposalStats && tender.proposalStats.appliedCount > 0 && (
                          <Chip
                            label={
                              user?.role === 'vendor'
                                ? t('proposals.appliedAccepted', { applied: tender.proposalStats.appliedCount, accepted: tender.proposalStats.acceptedCount })
                                : tender.proposalStats.acceptedCount > 0
                                  ? t('proposals.appliedAccepted', { applied: tender.proposalStats.appliedCount, accepted: tender.proposalStats.acceptedCount })
                                  : `${tender.proposalStats.appliedCount} ${t('proposals.applied')}`
                            }
                            size="small"
                            variant="outlined"
                            color={tender.proposalStats.acceptedCount > 0 ? 'success' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        letterSpacing="-0.01em"
                        gutterBottom
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {tender.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.6,
                        }}
                      >
                        {tender.description}
                      </Typography>

                      <Divider sx={{ width: '100%', my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <CalIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            {expired ? t('tenders.closed') : t('tenders.closes')}{' '}
                            {new Date(tender.deadline).toLocaleDateString('en-MY', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" fontWeight={700} color="primary.main">
                            {t('tenders.viewDetails')}
                          </Typography>
                          <ArrowIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}
