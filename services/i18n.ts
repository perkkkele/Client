import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Spanish (default)
import esCommon from '../locales/es/common.json';
import esAuth from '../locales/es/auth.json';
import esHome from '../locales/es/home.json';
import esSettings from '../locales/es/settings.json';
import esOnboarding from '../locales/es/onboarding.json';

// English
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enHome from '../locales/en/home.json';
import enSettings from '../locales/en/settings.json';
import enOnboarding from '../locales/en/onboarding.json';

// French
import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';
import frHome from '../locales/fr/home.json';
import frSettings from '../locales/fr/settings.json';
import frOnboarding from '../locales/fr/onboarding.json';

// German
import deCommon from '../locales/de/common.json';
import deAuth from '../locales/de/auth.json';
import deHome from '../locales/de/home.json';
import deSettings from '../locales/de/settings.json';
import deOnboarding from '../locales/de/onboarding.json';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

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
    },
    en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        settings: enSettings,
        onboarding: enOnboarding,
    },
    fr: {
        common: frCommon,
        auth: frAuth,
        home: frHome,
        settings: frSettings,
        onboarding: frOnboarding,
    },
    de: {
        common: deCommon,
        auth: deAuth,
        home: deHome,
        settings: deSettings,
        onboarding: deOnboarding,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,
        defaultNS: 'common',
        ns: ['common', 'auth', 'home', 'settings', 'onboarding'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        react: {
            useSuspense: false, // Avoid suspense in React Native
        },
        compatibilityJSON: 'v4', // Required for React Native / Hermes
    });

/**
 * Change the active language.
 * Call this when the user changes their language preference.
 */
export function changeLanguage(lang: SupportedLanguage): Promise<any> {
    return i18n.changeLanguage(lang);
}

/**
 * Get the current active language.
 */
export function getCurrentLanguage(): SupportedLanguage {
    return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
}

export default i18n;
