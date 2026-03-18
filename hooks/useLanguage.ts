import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, LOCALE_MAP, type SupportedLanguage, SUPPORTED_LANGUAGES } from '../services/i18n';
import { useAuth } from '../context';
import { userApi } from '../api';

/**
 * Hook that synchronizes the user's language preference with i18next.
 *
 * - On mount: reads user.language from AuthContext and sets i18next accordingly.
 * - On language change: updates i18next, persists to backend, and refreshes user.
 * - For unauthenticated users: falls back to device locale or 'es'.
 *
 * Usage:
 *   const { language, setLanguage, t, locale } = useLanguage();
 *   // language = 'es' | 'en' | 'fr' | 'de'
 *   // setLanguage('en') → changes UI and persists
 *   // t('common:save') → translated string
 *   // locale = 'es-ES' for date formatting
 */
export function useLanguage() {
    const { user, token, refreshUser } = useAuth();
    const { t, i18n } = useTranslation();
    const [isChanging, setIsChanging] = useState(false);

    // Sync i18n language with user profile on mount/user change
    useEffect(() => {
        const userLang = user?.language as SupportedLanguage | undefined;
        if (userLang && SUPPORTED_LANGUAGES.includes(userLang) && i18n.language !== userLang) {
            changeLanguage(userLang);
        }
    }, [user?.language]);

    // Change language: update i18n + persist to backend
    const setLanguage = useCallback(async (lang: SupportedLanguage) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;

        setIsChanging(true);
        try {
            // 1. Change i18n immediately (instant UI update)
            await changeLanguage(lang);

            // 2. Persist to backend if authenticated
            if (token) {
                await userApi.updateUser(token, { language: lang });
                if (refreshUser) {
                    await refreshUser();
                }
            }
        } catch (error) {
            console.error('[useLanguage] Error changing language:', error);
            // Revert i18n if backend failed
            const fallback = (user?.language as SupportedLanguage) || 'es';
            await changeLanguage(fallback);
        } finally {
            setIsChanging(false);
        }
    }, [token, user?.language, refreshUser]);

    const language = getCurrentLanguage();
    const locale = LOCALE_MAP[language] || 'es-ES';

    return {
        /** Current active language code */
        language,
        /** Change the app language (updates UI immediately + persists to backend) */
        setLanguage,
        /** Translation function — usage: t('namespace:key') or t('key') for common */
        t,
        /** Locale string for date formatting (e.g. 'es-ES', 'en-US') */
        locale,
        /** Whether a language change is in progress */
        isChanging,
        /** All supported languages */
        supportedLanguages: SUPPORTED_LANGUAGES,
    };
}
