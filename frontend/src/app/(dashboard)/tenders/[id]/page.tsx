'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Alert, CircularProgress,
  Divider, TextField, MenuItem, IconButton, Tooltip, Link as MuiLink, Avatar, Tabs, Tab,
  Drawer, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CloudUpload as UploadIcon, PictureAsPdf as PdfIcon,
  ChevronRight as ChevronIcon, Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon, Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_OPTIONS = ['Pending', 'Reviewed', 'Accepted', 'Rejected', 'Shortlisted'];
const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'> = {
  Pending: 'default', Reviewed: 'info', Accepted: 'success', Rejected: 'error', Shortlisted: 'primary',
};

interface Proposal {
  _id: string;
  vendorId: { email: string; profile?: { companyName?: string; contactPerson?: string; phone?: string; address?: string } };
  filePath: string;
  originalFileName?: string;
  status: string;
  remarks: string;
  score?: number;
  submittedAt: string;
}

interface ProposalStats {
  appliedCount: number;
  acceptedCount: number;
  rejectedCount?: number;
}

interface MyProposal {
  status: string;
  remarks?: string;
  score?: number;
}

interface Tender {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  deadline: string;
  status: 'active' | 'inactive';
  category?: string;
  createdBy?: { email: string; profile?: { companyName?: string } };
  proposalStats?: ProposalStats;
  myProposal?: MyProposal;
  attachments?: string[];
}

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [tender, setTender] = useState<Tender | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarkEdits, setRemarkEdits] = useState<Record<string, { status: string; remarks: string; score: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const STATUS_TABS = [
    { value: 'all', labelKey: 'proposals.statusAll' },
    { value: 'Pending', labelKey: 'proposals.statusPending' },
    { value: 'Reviewed', labelKey: 'proposals.statusReviewed' },
    { value: 'Shortlisted', labelKey: 'proposals.statusShortlisted' },
    { value: 'Accepted', labelKey: 'proposals.statusAccepted' },
    { value: 'Rejected', labelKey: 'proposals.statusRejected' },
  ];

  const filteredProposals =
    statusTab === 'all' ? proposals : proposals.filter((p) => (remarkEdits[p._id]?.status ?? p.status) === statusTab);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: td } = await apiClient.get(`/tenders/${id}`);
      setTender(td.tender);
      if (user?.role !== 'vendor') {
        const { data: pd } = await apiClient.get(`/proposals/tender/${id}`);
        setProposals(pd.proposals);
        const init: typeof remarkEdits = {};
        pd.proposals.forEach((p: Proposal) => {
          init[p._id] = { status: p.status, remarks: p.remarks || '', score: p.score?.toString() || '' };
        });
        setRemarkEdits(init);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('tenders.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, user?.role, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('proposalFile', selectedFile);
      formData.append('tenderId', id);
      await apiClient.post('/proposals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(t('proposals.submitSuccess'));
      setSelectedFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('proposals.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRemarks = async (proposalId: string) => {
    setSaving(proposalId);
    try {
      const edits = remarkEdits[proposalId];
      await apiClient.patch(`/proposals/${proposalId}/status`, {
        status: edits.status,
        remarks: edits.remarks,
        score: edits.score ? Number(edits.score) : undefined,
      });
      await fetchData();
      setSelectedProposal(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('proposals.saveEvaluationFailed'));
    } finally {
      setSaving(null);
    }
  };

  const getPdfUrl = (filePath: string) => {
    const filename = filePath.replace(/\\/g, '/').split('/').pop();
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${filename}`;
  };

  const getAttachmentFilename = (path: string) => path.replace(/\\/g, '/').split('/').pop() || 'document.pdf';

  if (loading) {
    return <DashboardLayout><Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box></DashboardLayout>;
  }

  if (!tender) {
    return <DashboardLayout><Alert severity="error">{error || t('tenders.tenderNotFound')}</Alert></DashboardLayout>;
  }

  const isExpired = new Date(tender.deadline) < new Date();

  return (
    <DashboardLayout>
      <Box maxWidth={900} mx="auto">
        <Button startIcon={<BackIcon />} onClick={() => router.push('/tenders')} sx={{ mb: 2.5 }}>
          {t('tenders.backToTenders')}
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}
        {uploadSuccess && <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setUploadSuccess('')}>{uploadSuccess}</Alert>}

        {/* ── Tender header ── */}
        <Card elevation={0} sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={isExpired ? t('tenders.closed') : tender.status === 'active' ? t('tenders.active') : t('tenders.inactive')}
                size="small"
                color={isExpired ? 'error' : tender.status === 'active' ? 'success' : 'default'}
              />
              {tender.category && <Chip label={tender.category} size="small" variant="outlined" />}
              {/* Vendor: show applied/accepted stats (no rejected); also show my status if applied */}
              {user?.role === 'vendor' && tender.proposalStats && tender.proposalStats.appliedCount > 0 && (
                <Chip
                  label={`${tender.proposalStats.appliedCount} applied, ${tender.proposalStats.acceptedCount} accepted`}
                  size="small"
                  variant="outlined"
                  color={tender.proposalStats.acceptedCount > 0 ? 'success' : 'default'}
                  sx={{ fontWeight: 500 }}
                />
              )}
              {user?.role === 'vendor' && tender.myProposal && (
                <Chip
                  label={
                    tender.myProposal.status === 'Accepted'
                      ? t('proposals.youWereAccepted')
                      : tender.myProposal.status === 'Rejected'
                        ? t('proposals.notAccepted')
                        : t('proposals.yourStatus', { status: tender.myProposal.status })
                  }
                  size="small"
                  color={
                    tender.myProposal.status === 'Accepted'
                      ? 'success'
                      : tender.myProposal.status === 'Rejected'
                        ? 'error'
                        : 'default'
                  }
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            <Typography variant="h3" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
              {tender.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {tender.description}
            </Typography>

            {tender.requirements && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1.5 }}>
                  {t('tenders.requirementsEligibility')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {tender.requirements}
                </Typography>
              </>
            )}

            {tender.attachments && tender.attachments.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1.5 }}>
                  {t('tenders.attachedDocuments')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tender.attachments.map((path, i) => (
                    <Button
                      key={i}
                      component={MuiLink}
                      href={getPdfUrl(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<PdfIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      {getAttachmentFilename(path)}
                    </Button>
                  ))}
                </Box>
              </>
            )}

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="overline" color="text.disabled" display="block">{t('tenders.submissionDeadline')}</Typography>
                <Typography variant="body1" fontWeight={700} color={isExpired ? 'error.main' : 'text.primary'}>
                  {new Date(tender.deadline).toLocaleDateString('en-MY', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Typography>
              </Box>
              {tender.createdBy && (
                <Box>
                  <Typography variant="overline" color="text.disabled" display="block">{t('tenders.postedBy')}</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {tender.createdBy.profile?.companyName || tender.createdBy.email}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* ── VENDOR: Status banner (if already applied) ── */}
        {user?.role === 'vendor' && tender.myProposal && ['Accepted', 'Rejected'].includes(tender.myProposal.status) && (
          <Alert
            severity={tender.myProposal.status === 'Accepted' ? 'success' : 'error'}
            sx={{ mb: 3 }}
          >
            <Typography fontWeight={600}>
              {tender.myProposal.status === 'Accepted'
                ? t('proposals.acceptedBanner')
                : t('proposals.rejectedBanner')}
            </Typography>
            {tender.myProposal.remarks && (
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                {tender.myProposal.remarks}
              </Typography>
            )}
          </Alert>
        )}

        {/* ── VENDOR: Upload form ── */}
        {user?.role === 'vendor' && (
          <Card elevation={0}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Typography variant="h6" fontWeight={700} letterSpacing="-0.01em" gutterBottom>
                {t('tenders.submitProposal')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('tenders.submitProposalDesc')}
              </Typography>

              {isExpired || tender.status !== 'active' ? (
                <Alert severity="warning">{t('tenders.tenderNotAccepting')}</Alert>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    id="choose-pdf-btn"
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    {t('tenders.choosePdfFile')}
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {selectedFile && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>{selectedFile.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                  )}
                  <Button
                    id="submit-proposal-btn"
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                    }}
                  >
                    {uploading ? t('tenders.submitting') : t('tenders.submitProposal')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── COMPANY USER / ADMIN: Proposal review ── */}
        {(user?.role === 'companyUser' || user?.role === 'admin') && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('proposals.vendorSubmissions')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Chip label={t('proposals.countSubmitted', { count: proposals.length })} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 24 }} />
                    <Chip label={t('proposals.countAccepted', { count: proposals.filter((p) => (remarkEdits[p._id]?.status ?? p.status) === 'Accepted').length })} size="small" color="success" sx={{ fontSize: '0.7rem', height: 24 }} />
                    <Chip label={t('proposals.countRejected', { count: proposals.filter((p) => (remarkEdits[p._id]?.status ?? p.status) === 'Rejected').length })} size="small" color="error" sx={{ fontSize: '0.7rem', height: 24 }} />
                    <Chip label={t('proposals.countPending', { count: proposals.filter((p) => !['Accepted', 'Rejected'].includes(remarkEdits[p._id]?.status ?? p.status)).length })} size="small" color="warning" sx={{ fontSize: '0.7rem', height: 24 }} />
                  </Box>
                </Box>
              </Box>

              <Tabs
                value={statusTab}
                onChange={(_, v: string) => setStatusTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 2,
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40, py: 1, textTransform: 'none', fontWeight: 500 },
                }}
              >
                {STATUS_TABS.map((tab) => {
                  const count = tab.value === 'all' ? proposals.length : proposals.filter((p) => (remarkEdits[p._id]?.status ?? p.status) === tab.value).length;
                  return (
                    <Tab
                      key={tab.value}
                      value={tab.value}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {t(tab.labelKey)}
                          <Chip label={count} size="small" sx={{ height: 18, fontSize: '0.65rem', minWidth: 20 }} />
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>

              {proposals.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{t('proposals.noProposalsYet')}</Typography>
                </Box>
              ) : filteredProposals.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('proposals.noSubmissionsInCategory')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredProposals.map((p) => {
                    const edit = remarkEdits[p._id] || { status: p.status, remarks: '', score: '' };
                    const vendorName = p.vendorId.profile?.companyName || p.vendorId.email;
                    const status = edit.status;
                    return (
                      <Card
                        key={p._id}
                        variant="outlined"
                        sx={{
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                            boxShadow: 1,
                          },
                        }}
                        onClick={() => setSelectedProposal(p)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                          <Avatar sx={{ width: 44, height: 44, fontSize: '0.9rem', fontWeight: 600, background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                            {vendorName[0].toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" fontWeight={600}>{vendorName}</Typography>
                            {p.vendorId.profile?.contactPerson && (
                              <Typography variant="caption" color="text.secondary">{p.vendorId.profile.contactPerson}</Typography>
                            )}
                          </Box>
                          <Chip label={status === 'Pending' || status === 'Reviewed' || status === 'Shortlisted' || status === 'Accepted' || status === 'Rejected' ? t(`proposals.status${status}`) : status} size="small" color={STATUS_COLORS[status] || 'default'} sx={{ fontWeight: 600 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                            {new Date(p.submittedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                          <ChevronIcon color="action" />
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Vendor Detail Drawer ── */}
        <Drawer
          anchor="right"
          open={Boolean(selectedProposal)}
          onClose={() => setSelectedProposal(null)}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100%' },
          }}
        >
          {selectedProposal && (() => {
            const p = selectedProposal;
            const edit = remarkEdits[p._id] || { status: p.status, remarks: p.remarks || '', score: p.score?.toString() || '' };
            const vendorName = p.vendorId.profile?.companyName || p.vendorId.email;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>{t('proposals.vendorDetails')}</Typography>
                  <IconButton size="small" onClick={() => setSelectedProposal(null)}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, fontSize: '1.2rem', fontWeight: 700, background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                      {vendorName[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{vendorName}</Typography>
                      <Chip label={edit.status === 'Pending' || edit.status === 'Reviewed' || edit.status === 'Shortlisted' || edit.status === 'Accepted' || edit.status === 'Rejected' ? t(`proposals.status${edit.status}`) : edit.status} size="small" color={STATUS_COLORS[edit.status] || 'default'} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{t('proposals.contact')}</Typography>
                  <List dense disablePadding>
                    {p.vendorId.profile?.contactPerson && (
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
                        <ListItemText primary={p.vendorId.profile.contactPerson} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    )}
                    <ListItem disablePadding sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}><EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary={p.vendorId.email} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                    {p.vendorId.profile?.phone && (
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
                        <ListItemText primary={p.vendorId.profile.phone} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    )}
                    {p.vendorId.profile?.address && (
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></ListItemIcon>
                        <ListItemText primary={p.vendorId.profile.address} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    )}
                  </List>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{t('proposals.submission')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('proposals.submittedOn', { date: new Date(p.submittedAt).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) })}
                  </Typography>
                  <Button
                    component={MuiLink}
                    href={getPdfUrl(p.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<PdfIcon />}
                    sx={{ mb: 2 }}
                  >
                    {t('proposals.viewProposalPdf')}
                  </Button>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{t('proposals.evaluation')}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label={t('proposals.status')}
                      value={edit.status}
                      onChange={(e) => setRemarkEdits((prev) => ({ ...prev, [p._id]: { ...edit, status: e.target.value } }))}
                      variant="outlined"
                      size="small"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>{t(`proposals.status${s}`)}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label={t('proposals.score')}
                      type="number"
                      fullWidth
                      value={edit.score}
                      onChange={(e) => setRemarkEdits((prev) => ({ ...prev, [p._id]: { ...edit, score: e.target.value } }))}
                      inputProps={{ min: 0, max: 10, step: 0.5 }}
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      label={t('proposals.remarks')}
                      multiline
                      rows={4}
                      fullWidth
                      value={edit.remarks}
                      onChange={(e) => setRemarkEdits((prev) => ({ ...prev, [p._id]: { ...edit, remarks: e.target.value } }))}
                      placeholder={t('proposals.addEvaluationRemarks')}
                      variant="outlined"
                      size="small"
                    />
                    <Button
                      variant="contained"
                      disableElevation
                      disabled={saving === p._id}
                      onClick={() => handleSaveRemarks(p._id)}
                      startIcon={saving === p._id ? <CircularProgress size={16} color="inherit" /> : null}
                      sx={{
                        alignSelf: 'flex-start',
                        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                        '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                      }}
                    >
                      {saving === p._id ? t('proposals.savingEvaluation') : t('proposals.saveEvaluation')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })()}
        </Drawer>
      </Box>
    </DashboardLayout>
  );
}
