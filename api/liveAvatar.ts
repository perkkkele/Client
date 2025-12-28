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

// Public avatar from LiveAvatar catalog
export interface PublicAvatar {
    id: string;
    name: string;
    preview_url: string;
    gender?: string;
    style?: string;
    created_at?: string;
}

/**
 * Get list of public avatars from LiveAvatar catalog
 */
export async function getPublicAvatars(): Promise<PublicAvatar[]> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/avatars/public`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar public avatars error:", error);
            throw new Error(error.message || `Error fetching avatars: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("LiveAvatar public avatars response:", responseData);

        // API returns { code: 1000, data: { count, next, previous, results: [...] }, message }
        if (responseData.data && responseData.data.results && Array.isArray(responseData.data.results)) {
            return responseData.data.results;
        }
        // Fallback for direct array in data
        if (responseData.data && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        if (Array.isArray(responseData)) {
            return responseData;
        }
        return [];
    } catch (error) {
        console.error("Error fetching public avatars:", error);
        return [];
    }
}

// Public voice from LiveAvatar catalog
export interface PublicVoice {
    id: string;
    name: string;
    gender?: string;
    language?: string;
    accent?: string;
    preview_url?: string;
    sample_url?: string;
    provider?: string;
    description?: string;
}

/**
 * Get list of public voices from LiveAvatar catalog
 */
export async function getPublicVoices(): Promise<PublicVoice[]> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/voices`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar voices error:", error);
            throw new Error(error.message || `Error fetching voices: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("LiveAvatar voices response:", responseData);

        // API returns { code: 1000, data: { count, next, previous, results: [...] }, message }
        if (responseData.data && responseData.data.results && Array.isArray(responseData.data.results)) {
            return responseData.data.results;
        }
        // Fallback for direct array in data
        if (responseData.data && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        if (Array.isArray(responseData)) {
            return responseData;
        }
        return [];
    } catch (error) {
        console.error("Error fetching public voices:", error);
        return [];
    }
}

// ========================
// CONTEXT MANAGEMENT
// ========================

export interface ContextLink {
    url: string;
    description?: string;
}

export interface CreateContextRequest {
    name: string;
    prompt: string;
    opening_text: string;
    links?: ContextLink[];
}

export interface ContextResponse {
    id: string;
    name: string;
    prompt: string;
    opening_text?: string;
    links?: ContextLink[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Create a new LiveAvatar context
 */
export async function createContext(
    name: string,
    prompt: string,
    links: ContextLink[] = [],
    openingText: string = "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?"
): Promise<ContextResponse> {
    const requestBody: CreateContextRequest = {
        name,
        prompt,
        opening_text: openingText,
        links
    };

    console.log("Creating LiveAvatar context:", requestBody);

    const response = await fetch(`${LIVEAVATAR_API_URL}/contexts`, {
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
        console.error("LiveAvatar create context error:", error);
        // Extract detailed message if available
        let errorMessage = error.message || `Error creating context: ${response.status}`;
        if (error.data && Array.isArray(error.data)) {
            errorMessage = error.data.map((e: any) => e.message).join(', ');
        }
        throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("LiveAvatar create context response:", responseData);

    // API returns { code: 1000, data: {...}, message }
    if (responseData.data) {
        return responseData.data;
    }
    return responseData;
}

/**
 * Update an existing LiveAvatar context
 */
export async function updateContext(
    contextId: string,
    name: string,
    prompt: string,
    links: ContextLink[] = [],
    openingText: string = "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?"
): Promise<ContextResponse | null> {
    try {
        const requestBody: CreateContextRequest = {
            name,
            prompt,
            opening_text: openingText,
            links
        };

        console.log("Updating LiveAvatar context:", contextId, requestBody);

        const response = await fetch(`${LIVEAVATAR_API_URL}/contexts/${contextId}`, {
            method: "PUT",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar update context error:", error);
            throw new Error(error.message || `Error updating context: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("LiveAvatar update context response:", responseData);

        if (responseData.data) {
            return responseData.data;
        }
        return responseData;
    } catch (error) {
        console.error("Error updating context:", error);
        return null;
    }
}

/**
 * Create a LiveAvatar session token
 * Note: FULL mode requires a valid context_id
 */
export async function createSessionToken(config: AvatarConfig): Promise<SessionTokenResponse> {
    // Validate required fields for FULL mode
    if (!config.contextId) {
        throw new Error("Se requiere un contexto configurado para iniciar la sesión. Por favor, configura el gemelo digital primero.");
    }

    if (!config.avatarId) {
        throw new Error("Se requiere un avatar configurado para iniciar la sesión.");
    }

    const requestBody: any = {
        mode: "FULL",
        avatar_id: config.avatarId,
        avatar_persona: {
            context_id: config.contextId,
            language: config.language || "es",
        },
    };

    // Only include voice_id if it's set
    if (config.voiceId) {
        requestBody.avatar_persona.voice_id = config.voiceId;
    }

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

/**
 * Transcript entry from LiveAvatar API
 */
export interface TranscriptEntry {
    role: 'user' | 'assistant';
    text: string;
    start_time?: number;
    end_time?: number;
}

export interface TranscriptResponse {
    transcript: TranscriptEntry[];
}

/**
 * Get session transcript from LiveAvatar API
 * This returns the full conversation transcript including both user and assistant messages
 */
export async function getSessionTranscript(sessionId: string): Promise<TranscriptEntry[]> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/${sessionId}/transcript`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
            },
        });

        if (!response.ok) {
            console.error("Failed to get session transcript:", response.status);
            return [];
        }

        const data = await response.json();

        if (data.code === 1000 && data.data?.transcript) {
            return data.data.transcript;
        }

        // Some API versions may return transcript directly in data
        if (data.data && Array.isArray(data.data)) {
            return data.data;
        }

        if (Array.isArray(data.transcript)) {
            return data.transcript;
        }

        return [];
    } catch (error) {
        console.error("Error getting session transcript:", error);
        return [];
    }
}
