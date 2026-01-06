// Shared constants for Pro Dashboard components
import { Dimensions } from "react-native";
import { getAssetUrl } from "../../api";

export const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    surfaceLight: "#ffffff",
    textMain: "#111418",
    gray100: "#e5e7eb",
    gray200: "#d1d5db",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    green400: "#4ade80",
    green500: "#22c55e",
    green600: "#16a34a",
    green50: "#f0fdf4",
    purple600: "#9333ea",
    purple50: "#faf5ff",
    orange600: "#ea580c",
    orange50: "#fff7ed",
    blue50: "#eff6ff",
    blue600: "#2563eb",
    yellow50: "#fefce8",
    yellow600: "#ca8a04",
    indigo50: "#eef2ff",
    indigo600: "#4f46e5",
    teal50: "#f0fdfa",
    teal600: "#0d9488",
    rose50: "#fff1f2",
    rose600: "#e11d48",
    cyan50: "#ecfeff",
    cyan600: "#0891b2",
    red50: "#fef2f2",
    red600: "#dc2626",
};

export function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

