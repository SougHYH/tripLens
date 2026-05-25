import { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
}

// ================================
// 핵심 fetch 래퍼
// ================================
async function request<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // 응답이 JSON이 아닐 경우 대비
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw {
      success: false,
      message: "서버 응답을 파싱할 수 없습니다.",
      statusCode: response.status,
    } satisfies ApiError;
  }

  if (!response.ok) {
    throw {
      success: false,
      message: (data as { message?: string; detail?: string })?.message ?? (data as { detail?: string })?.detail ?? "알 수 없는 오류가 발생했습니다.",
      statusCode: response.status,
    } satisfies ApiError;
  }

  return data as TResponse;
}

// ================================
// 편의 메서드
// ================================
export const apiClient = {
  get: <TResponse>(endpoint: string, headers?: Record<string, string>) =>
    request<TResponse>(endpoint, { method: "GET", headers }),

  post: <TResponse, TBody = unknown>(endpoint: string, body: TBody, headers?: Record<string, string>) =>
    request<TResponse, TBody>(endpoint, { method: "POST", body, headers }),

  put: <TResponse, TBody = unknown>(endpoint: string, body: TBody, headers?: Record<string, string>) =>
    request<TResponse, TBody>(endpoint, { method: "PUT", body, headers }),

  delete: <TResponse>(endpoint: string, headers?: Record<string, string>) =>
    request<TResponse>(endpoint, { method: "DELETE", headers }),
};
