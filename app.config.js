// Dynamic Expo configuration
// This allows different package IDs for development vs production builds
// so both can be installed on the same device simultaneously

const IS_DEV = process.env.APP_VARIANT === 'development';

const getAppName = () => {
    if (IS_DEV) {
        return 'TwinPro (Dev)';
    }
    return 'TwinPro';
};

const getPackage = () => {
    if (IS_DEV) {
        return 'app.twinpro.twinpro.dev';
    }
    return 'app.twinpro.twinpro';
};

const getBundleIdentifier = () => {
    if (IS_DEV) {
        return 'app.twinpro.twinpro.dev';
    }
    return 'app.twinpro.twinpro';
};

module.exports = () => {
    // Load the static config from app.json
    const config = require('./app.json').expo;

    return {
        ...config,
        name: getAppName(),
        plugins: [
            ...(config.plugins || []),
            "expo-localization",
            [
                "expo-speech-recognition",
                {
                    "microphonePermission": "TwinPro necesita acceso al micrófono para la búsqueda por voz",
                    "speechRecognitionPermission": "TwinPro necesita acceso al reconocimiento de voz para transcribir tu búsqueda"
                }
            ],
        ],
        android: {
            ...config.android,
            package: getPackage(),
            // Use EAS secret file env var when available, else fall back to local file
            ...(process.env.GOOGLE_SERVICES_JSON && {
                googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
            }),
        },
        ios: {
            ...config.ios,
            bundleIdentifier: getBundleIdentifier(),
        },
    };
};
