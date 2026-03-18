"use client";

import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import { ExpandMore as ExpandIcon } from "@mui/icons-material";
import { useLanguage, type Locale } from "@/context/LanguageContext";

const LOCALES: { value: Locale; flag: string; labelKey: string }[] = [
  { value: "en", flag: "/en.png", labelKey: "language.en" },
  { value: "ms", flag: "/ms.png", labelKey: "language.ms" },
];

interface LanguageDropdownProps {
  variant?: "compact" | "full";
  isDark?: boolean;
}

export default function LanguageDropdown({
  variant = "full",
  isDark = false,
}: LanguageDropdownProps) {
  const { locale, setLocale, t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (l: Locale) => {
    setLocale(l);
    handleClose();
  };

  const shortLabel = current.value === "en" ? "EN" : "MS";

  return (
    <>
      <Button
        onClick={handleOpen}
        size="small"
        sx={{
          minWidth: variant === "compact" ? 44 : 100,
          height: 36,
          px: 1.25,
          borderRadius: 10,
          // bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          color: "text.primary",
          textTransform: "none",
          fontSize: "0.8125rem",
          fontWeight: 500,
          // "&:hover": {
          //   bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
          // },
        }}
      >
        <Box
          component="img"
          src={current.flag}
          alt={current.value}
          sx={{ width: 20, height: 14, objectFit: "cover", mr: 0.5 }}
        />
        {variant === "full" && (
          <>
            <Box component="span">{shortLabel}</Box>
            <ExpandIcon sx={{ fontSize: 16, ml: 0.25, opacity: 0.7 }} />
          </>
        )}
        {variant === "compact" && <ExpandIcon sx={{ fontSize: 16 }} />}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.25,
              minWidth: 100,
              borderRadius: 1.5,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        {LOCALES.map((l) => (
          <MenuItem
            key={l.value}
            selected={locale === l.value}
            onClick={() => handleSelect(l.value)}
            sx={{ py: 1.25, fontSize: "0.875rem" }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box
                component="img"
                src={l.flag}
                alt={l.value}
                sx={{ width: 22, height: 15, objectFit: "cover" }}
              />
            </ListItemIcon>
            <ListItemText
              primary={t(l.labelKey)}
              primaryTypographyProps={{ fontSize: "0.875rem" }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
