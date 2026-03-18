"use client";

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import {
  People as PeopleIcon,
  Assignment as TenderIcon,
  Description as ProposalIcon,
  TrendingUp as StatsIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { FiBriefcase } from "react-icons/fi";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface QuickCard {
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  path: string;
  accent: string;
}

const ROLE_LABEL_KEYS: Record<string, string> = {
  admin: "roles.admin",
  companyUser: "roles.companyUser",
  vendor: "roles.vendor",
};

const ROLE_CHIP_COLORS: Record<string, "error" | "secondary" | "primary"> = {
  admin: "error",
  companyUser: "secondary",
  vendor: "primary",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const router = useRouter();
  const isDark = mode === "dark";

  const adminCards: QuickCard[] = [
    {
      titleKey: "dashboard.userManagement",
      descKey: "dashboard.userManagementDesc",
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      path: "/admin/users",
      accent: "#2563EB",
    },
    {
      titleKey: "dashboard.allTenders",
      descKey: "dashboard.allTendersDesc",
      icon: <TenderIcon sx={{ fontSize: 28 }} />,
      path: "/tenders",
      accent: "#7C3AED",
    },
  ];

  const companyCards: QuickCard[] = [
    {
      titleKey: "dashboard.tenders",
      descKey: "dashboard.tendersDesc",
      icon: <TenderIcon sx={{ fontSize: 28 }} />,
      path: "/tenders",
      accent: "#2563EB",
    },
    {
      titleKey: "dashboard.postNewTender",
      descKey: "dashboard.postNewTenderDesc",
      icon: <StatsIcon sx={{ fontSize: 28 }} />,
      path: "/tenders/create",
      accent: "#10B981",
    },
  ];

  const vendorCards: QuickCard[] = [
    {
      titleKey: "dashboard.activeTenders",
      descKey: "dashboard.activeTendersDesc",
      icon: <TenderIcon sx={{ fontSize: 28 }} />,
      path: "/tenders",
      accent: "#2563EB",
    },
    {
      titleKey: "dashboard.mySubmissions",
      descKey: "dashboard.mySubmissionsDesc",
      icon: <ProposalIcon sx={{ fontSize: 28 }} />,
      path: "/proposals",
      accent: "#7C3AED",
    },
  ];

  const cards =
    user?.role === "admin"
      ? adminCards
      : user?.role === "companyUser"
        ? companyCards
        : vendorCards;

  const displayName =
    user?.profile?.displayName ||
    user?.profile?.companyName ||
    user?.profile?.contactPerson ||
    user?.email ||
    "";

  return (
    <DashboardLayout>
      <Box sx={{ width: "100%" }}>
        {/* ── Welcome banner ── */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
            background: isDark
              ? "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.15) 100%)"
              : "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            border: "1px solid",
            borderColor: isDark
              ? "rgba(37,99,235,0.25)"
              : "rgba(255,255,255,0.2)",
            boxShadow: isDark ? "none" : "0 4px 20px rgba(37,99,235,0.2)",
          }}
        >
          {/* Decorative orb */}
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.05)",
              top: -100,
              right: -80,
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 1.25,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex",
                flexShrink: 0,
              }}
            >
              <FiBriefcase size={24} color="#fff" />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                color="#fff"
                letterSpacing="-0.02em"
                gutterBottom
              >
                {displayName
                  ? t("dashboard.welcomeBackName", { name: displayName.split(" ")[0] })
                  : t("dashboard.welcomeBack")}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={t(ROLE_LABEL_KEYS[user?.role || ""] || "roles.vendor")}
                  size="small"
                  color={ROLE_CHIP_COLORS[user?.role || ""] || "default"}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Quick access ── */}
        <Box
          sx={{
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.01em">
            {t("dashboard.quickAccess")}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} key={card.path}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: isDark
                      ? "0 8px 24px rgba(0,0,0,0.3)"
                      : "0 8px 24px rgba(0,0,0,0.08)",
                    borderColor: isDark
                      ? "rgba(37,99,235,0.3)"
                      : "rgba(37,99,235,0.2)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(card.path)}
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: card.accent + (isDark ? "22" : "12"),
                      color: card.accent,
                      mb: 2.5,
                      transition: "background 0.2s ease",
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    letterSpacing="-0.01em"
                    gutterBottom
                  >
                    {t(card.titleKey)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flex: 1 }}
                  >
                    {t(card.descKey)}
                  </Typography>
                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {t("common.open")}
                    </Typography>
                    <ArrowIcon sx={{ fontSize: 14, color: "primary.main" }} />
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
