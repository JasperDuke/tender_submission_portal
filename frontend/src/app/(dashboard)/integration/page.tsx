"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Business as CompanyIcon,
  Person as VendorIcon,
  FlashOn as TriggerIcon,
} from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/apiClient";
import { useThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Integration {
  _id: string;
  type: string;
  script: string;
  token?: string;
}

interface TriggerConfig {
  _id: string;
  apiUrl: string;
  triggerToken: string;
  apiPublicUrl?: string;
}

const WIDGET_TAB_TYPES = [
  {
    value: "admin",
    labelKey: "roles.admin",
    icon: <AdminIcon fontSize="small" />,
  },
  {
    value: "companyUser",
    labelKey: "roles.companyUser",
    icon: <CompanyIcon fontSize="small" />,
  },
  {
    value: "vendor",
    labelKey: "roles.vendor",
    icon: <VendorIcon fontSize="small" />,
  },
];

const TAB_TYPES = [
  ...WIDGET_TAB_TYPES,
  {
    value: "trigger",
    labelKey: "integration.trigger",
    icon: <TriggerIcon fontSize="small" />,
  },
];

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function IntegrationPage() {
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isDark = mode === "dark";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [script, setScript] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig | null>(
    null,
  );
  const [triggerApiUrl, setTriggerApiUrl] = useState("");
  const [triggerToken, setTriggerToken] = useState("");
  const [triggerApiPublicUrl, setTriggerApiPublicUrl] = useState("");
  const [triggerSubmitting, setTriggerSubmitting] = useState(false);

  const canManage = user?.role === "admin";

  const fetchIntegrations = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get("/integration");
      setIntegrations(data.integrations || []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  const fetchTriggerConfig = useCallback(async () => {
    if (!canManage) return;
    try {
      const { data } = await apiClient.get("/integration/trigger");
      setTriggerConfig(data.triggerConfig || null);
    } catch {
      setTriggerConfig(null);
    }
  }, [canManage]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  useEffect(() => {
    fetchTriggerConfig();
  }, [fetchTriggerConfig]);

  const currentType = TAB_TYPES[activeTab]?.value;
  const isTriggerTab = currentType === "trigger";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await apiClient.post("/integration", {
        type: currentType,
        script: script.trim(),
        token: token.trim(),
      });
      setSuccess(t("integration.addSuccess"));
      setScript("");
      setToken("");
      fetchIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("integration.addFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setTriggerSubmitting(true);
    try {
      await apiClient.post("/integration/trigger", {
        apiUrl: triggerApiUrl.trim(),
        triggerToken: triggerToken.trim(),
        apiPublicUrl: triggerApiPublicUrl.trim() || undefined,
      });
      setSuccess(t("integration.triggerAddSuccess"));
      setTriggerApiUrl("");
      setTriggerToken("");
      setTriggerApiPublicUrl("");
      fetchTriggerConfig();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("integration.triggerAddFailed"),
      );
    } finally {
      setTriggerSubmitting(false);
    }
  };

  const handleRemoveTrigger = async () => {
    setError("");
    setSuccess("");
    setTriggerSubmitting(true);
    try {
      await apiClient.delete("/integration/trigger");
      setSuccess(t("integration.triggerRemoveSuccess"));
      fetchTriggerConfig();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("integration.triggerRemoveFailed"),
      );
    } finally {
      setTriggerSubmitting(false);
    }
  };

  const handleRemove = async (type: string) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await apiClient.delete(`/integration/${type}`);
      setSuccess(t("integration.removeSuccess"));
      setScript("");
      setToken("");
      fetchIntegrations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("integration.removeFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            letterSpacing="-0.02em"
            gutterBottom
          >
            {t("integration.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("integration.subtitle")}
          </Typography>
          {!user && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t("integration.loginToManage")}{" "}
              <Link href="/login" style={{ fontWeight: 600 }}>
                {t("auth.login.submit")}
              </Link>
            </Alert>
          )}
          {user && !canManage && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t("integration.adminOnly")}
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            }}
          >
            {TAB_TYPES.map((tab) => (
              <Tab
                key={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={t(tab.labelKey)}
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress aria-label={t("common.loading")} />
              </Box>
            ) : (
              <>
                {TAB_TYPES.map((tab, index) => (
                  <TabPanel key={tab.value} value={activeTab} index={index}>
                    {tab.value === "trigger" ? (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {t("integration.triggerDesc")}
                        </Typography>
                        {triggerConfig ? (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.02)"
                                : "rgba(0,0,0,0.02)",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              {t("integration.apiUrlLabel")}
                            </Typography>
                            <Box
                              component="pre"
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: isDark
                                  ? "rgba(0,0,0,0.3)"
                                  : "rgba(0,0,0,0.05)",
                                overflow: "auto",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                              }}
                            >
                              {triggerConfig.apiUrl}
                            </Box>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={
                                triggerSubmitting ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <DeleteIcon />
                                )
                              }
                              onClick={handleRemoveTrigger}
                              disabled={triggerSubmitting || !canManage}
                              sx={{ mt: 2 }}
                            >
                              {t("integration.remove")}
                            </Button>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {t("integration.afterRemove")}
                            </Typography>
                          </Paper>
                        ) : (
                          <Box
                            component="form"
                            onSubmit={handleAddTrigger}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                              maxWidth: 640,
                            }}
                          >
                            <TextField
                              label={t("integration.apiUrlLabel")}
                              placeholder={t("integration.apiUrlPlaceholder")}
                              value={triggerApiUrl}
                              onChange={(e) => setTriggerApiUrl(e.target.value)}
                              required
                              fullWidth
                              sx={{
                                "& .MuiInputBase-input": {
                                  fontFamily: "monospace",
                                  fontSize: "0.85rem",
                                },
                              }}
                            />
                            <TextField
                              label={t("integration.triggerTokenLabel")}
                              placeholder={t(
                                "integration.triggerTokenPlaceholder",
                              )}
                              value={triggerToken}
                              onChange={(e) => setTriggerToken(e.target.value)}
                              required
                              fullWidth
                              type="password"
                              autoComplete="off"
                              sx={{
                                "& .MuiInputBase-input": {
                                  fontFamily: "monospace",
                                  fontSize: "0.85rem",
                                },
                              }}
                            />
                            <Button
                              type="submit"
                              variant="contained"
                              startIcon={
                                triggerSubmitting ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <AddIcon />
                                )
                              }
                              disabled={
                                triggerSubmitting ||
                                !canManage ||
                                !triggerApiUrl.trim() ||
                                !triggerToken.trim()
                              }
                              sx={{
                                alignSelf: "flex-start",
                                background:
                                  "linear-gradient(135deg, #2563EB, #7C3AED)",
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #1D4ED8, #6D28D9)",
                                },
                              }}
                            >
                              {triggerSubmitting
                                ? t("integration.adding")
                                : t("integration.addTrigger")}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ) : integrations.find((i) => i.type === tab.value) ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {t("integration.widgetScript")}
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: isDark
                              ? "rgba(0,0,0,0.3)"
                              : "rgba(0,0,0,0.05)",
                            overflow: "auto",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            maxHeight: 200,
                          }}
                        >
                          {
                            integrations.find((i) => i.type === tab.value)
                              ?.script
                          }
                        </Box>
                        {integrations.find((i) => i.type === tab.value)
                          ?.token && (
                          <>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                              sx={{ mt: 2 }}
                            >
                              {t("integration.accessToken")}
                            </Typography>
                            <Box
                              component="pre"
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: isDark
                                  ? "rgba(0,0,0,0.3)"
                                  : "rgba(0,0,0,0.05)",
                                overflow: "auto",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                              }}
                            >
                              {
                                integrations.find((i) => i.type === tab.value)
                                  ?.token
                              }
                            </Box>
                          </>
                        )}
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={
                            submitting ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteIcon />
                            )
                          }
                          onClick={() => handleRemove(tab.value)}
                          disabled={submitting || !canManage}
                          sx={{ mt: 2 }}
                        >
                          {t("integration.remove")}
                        </Button>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {t("integration.afterRemove")}
                        </Typography>
                      </Paper>
                    ) : (
                      <Box
                        component="form"
                        onSubmit={handleAdd}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.5,
                          maxWidth: 640,
                        }}
                      >
                        <TextField
                          label={t("integration.widgetScriptLabel")}
                          placeholder={t("integration.widgetScriptPlaceholder")}
                          multiline
                          rows={5}
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          sx={{
                            "& .MuiInputBase-input": {
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                            },
                          }}
                          helperText={t("integration.widgetScriptHelper")}
                        />
                        <TextField
                          label={t("integration.accessTokenLabel")}
                          placeholder={t("integration.accessTokenPlaceholder")}
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          type="password"
                          autoComplete="off"
                          sx={{
                            "& .MuiInputBase-input": {
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                            },
                          }}
                          helperText={t("integration.accessTokenHelper")}
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={
                            submitting ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <AddIcon />
                            )
                          }
                          disabled={submitting || !canManage}
                          sx={{
                            alignSelf: "flex-start",
                            background:
                              "linear-gradient(135deg, #2563EB, #7C3AED)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #1D4ED8, #6D28D9)",
                            },
                          }}
                        >
                          {submitting
                            ? t("integration.adding")
                            : t("integration.addIntegration")}
                        </Button>
                      </Box>
                    )}
                  </TabPanel>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
