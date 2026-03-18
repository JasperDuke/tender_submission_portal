import { createTheme, ThemeOptions } from '@mui/material/styles';

// ── Shared design tokens ───────────────────────────────────────────────────────
const fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const shape = { borderRadius: 12 };

const typography: ThemeOptions['typography'] = {
  fontFamily,
  h1: { fontWeight: 800, fontSize: '2.25rem', letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.015em' },
  h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em' },
  h4: { fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' },
  h5: { fontWeight: 600, fontSize: '1.125rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  subtitle1: { fontWeight: 500, fontSize: '0.9375rem' },
  subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
  body1: { fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.65 },
  body2: { fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.6 },
  caption: { fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.5 },
  button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  overline: { textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.6875rem' },
};

// ── Brand colours (shared) ────────────────────────────────────────────────────
const primary = {
  main: '#2563EB',
  light: '#60A5FA',
  dark: '#1D4ED8',
  contrastText: '#FFFFFF',
};

const secondary = {
  main: '#7C3AED',
  light: '#A78BFA',
  dark: '#5B21B6',
  contrastText: '#FFFFFF',
};

// ── Component overrides factory ───────────────────────────────────────────────
const getComponents = (mode: 'light' | 'dark'): ThemeOptions['components'] => {
  const isDark = mode === 'dark';
  return {
    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}; }
        ::selection { background: rgba(37,99,235,0.2); }
        html { scroll-behavior: smooth; }
      `,
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 22px',
          fontSize: '0.875rem',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: isDark
              ? '0 4px 16px rgba(37,99,235,0.4)'
              : '0 4px 14px rgba(37,99,235,0.35)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          backgroundImage: 'none',
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          transition: 'background 0.2s ease',
          '&:hover': {
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'box-shadow 0.2s ease',
          '&.Mui-focused': {
            boxShadow: isDark
              ? '0 0 0 3px rgba(37,99,235,0.25)'
              : '0 0 0 3px rgba(37,99,235,0.12)',
          },
        },
        notchedOutline: {
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
          transition: 'border-color 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
            padding: '10px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background 0.15s ease',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
          fontSize: '0.875rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation3: {
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5)'
            : '0 4px 24px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.875rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          padding: '5px 10px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 7 },
        thumb: {
          width: 18,
          height: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        },
        track: { borderRadius: 10 },
      },
    },
  };
};

// ── Light theme ───────────────────────────────────────────────────────────────
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary,
    secondary,
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    info: { main: '#3B82F6' },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: 'rgba(0,0,0,0.07)',
  },
  typography,
  shape,
  components: getComponents('light'),
});

// ── Dark theme ────────────────────────────────────────────────────────────────
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary,
    secondary,
    error: { main: '#F87171' },
    warning: { main: '#FBBF24' },
    success: { main: '#34D399' },
    info: { main: '#60A5FA' },
    background: {
      default: '#0B1120',
      paper: '#111827',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      disabled: '#475569',
    },
    divider: 'rgba(255,255,255,0.07)',
    action: {
      hover: 'rgba(255,255,255,0.04)',
      selected: 'rgba(255,255,255,0.08)',
      focus: 'rgba(255,255,255,0.1)',
    },
  },
  typography,
  shape,
  components: getComponents('dark'),
});
