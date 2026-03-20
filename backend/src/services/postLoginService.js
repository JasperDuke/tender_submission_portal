const axios = require("axios");

const BASE_URL = (process.env.POST_LOGIN_API_URL || "").replace(/\/$/, "");
const AUTH_TOKEN = process.env.POST_LOGIN_AUTH_TOKEN || "";

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) {
    headers["Authorization"] = AUTH_TOKEN;
  }
  return headers;
}

/**
 * Notify external service when company user logs in.
 * POST {base}/api/post-login/user-login
 * Body: { userId, data: { Authorization: "Bearer token" } }
 */
async function notifyUserLogin(userId, token) {
  if (!BASE_URL) {
    console.log("[postLogin] POST_LOGIN_API_URL not set – skipping user-login");
    return;
  }

  console.log("[postLogin] calling user-login for userId:", userId);
  try {
    const res = await axios.post(
      `${BASE_URL}/api/post-login/user-login`,
      {
        userId: String(userId),
        Authorization: `Bearer ${token}`,
      },
      {
        headers: getHeaders(),
        timeout: 5000,
      },
    );
    console.log("[postLogin] user-login success:", {
      userId,
      status: res.status,
    });
  } catch (err) {
    console.error("[postLogin] user-login failed:", {
      userId,
      status: err.response?.status,
      data: err.response?.data || err.message,
    });
  }
}

/**
 * Notify external service when company user logs out.
 * POST {base}/api/post-login/user-logout
 * Body: { userId }
 */
async function notifyUserLogout(userId) {
  if (!BASE_URL) {
    console.log(
      "[postLogin] POST_LOGIN_API_URL not set – skipping user-logout",
    );
    return;
  }

  console.log("[postLogin] calling user-logout for userId:", userId);
  try {
    const res = await axios.post(
      `${BASE_URL}/api/post-login/user-logout`,
      { userId: String(userId) },
      {
        headers: getHeaders(),
        timeout: 5000,
      },
    );
    console.log("[postLogin] user-logout success:", {
      userId,
      status: res.status,
    });
  } catch (err) {
    console.error("[postLogin] user-logout failed:", {
      userId,
      status: err.response?.status,
      data: err.response?.data || err.message,
    });
  }
}

module.exports = { notifyUserLogin, notifyUserLogout };
