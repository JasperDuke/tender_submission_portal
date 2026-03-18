'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Chip, IconButton, TextField, MenuItem,
  InputAdornment, Pagination, Tooltip, CircularProgress, Alert, Avatar,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
  Block as BlockIcon, CheckCircle as ActivateIcon, People as PeopleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'companyUser', label: 'Company User' },
  { value: 'vendor', label: 'Vendor' },
];

const ROLE_COLORS: Record<string, 'error' | 'secondary' | 'primary'> = {
  admin: 'error', companyUser: 'secondary', vendor: 'primary',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', companyUser: 'Company User', vendor: 'Vendor',
};

interface User {
  _id: string;
  email: string;
  role: string;
  isActive: boolean;
  profile: { displayName?: string; companyName?: string; contactPerson?: string };
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await apiClient.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const endpoint = isActive
        ? `/admin/users/${userId}/deactivate`
        : `/admin/users/${userId}/activate`;
      await apiClient.patch(endpoint);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  if (me?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Alert severity="error">Access denied. This page is for administrators only.</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <PeopleIcon color="primary" />
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                User Management
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {total} user account{total !== 1 ? 's' : ''} in the system
            </Typography>
          </Box>
          <Button
            id="create-user-btn"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/admin/users/create')}
            sx={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
            }}
          >
            Add User
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Filters ── */}
        <Card elevation={0} sx={{ p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            id="user-search"
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="role-filter"
            select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            label="Filter by Role"
            sx={{ minWidth: 170 }}
          >
            {ROLE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Card>

        {/* ── Table ── */}
        <Card elevation={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No users found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.map((u) => {
                  const displayName = u.profile?.displayName || u.profile?.companyName || u.profile?.contactPerson;
                  return (
                    <TableRow key={u._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {(displayName || u.email)[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            {displayName && (
                              <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ROLE_LABELS[u.role] || u.role}
                          size="small"
                          color={ROLE_COLORS[u.role] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={u.isActive ? 'success' : 'default'}
                          variant={u.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(u.createdAt).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit user">
                          <IconButton size="small" onClick={() => router.push(`/admin/users/${u._id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            u._id === me?._id
                              ? 'You cannot deactivate your own account'
                              : u.isActive
                                ? 'Deactivate account'
                                : 'Activate account'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color={u.isActive ? 'error' : 'success'}
                              disabled={u._id === me?._id && u.isActive}
                              onClick={() => handleToggleActive(u._id, u.isActive)}
                            >
                              {u.isActive
                                ? <BlockIcon fontSize="small" />
                                : <ActivateIcon fontSize="small" />}
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

          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
              <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </Card>
      </Box>
    </DashboardLayout>
  );
}
