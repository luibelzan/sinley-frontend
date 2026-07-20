import { apiRequest } from "./client";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export function registerUser(input: { username: string; email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/register", { method: "POST", body: input });
}

export function loginUser(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export function refreshTokens(refreshToken: string) {
  return apiRequest<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export function logoutUser(refreshToken: string) {
  return apiRequest<void>("/auth/logout", { method: "POST", body: { refreshToken } });
}

export interface WalletView {
  balance: number;
  balanceCents: string;
  updatedAt: string;
}

export function getWalletBalance(accessToken: string) {
  return apiRequest<WalletView>("/wallet/me", { accessToken });
}

export function rechargeWallet(accessToken: string, amount: number) {
  return apiRequest<WalletView>("/wallet/recharge", {
    method: "POST",
    accessToken,
    body: { amount },
  });
}
