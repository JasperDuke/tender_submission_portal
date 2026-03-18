"use client";

import React, { useState } from "react";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import IntegrationWidget from "@/components/IntegrationWidget";

const DRAWER_WIDTH = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => setMobileOpen((prev) => !prev);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <IntegrationWidget />
      {/* Top App Bar */}
      <Topbar drawerWidth={DRAWER_WIDTH} onMenuToggle={handleMenuToggle} />

      {/* Side Navigation */}
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content Area - full width, centered content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          mt: "64px",
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "80%",
            mx: "auto",
            p: { xs: 2, sm: 3, md: 4 },
            flex: 1,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
