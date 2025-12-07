import { betterFetch as betterFetchLib } from "@better-fetch/fetch";
const baseURL = typeof window !== "undefined" ? window.location.origin : "";

export const betterFetch = {
  get: <T = unknown>(url: string, options?: Parameters<typeof betterFetchLib>[1]) => {
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;
    return betterFetchLib<T>(fullUrl, {
      ...options,
      method: "GET",
      credentials: "include",
    } as Parameters<typeof betterFetchLib>[1]);
  },
  post: <T = unknown>(url: string, data?: unknown, options?: Parameters<typeof betterFetchLib>[1]) => {
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;
    return betterFetchLib<T>(fullUrl, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    } as Parameters<typeof betterFetchLib>[1]);
  },
  put: <T = unknown>(url: string, data?: unknown, options?: Parameters<typeof betterFetchLib>[1]) => {
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;
    return betterFetchLib<T>(fullUrl, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    } as Parameters<typeof betterFetchLib>[1]);
  },
  delete: <T = unknown>(url: string, options?: Parameters<typeof betterFetchLib>[1]) => {
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;
    return betterFetchLib<T>(fullUrl, {
      ...options,
      method: "DELETE",
      credentials: "include",
    } as Parameters<typeof betterFetchLib>[1]);
  },
};

export default betterFetch;

