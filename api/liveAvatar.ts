// LiveAvatar API Service
// Reusable service for LiveAvatar-enabled profiles (Santa POC, future professional profiles)

const LIVEAVATAR_API_URL = "https://api.liveavatar.com/v1";
const LIVEAVATAR_API_KEY = "c8ad5c55-cf3d-11f0-a99e-066a7fa2e369";

// Santa Claus configuration
export const SANTA_CONFIG = {
    avatarId: "1c690fe7-23e0-49f9-bfba-14344450285b",
    email: "santaclaus@twinpro.app",
    voiceId: "b2bd6569-a537-4342-aeca-a1f15d2a2c97", // Using available voice
    contextId: "d8ddef2c-74cb-4783-bd6e-aa38e8cadc56", // Santa context from API
    language: "es", // Spanish
};

export interface AvatarConfig {
    avatarId: string;
    voiceId?: string;
    contextId?: string;
    language?: string;
}

export interface SessionTokenResponse {
    session_id: string;
    session_token: string;
}

export interface SessionStartResponse {
    livekit_url: string;
    livekit_client_token: string;
    session_id: string;
}

/**
 * Create a LiveAvatar session token
 */
export async function createSessionToken(config: AvatarConfig): Promise<SessionTokenResponse> {
    const requestBody = {
        mode: "FULL",
        avatar_id: config.avatarId,
        avatar_persona: {
            voice_id: config.voiceId,
            context_id: config.contextId,
            language: config.language || "es",
        },
    };

    console.log("LiveAvatar request:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/token`, {
        method: "POST",
        headers: {
            "X-API-KEY": LIVEAVATAR_API_KEY,
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("LiveAvatar token error:", error);
        throw new Error(error.message || `Error creating session: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("LiveAvatar token response:", responseData);

    // API returns { code, data: { session_id, session_token }, message }
    if (responseData.data) {
        return responseData.data;
    }
    return responseData;
}


/**
 * Start a LiveAvatar session
 */
export async function startSession(sessionToken: string): Promise<SessionStartResponse> {
    console.log("Starting session with token:", sessionToken.substring(0, 50) + "...");

    const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/start`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("LiveAvatar start error:", error);
        throw new Error(error.message || `Error starting session: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("LiveAvatar start response:", responseData);

    // API returns { code, data: { ... }, message }
    if (responseData.data) {
        return responseData.data;
    }
    return responseData;
}

/**
 * Send a text message to the avatar (for FULL mode, the avatar will respond)
 */
export async function sendTextToAvatar(sessionToken: string, text: string): Promise<void> {
    const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/chat`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("LiveAvatar chat error:", error);
        throw new Error(error.message || `Error sending message: ${response.status}`);
    }
}

/**
 * Close a LiveAvatar session
 */
export async function closeSession(sessionToken: string): Promise<void> {
    try {
        await fetch(`${LIVEAVATAR_API_URL}/sessions/stop`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${sessionToken}`,
            },
        });
    } catch (error) {
        console.error("Error closing session:", error);
    }
}

/**
 * Check if a user email corresponds to a LiveAvatar profile
 */
export function isLiveAvatarUser(email: string): boolean {
    return email === SANTA_CONFIG.email;
}

/**
 * Get avatar config for a user email
 */
export function getAvatarConfig(email: string): AvatarConfig | null {
    if (email === SANTA_CONFIG.email) {
        return {
            avatarId: SANTA_CONFIG.avatarId,
            voiceId: SANTA_CONFIG.voiceId,
            language: SANTA_CONFIG.language,
            contextId: SANTA_CONFIG.contextId,
        };
    }
    return null;
}
