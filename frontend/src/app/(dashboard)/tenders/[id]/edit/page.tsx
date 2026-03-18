'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Alert, CircularProgress, Grid, MenuItem,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, Assignment as TenderIcon, AttachFile as AttachIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function EditTenderPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTender, setLoadingTender] = useState(true);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', deadline: '', category: '', status: 'active',
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTender(true);
      setError('');
      try {
        const { data } = await apiClient.get(`/tenders/${id}`);
        if (cancelled) return;
        const tender = data.tender;
        const dl = tender.deadline ? new Date(tender.deadline) : new Date();
        setForm({
          title: tender.title || '',
          description: tender.description || '',
          requirements: tender.requirements || '',
          deadline: dl.toISOString().slice(0, 16),
          category: tender.category || '',
          status: tender.status || 'active',
        });
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('tenders.loadError'));
      } finally {
        if (!cancelled) setLoadingTender(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, t]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('requirements', form.requirements);
      formData.append('deadline', new Date(form.deadline).toISOString());
      formData.append('category', form.category);
      formData.append('status', form.status);
      attachments.forEach((f) => formData.append('attachments', f));
      await apiClient.put(`/tenders/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push(`/tenders/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('tenders.publishFailed'));
      setLoading(false);
    }
  };

  if (!['companyUser', 'admin'].includes(user?.role || '')) {
    return <DashboardLayout><Alert severity="error">{t('tenders.accessDenied')}</Alert></DashboardLayout>;
  }

  const LabelText = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
      {children}
    </Typography>
  );

  const CATEGORY_OPTIONS: { value: string; labelKey: string }[] = [
    { value: 'Information Technology', labelKey: 'tenders.categoryIT' },
    { value: 'Construction & Infrastructure', labelKey: 'tenders.categoryConstruction' },
    { value: 'Professional Services', labelKey: 'tenders.categoryProfessional' },
    { value: 'Supply & Procurement', labelKey: 'tenders.categorySupply' },
    { value: 'Maintenance & Facilities', labelKey: 'tenders.categoryMaintenance' },
    { value: 'Consulting', labelKey: 'tenders.categoryConsulting' },
    { value: 'Other', labelKey: 'tenders.categoryOther' },
  ];

  if (loadingTender) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box maxWidth={750} mx="auto">
        <Button startIcon={<BackIcon />} onClick={() => router.push(`/tenders/${id}`)} sx={{ mb: 2.5 }}>
          {t('tenders.backToTenders')}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <TenderIcon color="primary" />
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            {t('tenders.editTender')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Update the tender details below.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <LabelText>{t('tenders.tenderTitle')}</LabelText>
                  <TextField id="et-title" placeholder={t('tenders.tenderTitlePlaceholder')} required fullWidth value={form.title} onChange={handleChange('title')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>{t('tenders.category')}</LabelText>
                  <TextField id="et-category" select fullWidth value={form.category} onChange={handleChange('category')}>
                    <MenuItem value="">{t('tenders.selectCategory')}</MenuItem>
                    {CATEGORY_OPTIONS.map((c) => <MenuItem key={c.value} value={c.value}>{t(c.labelKey)}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>{t('tenders.status')}</LabelText>
                  <TextField id="et-status" select fullWidth value={form.status} onChange={handleChange('status')}>
                    <MenuItem value="active">{t('tenders.active')}</MenuItem>
                    <MenuItem value="inactive">{t('tenders.inactive')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>{t('tenders.submissionDeadline')} *</LabelText>
                  <TextField
                    id="et-deadline"
                    type="datetime-local"
                    required
                    fullWidth
                    value={form.deadline}
                    onChange={handleChange('deadline')}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <LabelText>{t('tenders.description')} *</LabelText>
                  <TextField
                    id="et-description"
                    required
                    multiline
                    rows={5}
                    fullWidth
                    value={form.description}
                    onChange={handleChange('description')}
                    placeholder={t('tenders.descriptionPlaceholder')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <LabelText>{t('tenders.requirementsEligibility')}</LabelText>
                  <TextField
                    id="et-requirements"
                    multiline
                    rows={4}
                    fullWidth
                    value={form.requirements}
                    onChange={handleChange('requirements')}
                    placeholder={t('tenders.requirementsPlaceholder')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <LabelText>{t('tenders.attachPdfs')}</LabelText>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Add new PDFs (existing attachments are kept).
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" component="label" size="small" startIcon={<AttachIcon />}>
                      {t('tenders.choosePdfs')}
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        hidden
                        onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                      />
                    </Button>
                    {attachments.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {attachments.length === 1 ? t('tenders.filesSelected', { count: 1 }) : t('tenders.filesSelectedPlural', { count: attachments.length })}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push(`/tenders/${id}`)}>{t('common.cancel')}</Button>
                <Button
                  id="et-submit"
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={loading || !form.title || !form.deadline || !form.description}
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                  }}
                >
                  {t('common.save')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
