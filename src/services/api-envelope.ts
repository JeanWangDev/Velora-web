import { ApiClientError } from "./api-client-error";

export interface IApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  message?: string;
  data: T;
  success?: boolean;
  timestamp?: number;
  details?: unknown;
}

export function resolveApiMessage(payload?: Partial<IApiResponse>) {
  return payload?.message ?? payload?.msg ?? "Request failed";
}

export function isApiEnvelope<T>(payload: unknown): payload is IApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    ("success" in payload ||
      "code" in payload ||
      "message" in payload ||
      "msg" in payload)
  );
}

export function unwrapApiData<T>(payload: unknown, status = 500): T {
  if (!isApiEnvelope<T>(payload)) {
    return payload as T;
  }

  if (payload.success === false) {
    throw new ApiClientError(status, resolveApiMessage(payload));
  }

  if (typeof payload.code === "number" && payload.code !== 200) {
    throw new ApiClientError(payload.code, resolveApiMessage(payload));
  }

  return payload.data;
}
