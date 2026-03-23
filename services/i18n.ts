import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Spanish (default)
import esCommon from '../locales/es/common.json';
import esAuth from '../locales/es/auth.json';
import esHome from '../locales/es/home.json';
import esSettings from '../locales/es/settings.json';
import esOnboarding from '../locales/es/onboarding.json';
import esReviews from '../locales/es/reviews.json';

// English
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enHome from '../locales/en/home.json';
import enSettings from '../locales/en/settings.json';
import enOnboarding from '../locales/en/onboarding.json';
import enReviews from '../locales/en/reviews.json';

// French
import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';
import frHome from '../locales/fr/home.json';
import frSettings from '../locales/fr/settings.json';
import frOnboarding from '../locales/fr/onboarding.json';
import frReviews from '../locales/fr/reviews.json';

// German
import deCommon from '../locales/de/common.json';
import deAuth from '../locales/de/auth.json';
import deHome from '../locales/de/home.json';
import deSettings from '../locales/de/settings.json';
import deOnboarding from '../locales/de/onboarding.json';
import deReviews from '../locales/de/reviews.json';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/** AsyncStorage key for persisted language preference */
const LANGUAGE_STORAGE_KEY = '@twinpro_language';

// Locale mapping for date formatting
export const LOCALE_MAP: Record<SupportedLanguage, string> = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
};

const resources = {
    es: {
        common: esCommon,
        auth: esAuth,
        home: esHome,
        settings: esSettings,
        onboarding: esOnboarding,
        reviews: esReviews,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        settings: enSettings,
        onboarding: enOnboarding,
        reviews: enReviews,
    },
    fr: {
        common: frCommon,
        auth: frAuth,
        home: frHome,
        settings: frSettings,
        onboarding: frOnboarding,
        reviews: frReviews,
    },
    de: {
        common: deCommon,
        auth: deAuth,
        home: deHome,
        settings: deSettings,
        onboarding: deOnboarding,
        reviews: deReviews,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,
        defaultNS: 'common',
        ns: ['common', 'auth', 'home', 'settings', 'onboarding', 'reviews'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        react: {
            useSuspense: false, // Avoid suspense in React Native
        },
        compatibilityJSON: 'v4', // Required for React Native / Hermes
    });

/**
 * Change the active language and persist to AsyncStorage.
 * Call this when the user changes their language preference.
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<any> {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
        console.warn('[i18n] Failed to persist language to AsyncStorage:', e);
    }
    return i18n.changeLanguage(lang);
}

/**
 * Get the current active language.
 */
export function getCurrentLanguage(): SupportedLanguage {
    return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
}

/**
 * Load the saved language from AsyncStorage and apply it.
 * Called once on module import to restore the user's preference.
 */
export async function loadSavedLanguage(): Promise<void> {
    try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage) && i18n.language !== saved) {
            await i18n.changeLanguage(saved);
        }
    } catch (e) {
        console.warn('[i18n] Failed to load saved language:', e);
    }
}

// Auto-load saved language on module import (runs behind splash screen)
loadSavedLanguage();

export default i18n;
