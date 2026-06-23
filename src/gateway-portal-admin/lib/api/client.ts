import axios from "axios";

import { env } from "@/lib/config/env";

export const apiClient = axios.create({
  baseURL: env.gatewayBaseUrl || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gateway-portal-session");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
