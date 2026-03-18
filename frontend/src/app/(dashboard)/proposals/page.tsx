'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Button, IconButton, Alert, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Tooltip, Link as MuiLink, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon, Edit as EditIcon, Delete as DeleteIcon, Inbox as InboxIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'> = {
  Pending: 'default', Reviewed: 'info', Accepted: 'success', Rejected: 'error', Shortlisted: 'primary',
};

interface Proposal {
  _id: string;
  tenderId: { _id: string; title: string; deadline: string; status: string };
  filePath: string;
  originalFileName?: string;
  status: string;
  remarks?: string;
  score?: number;
  submittedAt: string;
}

export default function MyProposalsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/proposals/my');
      setProposals(data.proposals);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('proposals.loadMyError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/proposals/${deleteId}`);
      setDeleteId(null);
      fetchProposals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('proposals.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const getPdfUrl = (filePath: string) => {
    const filename = filePath.replace(/\\/g, '/').split('/').pop();
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${filename}`;
  };

  if (user?.role !== 'vendor') {
    return <DashboardLayout><Alert severity="error">{t('proposals.vendorOnlyAccess')}</Alert></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <Box>
        {/* ── Header ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">{t('proposals.title')}</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {proposals.length === 1 ? t('proposals.proposalsCount', { count: proposals.length }) : t('proposals.proposalsCountPlural', { count: proposals.length })}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

        <Card elevation={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('proposals.tender')}</TableCell>
                  <TableCell>{t('proposals.submissionDeadline')}</TableCell>
                  <TableCell>{t('proposals.dateSubmitted')}</TableCell>
                  <TableCell>{t('proposals.status')}</TableCell>
                  <TableCell>{t('proposals.scoreColumn')}</TableCell>
                  <TableCell>{t('proposals.remarks')}</TableCell>
                  <TableCell align="right">{t('proposals.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <InboxIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
                      <Typography variant="h6" color="text.secondary" fontWeight={500} gutterBottom>
                        {t('proposals.noProposals')}
                      </Typography>
                      <Typography variant="body2" color="text.disabled" gutterBottom>
                        {t('proposals.browseTendersHint')}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => router.push('/tenders')}
                        sx={{
                          mt: 1.5,
                          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                          '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                        }}
                      >
                        {t('proposals.browseActiveTenders')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : proposals.map((p) => {
                  const isEvaluated = ['Accepted', 'Rejected'].includes(p.status);
                  const isAccepted = p.status === 'Accepted';
                  const isRejected = p.status === 'Rejected';
                  return (
                    <TableRow
                      key={p._id}
                      hover
                      sx={{
                        ...(isAccepted && {
                          borderLeft: '4px solid',
                          borderLeftColor: 'success.main',
                          bgcolor: 'action.hover',
                        }),
                        ...(isRejected && {
                          borderLeft: '4px solid',
                          borderLeftColor: 'error.main',
                          bgcolor: 'action.hover',
                        }),
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="primary.main"
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => router.push(`/tenders/${p.tenderId._id}`)}
                        >
                          {p.tenderId.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(p.tenderId.deadline).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(p.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            p.status === 'Accepted'
                              ? t('proposals.statusAccepted')
                              : p.status === 'Rejected'
                                ? t('proposals.notAccepted')
                                : ['Pending', 'Reviewed', 'Shortlisted'].includes(p.status)
                                  ? t(`proposals.status${p.status}`)
                                  : p.status
                          }
                          size="small"
                          color={STATUS_COLORS[p.status] || 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={p.score !== undefined ? 600 : 400} color={p.score !== undefined ? 'text.primary' : 'text.disabled'}>
                          {p.score !== undefined ? `${p.score} / 10` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 200 }}>
                          {p.remarks || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('proposals.viewPdf')}>
                          <IconButton size="small" component={MuiLink} href={getPdfUrl(p.filePath)} target="_blank" rel="noopener noreferrer">
                            <PdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={isEvaluated ? t('proposals.cannotEditEvaluated') : t('proposals.replaceDocument')}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={isEvaluated}
                              onClick={() => router.push(`/tenders/${p.tenderId._id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={isEvaluated ? t('proposals.cannotDeleteEvaluated') : t('proposals.withdrawSubmission')}>
                          <span>
                            <IconButton size="small" color="error" disabled={isEvaluated} onClick={() => setDeleteId(p._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Withdraw confirmation */}
        <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
          <DialogTitle fontWeight={700}>{t('proposals.withdrawTitle')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('proposals.withdrawConfirm')}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteId(null)} variant="outlined">{t('common.cancel')}</Button>
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} disableElevation>
              {deleting ? <CircularProgress size={16} color="inherit" /> : t('proposals.withdraw')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
