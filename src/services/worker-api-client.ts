import axios, { isAxiosError } from "axios";
import { ApiClientError } from "./api-client-error";
import { resolveApiMessage, unwrapApiData } from "./api-envelope";
import { resolveNetworkErrorMessage } from "@/utils/network-error";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface WorkerGetRequestOptions {
  apiBaseUrl: string;
  url: string;
  params?: Record<string, string>;
}

function buildUrl(apiBaseUrl: string, url: string) {
  const base = apiBaseUrl.replace(/\/$/, "");
  return base ? `${base}${url}` : url;
}

export async function workerGet<T>(options: WorkerGetRequestOptions): Promise<T> {
  const { apiBaseUrl, url, params } = options;

  try {
    const response = await axios.get(buildUrl(apiBaseUrl, url), {
      params,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
      },
    });

    return unwrapApiData<T>(response.data, response.status);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (isAxiosError(error)) {
      if (!error.response) {
        throw new ApiClientError(0, resolveNetworkErrorMessage(error, "rest"));
      }

      const status = error.response.status ?? 500;
      const message =
        resolveApiMessage(error.response.data) || error.message || "Request failed";
      throw new ApiClientError(status, message);
    }

    throw error;
  }
}
