import axios from "axios";
import type { ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

let _accessToken: string | null = null;

// Resolved once ApiTokenSync determines the initial session (authenticated or not).
// Prevents API requests from racing ahead of the token on F5 / hard reload.
let _resolveReady!: () => void;
const _sessionReady = new Promise<void>((resolve) => {
  _resolveReady = resolve;
});

export function setApiToken(token: string | null) {
  _accessToken = token;
  _resolveReady(); // no-op after first call — a Promise can only be resolved once
}

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  await _sessionReady;
  if (_accessToken) {
    config.headers["Authorization"] = `Bearer ${_accessToken}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err.response?.data ?? err),
);

export const apiClient = {
  get: <T>(path: string) =>
    instance.get<ApiResponse<T>>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) =>
    instance.post<ApiResponse<T>>(path, body).then((r) => r.data),
  patch: <T>(path: string, body: unknown) =>
    instance.patch<ApiResponse<T>>(path, body).then((r) => r.data),
  delete: <T>(path: string) =>
    instance.delete<ApiResponse<T>>(path).then((r) => r.data),
};
