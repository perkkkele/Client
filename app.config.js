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
        android: {
            ...config.android,
            package: getPackage(),
        },
        ios: {
            ...config.ios,
            bundleIdentifier: getBundleIdentifier(),
        },
    };
};
