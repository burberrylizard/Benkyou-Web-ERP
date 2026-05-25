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
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
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
    throw new ApiError(
      `Cannot reach the API at ${API_URL}. Check that the backend is running and the browser trusts the HTTPS certificate.`,
      { cause: error }
    );
  }

  const data = await parseResponseBody(response);

  if (response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.title || data?.errors?.[0] || `Request failed with status ${response.status}`,
      {
        status: response.status,
        details: data,
      }
    );
  }

  return data;
}
