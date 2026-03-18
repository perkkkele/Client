/**
 * Shared category definitions for i18n-aware category display.
 * 
 * Category IDs are language-neutral. Labels come from common.json via t('common:categories.<id>').
 * Import these constants and use getCategoryLabel(t, id) to display translated labels.
 */

import { TFunction } from 'i18next';

// === Category IDs with emoji/icon metadata ===

export const CATEGORY_IDS = [
    'legal', 'salud', 'educacion', 'finanzas', 'fitness', 'tecnologia',
    'hogar', 'bienestar', 'viajes', 'coaching', 'mantenimiento', 'reformas',
    'marketing', 'gestoria', 'energia', 'empleo', 'arte', 'eventos',
    'mascotas', 'belleza', 'economia', 'inmobiliaria', 'otro',
] as const;

export type CategoryId = typeof CATEGORY_IDS[number];

export const CATEGORY_EMOJIS: Record<string, string> = {
    todos: '✨', legal: '⚖️', salud: '🩺', educacion: '🎓', finanzas: '💰',
    fitness: '💪', tecnologia: '💻', hogar: '🔧', bienestar: '🧘', viajes: '✈️',
    coaching: '🎯', mantenimiento: '🔩', reformas: '🏗️', marketing: '📢',
    gestoria: '📋', energia: '⚡', empleo: '💼', arte: '🎨', eventos: '🎉',
    mascotas: '🐾', belleza: '💅', economia: '📊', inmobiliaria: '🏠', otro: '📦',
};

export const CATEGORY_ICONS: Record<string, string> = {
    legal: 'balance', salud: 'medical-services', educacion: 'school',
    finanzas: 'attach-money', fitness: 'fitness-center', tecnologia: 'devices',
    hogar: 'home-repair-service', bienestar: 'self-improvement', viajes: 'flight',
    coaching: 'track-changes', mantenimiento: 'build', reformas: 'construction',
    marketing: 'campaign', gestoria: 'assignment', energia: 'bolt',
    empleo: 'work', arte: 'palette', eventos: 'celebration',
    mascotas: 'pets', belleza: 'spa', economia: 'trending-up',
    inmobiliaria: 'real-estate-agent', otro: 'more-horiz',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    legal: { bg: '#f1f5f9', text: '#475569' },
    salud: { bg: '#dbeafe', text: '#1d4ed8' },
    educacion: { bg: '#dcfce7', text: '#15803d' },
    finanzas: { bg: '#fef3c7', text: '#b45309' },
    fitness: { bg: '#ffedd5', text: '#c2410c' },
    tecnologia: { bg: '#e0e7ff', text: '#4338ca' },
    hogar: { bg: '#fef3c7', text: '#b45309' },
    bienestar: { bg: '#fce7f3', text: '#be185d' },
    viajes: { bg: '#e0f2fe', text: '#0369a1' },
    coaching: { bg: '#fef9c3', text: '#a16207' },
    mantenimiento: { bg: '#f1f5f9', text: '#475569' },
    reformas: { bg: '#ffedd5', text: '#c2410c' },
    marketing: { bg: '#ede9fe', text: '#6d28d9' },
    gestoria: { bg: '#f1f5f9', text: '#475569' },
    energia: { bg: '#fef9c3', text: '#a16207' },
    empleo: { bg: '#dbeafe', text: '#1d4ed8' },
    arte: { bg: '#fce7f3', text: '#be185d' },
    eventos: { bg: '#ede9fe', text: '#6d28d9' },
    mascotas: { bg: '#dcfce7', text: '#15803d' },
    belleza: { bg: '#fce7f3', text: '#be185d' },
    economia: { bg: '#fef3c7', text: '#b45309' },
    inmobiliaria: { bg: '#e0f2fe', text: '#0369a1' },
    otro: { bg: '#f3e8ff', text: '#7e22ce' },
    // Legacy IDs
    diseno: { bg: '#fce7f3', text: '#be185d' },
    estetica: { bg: '#fce7f3', text: '#be185d' },
    inmobiliario: { bg: '#e0f2fe', text: '#0369a1' },
    otros: { bg: '#f3e8ff', text: '#7e22ce' },
};

// === businessType IDs ===
export const BUSINESS_TYPE_IDS = ['freelance', 'company', 'clinic'] as const;
export type BusinessTypeId = typeof BUSINESS_TYPE_IDS[number];

// === Translation helpers ===

/**
 * Get translated category label. Falls back to the raw id.
 */
export function getCategoryLabel(t: TFunction, id: string): string {
    const key = `common:categories.${id}`;
    const translated = t(key);
    return translated !== key ? translated : id;
}

/**
 * Get translated businessType label. Falls back to the raw id.
 */
export function getBusinessTypeLabel(t: TFunction, id: string): string {
    const key = `common:businessType.${id}`;
    const translated = t(key);
    return translated !== key ? translated : id;
}

/**
 * Build a translated categories array with emojis (for horizontal scrollers).
 * Includes "todos" as the first item.
 */
export function getCategoriesWithEmoji(t: TFunction, includeAll = true): { id: string; label: string; emoji: string }[] {
    const items: { id: string; label: string; emoji: string }[] = CATEGORY_IDS.map(id => ({
        id,
        label: getCategoryLabel(t, id),
        emoji: CATEGORY_EMOJIS[id] || '📦',
    }));
    if (includeAll) {
        items.unshift({ id: 'todos', label: getCategoryLabel(t, 'todos'), emoji: '✨' });
    }
    return items;
}

/**
 * Build a translated categories array with Material Icons (for grid views).
 */
export function getCategoriesWithIcons(t: TFunction) {
    return CATEGORY_IDS.map(id => ({
        id,
        label: getCategoryLabel(t, id),
        icon: CATEGORY_ICONS[id] || 'more-horiz',
    }));
}

/**
 * Build a translated businessType array for pickers.
 */
export function getBusinessTypes(t: TFunction) {
    return BUSINESS_TYPE_IDS.map(id => ({
        id,
        label: getBusinessTypeLabel(t, id),
    }));
}
