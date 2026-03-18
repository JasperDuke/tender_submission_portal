'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField, Button, Tabs, Tab,
  Alert, CircularProgress, Divider, InputAdornment, Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { UserProfile } from '@/context/AuthContext';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function ProfilePageContent() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.profile) {
      setProfile({
        displayName: user.profile.displayName || '',
        companyName: user.profile.companyName || '',
        contactPerson: user.profile.contactPerson || '',
        phone: user.profile.phone || '',
        address: user.profile.address || '',
        companyDescription: user.profile.companyDescription || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('tab') === 'password') setActiveTab(1);
  }, [searchParams]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await apiClient.patch('/auth/profile', { profile });
      await refreshUser();
      setProfileSuccess(t('profile.profileUpdated'));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await apiClient.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(t('profile.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  const displayName = user.profile?.displayName || user.profile?.companyName || user.profile?.contactPerson || user.email || 'User';

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
            {t('profile.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('profile.subtitle')}
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab icon={<PersonIcon />} iconPosition="start" label={t('profile.profileTab')} />
              <Tab icon={<LockIcon />} iconPosition="start" label={t('profile.changePassword')} />
            </Tabs>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  {displayName[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                </Box>
              </Box>
              {profileSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess('')}>{profileSuccess}</Alert>}
              {profileError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError('')}>{profileError}</Alert>}
              <form onSubmit={handleProfileSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 480 }}>
                  <TextField
                    label={t('profile.yourName')}
                    placeholder="e.g. John Smith"
                    value={profile.displayName || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  />
                  <TextField
                    label={t('profile.companyName')}
                    value={profile.companyName || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                  />
                  <TextField
                    label={t('profile.contactPerson')}
                    value={profile.contactPerson || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, contactPerson: e.target.value }))}
                  />
                  <TextField
                    label={t('profile.phone')}
                    value={profile.phone || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <TextField
                    label={t('profile.address')}
                    value={profile.address || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    multiline
                    rows={2}
                  />
                  <TextField
                    label={t('profile.companyDescription')}
                    value={profile.companyDescription || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, companyDescription: e.target.value }))}
                    multiline
                    rows={3}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={profileLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    disabled={profileLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                    }}
                  >
                    {profileLoading ? t('profile.saving') : t('profile.saveProfile')}
                  </Button>
                </Box>
              </form>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}
              {passwordError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>{passwordError}</Alert>}
              <form onSubmit={handlePasswordSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 480 }}>
                  <TextField
                    label={t('profile.currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label={t('profile.newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    helperText={t('profile.minChars')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label={t('profile.confirmPassword')}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={passwordLoading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                    disabled={passwordLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
                    }}
                  >
                    {passwordLoading ? t('profile.updating') : t('profile.changePassword')}
                  </Button>
                </Box>
              </form>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
