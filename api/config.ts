// API Configuration with automatic dev/production switching
// In development (__DEV__ = true): connects to local server
// In production (__DEV__ = false): connects to Railway server

// Your local IP for mobile development testing
const LOCAL_IP = "192.168.1.139";
const LOCAL_PORT = 3977;

// Production server URL (update after Railway deployment)
const PRODUCTION_HOST = "twinpro-production.up.railway.app";

// Automatic switching based on build mode
const IS_PRODUCTION = !__DEV__;

export const API_HOST = IS_PRODUCTION ? PRODUCTION_HOST : LOCAL_IP;
export const API_PORT = IS_PRODUCTION ? 443 : LOCAL_PORT;
const API_PROTOCOL = IS_PRODUCTION ? "https" : "http";
const WS_PROTOCOL = IS_PRODUCTION ? "wss" : "ws";

// Build full URLs
export const API_URL = IS_PRODUCTION
    ? `${API_PROTOCOL}://${API_HOST}/api`
    : `${API_PROTOCOL}://${API_HOST}:${API_PORT}/api`;

export const SOCKET_URL = IS_PRODUCTION
    ? `${WS_PROTOCOL}://${API_HOST}`
    : `${WS_PROTOCOL}://${API_HOST}:${API_PORT}`;

// Debug log in development
if (__DEV__) {
    console.log('[Config] Running in DEVELOPMENT mode');
    console.log('[Config] API_URL:', API_URL);
    console.log('[Config] SOCKET_URL:', SOCKET_URL);
}
