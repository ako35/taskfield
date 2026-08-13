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

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api")
).replace(/\/+$/, "");

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

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const result = (await response.json()) as T & ApiResult;
    if (!response.ok) {
      throw new ApiError(
        resultMessage(result, "İşlem tamamlanamadı."),
        response.status,
      );
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Sunucuya ulaşılamadı. API adresini ve ağı kontrol edin.",
      0,
    );
  }
}

export async function loginFieldAgent(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const result = (await response.json()) as ApiResult & {
      token?: string;
      user?: MobileUser & { role: string };
    };

    if (!response.ok || !result.user || !result.token) {
      throw new ApiError(
        resultMessage(result, "Giriş yapılamadı."),
        response.status,
      );
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Sunucuya ulaşılamadı. API adresini ve ağı kontrol edin.",
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