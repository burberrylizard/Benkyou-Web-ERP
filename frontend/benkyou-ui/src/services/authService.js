import { apiRequest } from "../api/client";

export function registerOrganization(payload) {
  return apiRequest("auth/register-org", {
    method: "POST",
    auth: false,
    body: payload,
  });
}

export function login(payload) {
  return apiRequest("auth/login", {
    method: "POST",
    auth: false,
    body: payload,
  });
}

export function verifyLoginOtp(payload) {
  return apiRequest("auth/verify-otp", {
    method: "POST",
    auth: false,
    body: payload,
  });
}

export function superAdminLogin(payload) {
  return apiRequest("auth/superadmin/login", {
    method: "POST",
    auth: false,
    body: payload,
  });
}

export function verifySuperAdminOtp(payload) {
  return apiRequest("auth/superadmin/verify-otp", {
    method: "POST",
    auth: false,
    body: payload,
  });
}

export function getCurrentUser() {
  return apiRequest("auth/me");
}

export function forgotPassword(email) {
  return apiRequest("auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export function resetPassword(email, code, newPassword) {
  return apiRequest("auth/reset-password", {
    method: "POST",
    auth: false,
    body: { email, code, newPassword },
  });
}

export function getActiveOrganizations() {
  return apiRequest("organization/active", {
    auth: false,
  });
}
