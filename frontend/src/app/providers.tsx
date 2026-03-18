'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/theme/theme';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeModeProvider, useThemeMode } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

/**
 * Inner wrapper that reads mode from ThemeModeContext and selects the theme.
 * Must be a child of ThemeModeProvider.
 */
function MuiThemeWrapper({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

/**
 * Root providers – order matters:
 * ThemeModeProvider  →  MuiThemeWrapper  →  AuthProvider  →  children
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <MuiThemeWrapper>
          <AuthProvider>{children}</AuthProvider>
        </MuiThemeWrapper>
      </ThemeModeProvider>
    </LanguageProvider>
  );
}
