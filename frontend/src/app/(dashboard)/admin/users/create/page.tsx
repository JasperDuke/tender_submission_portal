'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  MenuItem, Alert, CircularProgress, Divider, Grid,
} from '@mui/material';
import { ArrowBack as BackIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';

/** Admin cannot be created via this form - only one admin exists. */
const ROLE_OPTIONS = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'companyUser', label: 'Company User' },
];

const FIELD_LABEL = 'caption';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', role: 'vendor',
    displayName: '', companyName: '', contactPerson: '', phone: '', address: '', companyDescription: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiClient.post('/admin/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        profile: {
          displayName: form.displayName,
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
          companyDescription: form.companyDescription,
        },
      });
      setSuccess(`Account for "${form.email}" has been created successfully.`);
      setForm({ email: '', password: '', role: 'vendor', displayName: '', companyName: '', contactPerson: '', phone: '', address: '', companyDescription: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const LabelText = ({ children }: { children: string }) => (
    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
      {children}
    </Typography>
  );

  return (
    <DashboardLayout>
      <Box maxWidth={700} mx="auto">
        <Button startIcon={<BackIcon />} onClick={() => router.push('/admin/users')} sx={{ mb: 2.5 }}>
          Back to Users
        </Button>

        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
          Add New User
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a new account for a vendor or company user. Company users manage tenders; vendors browse and submit proposals.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Account credentials */}
              <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 2 }}>
                Account Credentials
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LabelText>Email Address</LabelText>
                  <TextField id="cu-email" placeholder="e.g. ali@syarikat.com.my" type="email" required fullWidth value={form.email} onChange={handleChange('email')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Temporary Password</LabelText>
                  <TextField id="cu-password" type="password" required fullWidth value={form.password} onChange={handleChange('password')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Role</LabelText>
                  <TextField id="cu-role" select required fullWidth value={form.role} onChange={handleChange('role')}>
                    {ROLE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3.5 }} />

              <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 2 }}>
                Organisation Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LabelText>Display Name</LabelText>
                  <TextField id="cu-displayName" placeholder="e.g. John Smith" fullWidth value={form.displayName} onChange={handleChange('displayName')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Company / Organisation Name</LabelText>
                  <TextField id="cu-company" fullWidth value={form.companyName} onChange={handleChange('companyName')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Contact Person Name</LabelText>
                  <TextField id="cu-contact" fullWidth value={form.contactPerson} onChange={handleChange('contactPerson')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Phone Number</LabelText>
                  <TextField id="cu-phone" fullWidth value={form.phone} onChange={handleChange('phone')} placeholder="e.g. +60 12-345 6789" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LabelText>Business Address</LabelText>
                  <TextField id="cu-address" fullWidth value={form.address} onChange={handleChange('address')} />
                </Grid>
                <Grid item xs={12}>
                  <LabelText>Company Description (Optional)</LabelText>
                  <TextField id="cu-desc" multiline rows={3} fullWidth value={form.companyDescription} onChange={handleChange('companyDescription')} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push('/admin/users')}>Cancel</Button>
                <Button
                  id="cu-submit"
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                  }}
                >
                  Create Account
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
