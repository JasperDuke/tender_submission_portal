'use client';

import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem,
  Divider, Tooltip, ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  Lock as LockIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageDropdown from '@/components/LanguageDropdown';

interface TopbarProps {
  drawerWidth: number;
  onMenuToggle: () => void;
}

export default function Topbar({ drawerWidth, onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { t } = useLanguage();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    router.push('/login');
  };

  const displayName = user?.profile?.displayName || user?.profile?.companyName || user?.profile?.contactPerson || user?.email || 'User';
  const initials = displayName[0].toUpperCase();
  const isDark = mode === 'dark';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, height: 64 }}>
        {/* Mobile hamburger */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </IconButton>

        {/* Portal title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ letterSpacing: '-0.01em', color: 'text.primary' }}
          >
            {t('app.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {t('app.brand')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageDropdown variant="full" isDark={isDark} />
          <Tooltip title={isDark ? t('theme.light') : t('theme.dark')}>
            <IconButton
              id="toggle-theme-btn"
              onClick={toggleMode}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: isDark ? '#FBBF24' : '#64748B',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
              }}
            >
              {isDark ? <LightIcon sx={{ fontSize: 20 }} /> : <DarkIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Display name (desktop) */}
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', mr: 0.5 }}
          >
            {displayName}
          </Typography>

          {/* Avatar dropdown */}
          <Tooltip title={t('nav.accountSettings')}>
            <IconButton
              id="account-menu-btn"
              onClick={handleMenuOpen}
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.5,
                minWidth: 200,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: -5,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transform: 'rotate(45deg)',
                  borderBottom: 'none',
                  borderRight: 'none',
                },
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => { handleMenuClose(); router.push('/profile'); }}
            dense
            sx={{ py: 1, my: 0.25 }}
          >
            <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
            {t('nav.myProfile')}
          </MenuItem>
          <MenuItem
            onClick={() => { handleMenuClose(); router.push('/profile?tab=password'); }}
            dense
            sx={{ py: 1, my: 0.25 }}
          >
            <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
            {t('nav.changePassword')}
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleLogout}
            dense
            sx={{ py: 1, my: 0.25, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            {t('nav.logOut')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
