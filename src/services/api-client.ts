import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
  type Method,
} from "axios";
import { toast } from "@/services/toast";
import { getApiBaseUrl } from "@/config/api";
import {
  type IApiResponse,
  isApiEnvelope,
  resolveApiMessage,
} from "@/services/api-envelope";
import { ApiClientError } from "@/services/api-client-error";
import { resolveNetworkErrorMessage } from "@/utils/network-error";

export type { IApiResponse } from "@/services/api-envelope";
export { ApiClientError } from "@/services/api-client-error";

export interface IAxAxiosRequestConfig<S = unknown>
  extends Omit<AxiosRequestConfig<S>, "method"> {
  method: Method;
  skipAuth?: boolean;
  showErrorToast?: boolean;
}

type UnauthorizedHandler = () => void;

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "access_token";

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

/** 公开读接口 + 登录/注册（401 时不触发「会话失效」） */
const PUBLIC_AUTH_API_PATH =
  /\/api\/v1\/(?:auth\/(?:login|register|send-code|forgot-password|reset-password)|events|chart-templates\/(?:public|rankings|starter|detail|track))(?:\/|\?|$)/;

function isPublicAuthApiRequest(config?: Pick<AxiosRequestConfig, "url">) {
  const url = config?.url ?? "";
  return PUBLIC_AUTH_API_PATH.test(url);
}

function isAuthAttemptRequest(
  config?: IAxAxiosRequestConfig,
  options?: { skipAuth?: boolean },
) {
  return options?.skipAuth === true || isPublicAuthApiRequest(config);
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  private static instance: ApiClient;
  private static unauthorizedHandler: UnauthorizedHandler | null = null;

  private constructor(config?: CreateAxiosDefaults) {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...config,
    });

    this.axiosInstance.interceptors.request.use(
      this.processRequestSuccess.bind(this),
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      this.processResponseSuccess.bind(this),
      this.processResponseError.bind(this),
    );
  }

  public static getInstance(config?: CreateAxiosDefaults) {
    if (!this.instance) {
      return (this.instance = new ApiClient(config));
    }

    return this.instance;
  }

  public static setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
    this.unauthorizedHandler = handler;
  }

  public async sendRequest<T, S = unknown>(
    requestConfig: IAxAxiosRequestConfig<S>,
  ) {
    const response = await this.axiosInstance.request<
      IApiResponse<T> | T,
      AxiosResponse<IApiResponse<T> | T>,
      S
    >({
      ...requestConfig,
    });

    if (isApiEnvelope<T>(response.data)) {
      return response.data.data;
    }

    return response.data;
  }

  public async sendRequestWithMeta<T, S = unknown>(
    requestConfig: IAxAxiosRequestConfig<S>,
  ) {
    const response = await this.axiosInstance.request<
      IApiResponse<T>,
      AxiosResponse<IApiResponse<T>>,
      S
    >({
      ...requestConfig,
    });

    return response.data;
  }

  public async sendDownload<S = unknown>(
    requestConfig: IAxAxiosRequestConfig<S>,
  ) {
    const response = await this.axiosInstance.request<Blob, AxiosResponse<Blob>, S>(
      {
        responseType: "blob",
        ...requestConfig,
      },
    );

    return response.data;
  }

  private processRequestSuccess(config: InternalAxiosRequestConfig) {
    // 浏览器每次请求强制同源 /api/v1，避免构建时 baseURL 被写死为 API 子域
    config.baseURL = getApiBaseUrl();

    const requestConfig = config as InternalAxiosRequestConfig & {
      skipAuth?: boolean;
    };

    if (!requestConfig.skipAuth) {
      const token = getCookie(AUTH_COOKIE_NAME);

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  }

  private processResponseError(error: AxiosError<IApiResponse>) {
    if (error.code === "ERR_CANCELED") {
      return Promise.reject(new ApiClientError(499, "canceled"));
    }

    const requestConfig = error.config as IAxAxiosRequestConfig | undefined;
    const showErrorToast = requestConfig?.showErrorToast !== false;
    const payload = error.response?.data;

    const authAttempt = isAuthAttemptRequest(requestConfig, {
      skipAuth: requestConfig?.skipAuth,
    });

    if (isApiEnvelope(payload)) {
      const businessCode = payload.code ?? error.response?.status ?? 500;
      const message = resolveApiMessage(payload) || error.message;

      return this.handleStatusException(
        businessCode,
        message || "Request failed",
        showErrorToast,
        payload.details,
        { authAttempt },
      );
    }

    if (!error.response) {
      const message = resolveNetworkErrorMessage(error, "rest");
      return this.handleStatusException(0, message, showErrorToast, undefined, {
        authAttempt,
      });
    }

    const httpStatus = error.response.status ?? 500;
    const message = resolveApiMessage(payload) || error.message;

    return this.handleStatusException(
      httpStatus,
      message || "Request failed",
      showErrorToast,
      undefined,
      { authAttempt },
    );
  }

  private async processResponseSuccess(response: AxiosResponse<IApiResponse>) {
    const requestConfig = response.config as IAxAxiosRequestConfig | undefined;
    const showErrorToast = requestConfig?.showErrorToast !== false;
    const contentType = response.headers["content-type"];
    const resolvedContentType =
      typeof contentType === "string" ? contentType : "";

    if (
      response.config.responseType === "blob" &&
      response.data instanceof Blob &&
      resolvedContentType.includes("application/json")
    ) {
      const text = await response.data.text();
      const json = JSON.parse(text) as IApiResponse;
      const code = json.code ?? response.status;
      const message = resolveApiMessage(json) || "Download failed";

      const authAttempt = isAuthAttemptRequest(requestConfig, {
        skipAuth: requestConfig?.skipAuth,
      });

      return this.handleStatusException(code, message, showErrorToast, undefined, {
        authAttempt,
      });
    }

    if (!isApiEnvelope(response.data)) {
      return response;
    }

    const { code, success } = response.data;
    const resolvedMessage = resolveApiMessage(response.data);

    const businessCode =
      typeof code === "number" ? code : response.status;

    const authAttempt = isAuthAttemptRequest(requestConfig, {
      skipAuth: requestConfig?.skipAuth,
    });

    if (typeof success === "boolean" && !success) {
      return this.handleStatusException(
        businessCode,
        resolvedMessage,
        showErrorToast,
        response.data.details,
        { authAttempt },
      );
    }

    if (typeof code === "number" && code !== 200) {
      return this.handleStatusException(
        businessCode,
        resolvedMessage,
        showErrorToast,
        response.data.details,
        { authAttempt },
      );
    }

    return response;
  }

  private handleStatusException(
    status: number,
    message: string,
    showErrorToast: boolean,
    details?: unknown,
    options?: { authAttempt?: boolean },
  ) {
    const resolvedMessage = message?.trim() || "请求失败";
    const isAuthAttempt = options?.authAttempt === true;

    // 已登录态访问受保护接口返回 401 → 登出 + 固定提示
    // 登录/注册等公开鉴权接口 → 必须使用接口 body.message（如「密码错误」「该账号不存在，请先注册」）
    if (status === 401 && !isAuthAttempt) {
      ApiClient.unauthorizedHandler?.();

      const sessionMessage = "登录状态已失效，请重新登录";

      if (showErrorToast) {
        toast.error(sessionMessage);
      }

      return Promise.reject(
        new ApiClientError(status, sessionMessage, details),
      );
    }

    if (showErrorToast && message !== "canceled" && !details) {
      toast.error(resolvedMessage);
    }

    return Promise.reject(
      new ApiClientError(status, resolvedMessage, details),
    );
  }
}

export const apiClient = ApiClient.getInstance({
  baseURL: getApiBaseUrl(),
});

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  ApiClient.setUnauthorizedHandler(handler);
}