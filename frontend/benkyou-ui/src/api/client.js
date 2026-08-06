import { clearSession, getToken, isTokenExpired } from "../utils/session";

const viteEnv = import.meta.env || {};
const rawApiUrl = viteEnv.VITE_API_URL || "";

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const API_ORIGIN = API_URL.replace(/\/api$/i, "");

export class ApiError extends Error {
  constructor(message, { status, details, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.cause = cause;
  }
}

export function apiUrl(path) {
  if (!API_URL) {
    throw new ApiError("Missing API URL. Set VITE_API_URL in .env.development.");
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponseBody(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function extractErrorMessage(data, status) {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    if (data.message && typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (data.error && typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (data.detail && typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }

    // Handle ASP.NET ModelState errors { errors: { Name: ["Error 1"] } } or { errors: ["Error 1"] }
    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        if (typeof first === "string") return first.trim();
        if (first?.description) return first.description;
      }
      if (typeof data.errors === "object") {
        const msgs = Object.values(data.errors).flat().filter(Boolean);
        if (msgs.length > 0) {
          return msgs.map(m => (typeof m === "string" ? m.trim() : m.description || JSON.stringify(m))).join(" ");
        }
      }
    }

    if (data.title && typeof data.title === "string" && data.title !== "One or more validation errors occurred.") {
      return data.title.trim();
    }
  }

  if (status === 401) return "Session expired or unauthorized. Please log in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested resource was not found.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status >= 500) return "A server error occurred. Please try again or contact support.";

  return `Request failed with status ${status}`;
}

function handleUnauthorized() {
  clearSession();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("benkyou:unauthorized"));
  }
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers,
    auth = true,
    rawBody = false,
    ...requestOptions
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (auth) {
    const token = getToken();

    if (token && isTokenExpired(token)) {
      handleUnauthorized();
      throw new ApiError("Your session has expired. Please sign in again.", { status: 401 });
    }

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const fetchOptions = {
    ...requestOptions,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    if (rawBody) {
      // For FormData — let browser set Content-Type with boundary
      fetchOptions.body = body;
    } else {
      requestHeaders["Content-Type"] = "application/json";
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  let response;
  const url = apiUrl(path);

  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    const msg = isOffline
      ? "You appear to be offline. Please check your internet connection."
      : "Unable to reach the server. Please check your network connection or try again later.";
    throw new ApiError(msg, { cause: error });
  }

  const data = await parseResponseBody(response);

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(data, response.status);
    throw new ApiError(errorMessage, {
      status: response.status,
      details: data,
    });
  }

  return data;
}
