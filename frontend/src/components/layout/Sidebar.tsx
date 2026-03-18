"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Assignment as TenderIcon,
  Description as ProposalIcon,
  PersonAdd as PersonAddIcon,
  IntegrationInstructions as IntegrationIcon,
} from "@mui/icons-material";

import { useAuth, UserRole } from "@/context/AuthContext";
import { useThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

// ── Nav items per role ────────────────────────────────────────────────────────

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  siblingPaths?: string[];
}

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  admin: "roles.admin",
  companyUser: "roles.companyUser",
  vendor: "roles.vendor",
};

const ROLE_CHIP_COLORS: Record<UserRole, "error" | "secondary" | "primary"> = {
  admin: "error",
  companyUser: "secondary",
  vendor: "primary",
};

const getNavItems = (role: UserRole): NavItem[] => {
  const profileItem = {
    labelKey: "nav.myProfile",
    path: "/profile",
    icon: <PersonIcon fontSize="small" />,
  };
  if (role === "admin") {
    return [
      {
        labelKey: "nav.overview",
        path: "/dashboard",
        icon: <DashboardIcon fontSize="small" />,
      },
      {
        labelKey: "nav.userManagement",
        path: "/admin/users",
        icon: <PeopleIcon fontSize="small" />,
        siblingPaths: ["/admin/users/create", "/integration"],
      },
      {
        labelKey: "nav.addNewUser",
        path: "/admin/users/create",
        icon: <PersonAddIcon fontSize="small" />,
      },
      {
        labelKey: "nav.allTenders",
        path: "/tenders",
        icon: <TenderIcon fontSize="small" />,
      },
      {
        labelKey: "nav.integration",
        path: "/integration",
        icon: <IntegrationIcon fontSize="small" />,
      },
      profileItem,
    ];
  }
  if (role === "companyUser") {
    return [
      {
        labelKey: "nav.overview",
        path: "/dashboard",
        icon: <DashboardIcon fontSize="small" />,
      },
      {
        labelKey: "nav.tenders",
        path: "/tenders",
        icon: <TenderIcon fontSize="small" />,
      },
      {
        labelKey: "nav.postNewTender",
        path: "/tenders/create",
        icon: <ProposalIcon fontSize="small" />,
      },
      profileItem,
    ];
  }
  return [
    {
      labelKey: "nav.overview",
      path: "/dashboard",
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      labelKey: "nav.activeTenders",
      path: "/tenders",
      icon: <TenderIcon fontSize="small" />,
    },
    {
      labelKey: "nav.mySubmissions",
      path: "/proposals",
      icon: <ProposalIcon fontSize="small" />,
    },
    profileItem,
  ];
};

// ── Sidebar component ─────────────────────────────────────────────────────────

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({
  drawerWidth,
  mobileOpen,
  onClose,
  isMobile,
}: SidebarProps) {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isDark = mode === "dark";

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const displayName =
    user.profile?.displayName ||
    user.profile?.companyName ||
    user.profile?.contactPerson ||
    user.email;

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Brand header ── */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "flex-end",
          gap: 1.5,
          background: isDark
            ? "linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(124,58,237,0.3) 100%)"
            : "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
          borderBottom: "1px solid",
          borderColor: isDark
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.2)",
          flexShrink: 0,
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="/logo-cyan.svg"
          alt="Brillar"
          sx={{ height: 34, width: "auto", objectFit: "contain" }}
        />
      </Box>

      {/* ── User card ── */}
      <Box
        sx={{
          px: 2,
          py: 1.75,
          mx: 1.5,
          my: 1.5,
          borderRadius: "12px",
          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(37,99,235,0.04)",
          border: "1px solid",
          borderColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(37,99,235,0.1)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              fontSize: "0.8rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {displayName[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: "hidden", flex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ lineHeight: 1.3 }}
            >
              {displayName}
            </Typography>
            <Chip
              label={t(ROLE_LABEL_KEYS[user.role])}
              size="small"
              color={ROLE_CHIP_COLORS[user.role]}
              sx={{ height: 17, fontSize: "0.63rem", mt: 0.4, fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, flexShrink: 0 }} />

      {/* ── Navigation ── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, mb: 0.75, display: "block", color: "text.disabled" }}
        >
          {t("nav.navigation")}
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const wouldBeActive =
              pathname === item.path ||
              (item.path !== "/dashboard" &&
                pathname.startsWith(item.path + "/"));
            const excludedBySibling = item.siblingPaths?.some(
              (s) => pathname === s || pathname.startsWith(s + "/"),
            );
            const isActive = wouldBeActive && !excludedBySibling;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    router.push(item.path);
                    if (isMobile) onClose();
                  }}
                  sx={{
                    borderRadius: "10px",
                    py: 0.875,
                    px: 1.5,
                    ...(isActive && {
                      background: isDark
                        ? "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(124,58,237,0.2))"
                        : "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.07))",
                      border: `1.5px solid ${isDark ? "rgba(37,99,235,0.35)" : "rgba(37,99,235,0.2)"}`,
                      "&:hover": {
                        background: isDark
                          ? "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(124,58,237,0.25))"
                          : "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.12))",
                      },
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 30,
                      color: isActive ? "primary.main" : "text.secondary",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "primary.main" : "text.primary",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* ── Footer ── */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          textAlign="center"
        >
          {t("footer.copyright")} · v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
