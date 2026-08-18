import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { MobileUser, VisitAssignment } from "../types";

const storage =
  Platform.OS === "web"
    ? {
        async getItemAsync(key: string) {
          if (typeof window === "undefined") return null;
          return window.localStorage.getItem(key);
        },
        async setItemAsync(key: string, value: string) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
        },
        async deleteItemAsync(key: string) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
          }
        },
      }
    : SecureStore;

function buildApiCandidateUrls(): string[] {
  const urls = new Set<string>();

  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (configured) urls.add(configured);

  const browserHost =
    typeof window !== "undefined" ? window.location?.hostname : undefined;

  if (browserHost && browserHost !== "localhost" && browserHost !== "127.0.0.1") {
    urls.add(`http://${browserHost}:3000/api`);
  }

  if (Platform.OS === "android") {
    urls.add("http://10.0.2.2:3000/api");
  }

  urls.add("http://localhost:3000/api");
  urls.add("http://127.0.0.1:3000/api");
  urls.add("http://192.168.1.33:3000/api");

  return Array.from(urls);
}

const API_URL_CANDIDATES = buildApiCandidateUrls();
const API_URL = API_URL_CANDIDATES[0] ?? "http://localhost:3000/api";

async function fetchWithApiFallback<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let lastError: unknown;

  for (const baseUrl of API_URL_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(init?.headers ?? {}),
        },
      });

      const result = (await response.json()) as T & ApiResult;
      if (!response.ok) {
        if (response.status >= 500) {
          lastError = result;
          continue;
        }
        // Sunucu gerçek bir yanıt verdi (ör. 401/403/404); başka adrese düşmeden hatayı bildir.
        throw new ApiError(
          resultMessage(result, "İşlem tamamlanamadı."),
          response.status,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error;
      continue;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(
    "Sunucuya ulaşılamadı. API adresini ve ağınızı kontrol edin.",
    0,
  );
}

const TOKEN_KEY = "taskfield_mobile_token";
const USER_KEY = "taskfield_mobile_user";

interface ApiResult {
  message?: string | string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function resultMessage(result: ApiResult, fallback: string) {
  return Array.isArray(result.message)
    ? result.message.join(" ")
    : (result.message ?? fallback);
}

async function authenticatedRequest<T>(path: string, init?: RequestInit) {
  const token = await storage.getItemAsync(TOKEN_KEY);
  if (!token) throw new ApiError("Oturumunuz bulunamadı.", 401);

  return fetchWithApiFallback<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function loginFieldAgent(email: string, password: string) {
  try {
    let lastError: unknown;

    for (const baseUrl of API_URL_CANDIDATES) {
      try {
        const response = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const result = (await response.json()) as ApiResult & {
          token?: string;
          user?: MobileUser & { role: string };
        };

        if (!response.ok || !result.user || !result.token) {
          const apiError = new ApiError(
            resultMessage(result, "Giriş yapılamadı."),
            response.status,
          );
          // Sunucu gerçek bir yanıt verdi (ör. yanlış parola); başka adrese düşmeden hatayı bildir.
          if (response.status < 500) throw apiError;
          lastError = apiError;
          continue;
        }

        if (result.user.role !== "field_agent") {
          throw new ApiError(
            "Bu uygulama yalnız saha çalışanı hesapları içindir.",
            403,
          );
        }

        await Promise.all([
          storage.setItemAsync(TOKEN_KEY, result.token),
          storage.setItemAsync(USER_KEY, JSON.stringify(result.user)),
        ]);
        return result.user as MobileUser;
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) throw error;
        lastError = error;
      }
    }

    if (lastError instanceof ApiError) throw lastError;
    throw new ApiError(
      "Sunucuya ulaşılamadı. API adresini ve ağınızı kontrol edin.",
      0,
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Sunucuya ulaşılamadı. API adresini ve ağınızı kontrol edin.",
      0,
    );
  }
}

export async function restoreMobileSession() {
  const [token, storedUser] = await Promise.all([
    storage.getItemAsync(TOKEN_KEY),
    storage.getItemAsync(USER_KEY),
  ]);
  if (!token || !storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as MobileUser;
    return user.role === "field_agent" ? user : null;
  } catch {
    await clearMobileSession();
    return null;
  }
}

export async function clearMobileSession() {
  await Promise.all([
    storage.deleteItemAsync(TOKEN_KEY),
    storage.deleteItemAsync(USER_KEY),
  ]);
}

export async function getAssignedVisits() {
  const result = await authenticatedRequest<{ visits?: VisitAssignment[] }>(
    "/visits",
  );
  return result.visits ?? [];
}

export async function checkInVisit(visitId: string, latitude: number, longitude: number) {
  const result = await authenticatedRequest<{ visit?: VisitAssignment }>(
    `/visits/${visitId}/check-in`,
    {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude }),
    },
  );
  return result.visit ?? null;
}

export async function checkOutVisit(visitId: string, latitude: number, longitude: number) {
  const result = await authenticatedRequest<{ visit?: VisitAssignment }>(
    `/visits/${visitId}/check-out`,
    {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude }),
    },
  );
  return result.visit ?? null;
}

export async function updateOwnPassword(
  currentPassword: string,
  newPassword: string,
) {
  const result = await authenticatedRequest<{ message?: string }>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    },
  );
  return result.message ?? "Parolanız başarıyla değiştirildi.";
}