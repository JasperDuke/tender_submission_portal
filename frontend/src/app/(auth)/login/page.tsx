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
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { FiBriefcase } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isDark = mode === 'dark';

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Log in failed. Please try again.',
      );
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

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
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
                pt: 5,
                pb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.03) 100%)',
              }}
            >
              <Typography
                fontWeight={700}
                letterSpacing="-0.04em"
                lineHeight={1.1}
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Tender Submission Portal
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                DemoSourcing
              </Typography>
            </Box>

            {/* Form area */}
            <Box sx={{ px: 4, pt: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
                  {t('auth.login.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.login.subtitle')}
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    {t('auth.login.email').toUpperCase()}
                  </Typography>
                  <TextField
                    id="login-email"
                    placeholder="e.g. admin@demo.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    autoFocus
                    autoComplete="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    {t('auth.login.password').toUpperCase()}
                  </Typography>
                  <TextField
                    id="login-password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((s) => !s)}
                            edge="end"
                            size="small"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button
                  id="login-submit"
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !email || !password}
                  sx={{
                    py: 1.5,
                    fontSize: '0.9375rem',
                    background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)',
                      boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                    },
                    '&:disabled': {
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                  ) : (
                    t('auth.login.submit')
                  )}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography color="text.secondary" display="block" textAlign="center" fontSize="0.8rem">
                {t('auth.login.noAccount')}{' '}
                <Link
                  href="/register"
                  style={{
                    color: '#2563EB',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {t('auth.login.registerAsVendor')}
                </Link>
                <br />
                <Typography component="span" variant="caption" color="text.disabled">
                  {t('auth.login.registerHint')}
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
          display="block"
          textAlign="center"
          mt={2.5}
        >
          {t('footer.copyright')} · DemoSourcing
        </Typography>
      </Container>
    </Box>
  );
}
