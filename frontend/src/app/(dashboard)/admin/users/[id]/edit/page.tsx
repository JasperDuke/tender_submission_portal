'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  MenuItem, Alert, CircularProgress, Divider, Grid, Switch, FormControlLabel, Tooltip,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'companyUser', label: 'Company User' },
  { value: 'admin', label: 'Admin' },
];

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const router = useRouter();
  const isEditingSelf = id === me?._id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', role: 'vendor', isActive: true, newPassword: '',
    displayName: '', companyName: '', contactPerson: '', phone: '', address: '', companyDescription: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/admin/users/${id}`);
        const u = data.user;
        setForm({
          email: u.email || '',
          role: u.role || 'vendor',
          isActive: u.isActive ?? true,
          newPassword: '',
          displayName: u.profile?.displayName || '',
          companyName: u.profile?.companyName || '',
          contactPerson: u.profile?.contactPerson || '',
          phone: u.profile?.phone || '',
          address: u.profile?.address || '',
          companyDescription: u.profile?.companyDescription || '',
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        profile: {
          displayName: form.displayName,
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
          companyDescription: form.companyDescription,
        },
      };
      if (form.newPassword) payload.newPassword = form.newPassword;

      await apiClient.put(`/admin/users/${id}`, payload);
      setSuccess('User updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box maxWidth={680} mx="auto">
        <Button startIcon={<BackIcon />} onClick={() => router.push('/admin/users')} sx={{ mb: 2 }}>
          Back to Users
        </Button>
        <Typography variant="h4" gutterBottom>Edit User</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Account</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-email" label="Email" type="email" required fullWidth value={form.email} onChange={handleChange('email')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-role" label="Role" select required fullWidth value={form.role} onChange={handleChange('role')}>
                    {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-password" label="New Password (leave blank to keep)" type="password" fullWidth value={form.newPassword} onChange={handleChange('newPassword')} />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title={isEditingSelf ? 'You cannot deactivate your own account' : ''}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.isActive}
                          onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                          color="success"
                          disabled={isEditingSelf}
                        />
                      }
                      label={form.isActive ? 'Active' : 'Inactive'}
                    />
                  </Tooltip>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profile</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-displayName" label="Display Name" fullWidth value={form.displayName} onChange={handleChange('displayName')} placeholder="e.g. John Smith" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-company" label="Company Name" fullWidth value={form.companyName} onChange={handleChange('companyName')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-contact" label="Contact Person" fullWidth value={form.contactPerson} onChange={handleChange('contactPerson')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-phone" label="Phone" fullWidth value={form.phone} onChange={handleChange('phone')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField id="eu-address" label="Address" fullWidth value={form.address} onChange={handleChange('address')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField id="eu-desc" label="Company Description" multiline rows={3} fullWidth value={form.companyDescription} onChange={handleChange('companyDescription')} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push('/admin/users')}>Cancel</Button>
                <Button
                  id="eu-submit"
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
