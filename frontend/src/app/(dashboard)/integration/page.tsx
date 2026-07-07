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

type TriggerKind = "proposal" | "tender" | "awarded";

const TRIGGER_SECTIONS: {
  kind: TriggerKind;
  titleKey: string;
  descKey: string;
  addSuccessKey: string;
  showPublicUrl: boolean;
}[] = [
  {
    kind: "proposal",
    titleKey: "integration.proposalTrigger",
    descKey: "integration.proposalTriggerDesc",
    addSuccessKey: "integration.proposalTriggerAddSuccess",
    showPublicUrl: true,
  },
  {
    kind: "tender",
    titleKey: "integration.tenderTrigger",
    descKey: "integration.tenderTriggerDesc",
    addSuccessKey: "integration.tenderTriggerAddSuccess",
    showPublicUrl: true,
  },
  {
    kind: "awarded",
    titleKey: "integration.awardedTrigger",
    descKey: "integration.awardedTriggerDesc",
    addSuccessKey: "integration.awardedTriggerAddSuccess",
    showPublicUrl: false,
  },
];

function TriggerValueBlock({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
          overflow: "auto",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          wordBreak: "break-all",
          m: 0,
        }}
      >
        {value}
      </Box>
    </Box>
  );
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

  const [triggerConfigs, setTriggerConfigs] = useState<
    Record<TriggerKind, TriggerConfig | null>
  >({
    proposal: null,
    tender: null,
    awarded: null,
  });
  const [triggerForms, setTriggerForms] = useState<
    Record<TriggerKind, { apiUrl: string; token: string; apiPublicUrl: string }>
  >({
    proposal: { apiUrl: "", token: "", apiPublicUrl: "" },
    tender: { apiUrl: "", token: "", apiPublicUrl: "" },
    awarded: { apiUrl: "", token: "", apiPublicUrl: "" },
  });
  const [triggerSubmitting, setTriggerSubmitting] = useState<
    Record<TriggerKind, boolean>
  >({
    proposal: false,
    tender: false,
    awarded: false,
  });

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
      setTriggerConfigs({
        proposal: data.triggerConfig || null,
        tender: data.tenderTriggerConfig || null,
        awarded: data.awardedTriggerConfig || null,
      });
    } catch {
      setTriggerConfigs({ proposal: null, tender: null, awarded: null });
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

  const handleAddTrigger = async (e: React.FormEvent, kind: TriggerKind) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const form = triggerForms[kind];
    setTriggerSubmitting((prev) => ({ ...prev, [kind]: true }));
    try {
      await apiClient.post("/integration/trigger", {
        type: kind,
        apiUrl: form.apiUrl.trim(),
        triggerToken: form.token.trim(),
        apiPublicUrl: form.apiPublicUrl.trim() || undefined,
      });
      const section = TRIGGER_SECTIONS.find((s) => s.kind === kind);
      setSuccess(t(section?.addSuccessKey || "integration.triggerAddSuccess"));
      setTriggerForms((prev) => ({
        ...prev,
        [kind]: { apiUrl: "", token: "", apiPublicUrl: "" },
      }));
      fetchTriggerConfig();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("integration.triggerAddFailed"),
      );
    } finally {
      setTriggerSubmitting((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const handleRemoveTrigger = async (kind: TriggerKind) => {
    setError("");
    setSuccess("");
    setTriggerSubmitting((prev) => ({ ...prev, [kind]: true }));
    try {
      await apiClient.delete(`/integration/trigger?type=${kind}`);
      setSuccess(t("integration.triggerRemoveSuccess"));
      fetchTriggerConfig();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("integration.triggerRemoveFailed"),
      );
    } finally {
      setTriggerSubmitting((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const updateTriggerForm = (
    kind: TriggerKind,
    field: "apiUrl" | "token" | "apiPublicUrl",
    value: string,
  ) => {
    setTriggerForms((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], [field]: value },
    }));
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
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("integration.triggerDesc")}
                        </Typography>

                        {TRIGGER_SECTIONS.map((section) => {
                          const config = triggerConfigs[section.kind];
                          const form = triggerForms[section.kind];
                          const submitting = triggerSubmitting[section.kind];
                          return (
                            <Box key={section.kind}>
                              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {t(section.titleKey)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t(section.descKey)}
                              </Typography>
                              {config ? (
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
                                  <TriggerValueBlock
                                    label={t("integration.apiUrlLabel")}
                                    value={config.apiUrl}
                                    isDark={isDark}
                                  />
                                  <TriggerValueBlock
                                    label={t("integration.triggerTokenLabel")}
                                    value={config.triggerToken}
                                    isDark={isDark}
                                  />
                                  {config.apiPublicUrl && (
                                    <TriggerValueBlock
                                      label={t("integration.apiPublicUrlLabel")}
                                      value={config.apiPublicUrl}
                                      isDark={isDark}
                                    />
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
                                    onClick={() => handleRemoveTrigger(section.kind)}
                                    disabled={submitting || !canManage}
                                  >
                                    {t("integration.remove")}
                                  </Button>
                                </Paper>
                              ) : (
                                <Box
                                  component="form"
                                  onSubmit={(e) => handleAddTrigger(e, section.kind)}
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
                                    value={form.apiUrl}
                                    onChange={(e) =>
                                      updateTriggerForm(section.kind, "apiUrl", e.target.value)
                                    }
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
                                    placeholder={t("integration.triggerTokenPlaceholder")}
                                    value={form.token}
                                    onChange={(e) =>
                                      updateTriggerForm(section.kind, "token", e.target.value)
                                    }
                                    required
                                    fullWidth
                                    autoComplete="off"
                                    sx={{
                                      "& .MuiInputBase-input": {
                                        fontFamily: "monospace",
                                        fontSize: "0.85rem",
                                      },
                                    }}
                                  />
                                  {section.showPublicUrl && (
                                    <TextField
                                      label={t("integration.apiPublicUrlLabel")}
                                      placeholder={t("integration.apiPublicUrlPlaceholder")}
                                      value={form.apiPublicUrl}
                                      onChange={(e) =>
                                        updateTriggerForm(
                                          section.kind,
                                          "apiPublicUrl",
                                          e.target.value,
                                        )
                                      }
                                      fullWidth
                                      helperText={t("integration.apiPublicUrlHelper")}
                                      sx={{
                                        "& .MuiInputBase-input": {
                                          fontFamily: "monospace",
                                          fontSize: "0.85rem",
                                        },
                                      }}
                                    />
                                  )}
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
                                    disabled={
                                      submitting ||
                                      !canManage ||
                                      !form.apiUrl.trim() ||
                                      !form.token.trim()
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
                                    {submitting
                                      ? t("integration.adding")
                                      : t("integration.addTrigger")}
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
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
