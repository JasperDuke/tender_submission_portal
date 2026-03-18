'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { FiBriefcase } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const LabelText = ({ children }: { children: string }) => (
  <Typography
    variant="caption"
    fontWeight={600}
    color="text.secondary"
    sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}
  >
    {children}
  </Typography>
);

export default function RegisterPage() {
  const { register, user, isLoading } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    companyDescription: '',
  });

  const isDark = mode === 'dark';

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('common.passwordMismatch'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('common.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, {
        displayName: form.displayName || undefined,
        companyName: form.companyName || undefined,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        companyDescription: form.companyDescription || undefined,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
        bgcolor: isDark ? '#0B1120' : '#F0F4FF',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
          top: '-150px',
          right: '-100px',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          bottom: '-50px',
          left: '-100px',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            bgcolor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Brand header */}
            <Box
              sx={{
                px: 4,
                pt: 4,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.03) 100%)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)',
                  }}
                >
                  <FiBriefcase size={22} color="#2563EB" />
                </Box>
                <Box>
                  <Typography
                    fontWeight={700}
                    letterSpacing="-0.02em"
                    sx={{ fontSize: '1.25rem', color: 'text.primary' }}
                  >
                    Tender Submission Portal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    DemoSourcing
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Form */}
            <Box sx={{ px: 4, py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
                  {t('auth.register.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.register.subtitle')}
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <LabelText>{t('auth.register.email')}</LabelText>
                    <TextField
                      id="reg-email"
                      type="email"
                      required
                      fullWidth
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder="e.g. vendor@company.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <LabelText>{t('auth.register.yourName')}</LabelText>
                    <TextField
                      id="reg-displayName"
                      fullWidth
                      value={form.displayName}
                      onChange={handleChange('displayName')}
                      placeholder="e.g. John Smith"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.password')}</LabelText>
                    <TextField
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      fullWidth
                      value={form.password}
                      onChange={handleChange('password')}
                      helperText="Min 6 characters"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.confirmPassword')}</LabelText>
                    <TextField
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      fullWidth
                      value={form.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end" size="small">
                              {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.companyName')}</LabelText>
                    <TextField
                      id="reg-company"
                      fullWidth
                      value={form.companyName}
                      onChange={handleChange('companyName')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.contactPerson')}</LabelText>
                    <TextField
                      id="reg-contact"
                      fullWidth
                      value={form.contactPerson}
                      onChange={handleChange('contactPerson')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.phone')}</LabelText>
                    <TextField
                      id="reg-phone"
                      fullWidth
                      value={form.phone}
                      onChange={handleChange('phone')}
                      placeholder="e.g. +60 12-345 6789"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LabelText>{t('auth.register.address')}</LabelText>
                    <TextField
                      id="reg-address"
                      fullWidth
                      value={form.address}
                      onChange={handleChange('address')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <LabelText>{t('auth.register.companyDescription')}</LabelText>
                    <TextField
                      id="reg-desc"
                      multiline
                      rows={2}
                      fullWidth
                      value={form.companyDescription}
                      onChange={handleChange('companyDescription')}
                    />
                  </Grid>
                </Grid>

                <Button
                  id="reg-submit"
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)',
                      boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                  ) : (
                    t('auth.register.submit')
                  )}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography color="text.secondary" display="block" textAlign="center" fontSize="0.8rem">
                {t('auth.register.hasAccount')}{' '}
                <Link
                  href="/login"
                  style={{
                    color: '#2563EB',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {t('auth.register.signIn')}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={2}>
          {t('footer.copyright')}
        </Typography>
      </Container>
    </Box>
  );
}
