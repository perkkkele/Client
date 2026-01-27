// Shared constants for Pro Dashboard components
import { Dimensions } from "react-native";
import { getAssetUrl } from "../../api";

export const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const COLORS = {
    // === SLATE PRO PALETTE ===
    // Base colors - sophisticated dark slate
    primary: "#1e293b",           // Slate Pro primary (dark slate blue)
    accent: "#d4af37",            // Gold accent for highlights
    accentLight: "#f5e6c8",       // Light gold for backgrounds

    // Backgrounds
    backgroundLight: "#f1f5f9",   // Slightly cooler neutral
    surfaceLight: "#ffffff",

    // Text
    textMain: "#0f172a",          // Deep slate for text

    // Grays - slate undertone
    gray100: "#e2e8f0",
    gray200: "#cbd5e1",
    gray300: "#94a3b8",
    gray400: "#64748b",
    gray500: "#475569",
    gray600: "#334155",
    gray700: "#1e293b",
    gray800: "#0f172a",

    // Unified accent colors (reduced variety, cohesive feel)
    green400: "#4ade80",
    green500: "#22c55e",
    green600: "#16a34a",
    green50: "#f0fdf4",

    // Using gold/amber tones instead of rainbow
    purple600: "#d4af37",         // Gold instead of purple
    purple50: "#fef9e7",          // Light gold bg
    orange600: "#b8860b",         // Dark gold instead of orange
    orange50: "#fef9e7",
    blue50: "#f1f5f9",            // Slate blue light
    blue600: "#1e293b",           // Primary slate
    yellow50: "#fef9e7",
    yellow600: "#d4af37",
    indigo50: "#f1f5f9",
    indigo600: "#334155",
    teal50: "#f1f5f9",
    teal600: "#475569",
    rose50: "#fef9e7",
    rose600: "#b8860b",
    cyan50: "#f1f5f9",
    cyan600: "#64748b",
    red50: "#fef2f2",
    red600: "#dc2626",
};

export function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

