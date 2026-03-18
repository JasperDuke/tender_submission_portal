'use client';

import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { LightMode as LightIcon, DarkMode as DarkIcon } from '@mui/icons-material';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageDropdown from '@/components/LanguageDropdown';

export default function AuthPageControls() {
  const { mode, toggleMode } = useThemeMode();
  const { t } = useLanguage();
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <LanguageDropdown variant="full" isDark={isDark} />
      <Tooltip title={isDark ? t('theme.light') : t('theme.dark')}>
        <IconButton
          onClick={toggleMode}
          sx={{
            width: 40,
            height: 40,
            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            color: isDark ? '#FBBF24' : '#475569',
            '&:hover': {
              bgcolor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(71,85,105,0.08)',
            },
          }}
          aria-label="Toggle theme"
        >
          {isDark ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
