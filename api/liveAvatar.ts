// LiveAvatar API Service
// Reusable service for LiveAvatar-enabled profiles (Santa POC, future professional profiles)

const LIVEAVATAR_API_URL = "https://api.liveavatar.com/v1";
const LIVEAVATAR_API_KEY = process.env.EXPO_PUBLIC_LIVEAVATAR_API_KEY || "";

// Santa Claus configuration
export const SANTA_CONFIG = {
    avatarId: "1c690fe7-23e0-49f9-bfba-14344450285b",
    email: "santaclaus@twinpro.app",
    voiceId: "b2bd6569-a537-4342-aeca-a1f15d2a2c97", // Using available voice
    contextId: "d8ddef2c-74cb-4783-bd6e-aa38e8cadc56", // Santa context from API
    language: "es", // Spanish
};

/**
 * Static gender map for LiveAvatar public catalog.
 * Key: avatar base name (lowercase), Value: 'male' | 'female'
 * This is the authoritative source for avatar gender detection.
 */
const AVATAR_GENDER_MAP: Record<string, 'male' | 'female'> = {
    'santa': 'male',
    'ann': 'female',
    'shawn': 'male',
    'dexter': 'male',
    'judy': 'female',
    'june': 'female',
    'silas': 'male',
    'bryan': 'male',
    'elenora': 'female',
    'wayne': 'male',
    'katya': 'female',
    'graham': 'male',
    'amina': 'female',
    'anthony': 'male',
    'rika': 'female',
    'pedro': 'male',
    'alessandra': 'female',
    'anastasia': 'female',
    'thaddeus': 'male',
    'marianne': 'female',
};

/**
 * Get the gender of an avatar by its name.
 * Matches the first word of the avatar name against the gender map.
 * Example: "Pedro in Black Suit" → "pedro" → "male"
 */
export function getAvatarGender(avatarName: string): 'male' | 'female' | null {
    if (!avatarName) return null;
    const firstName = avatarName.split(' ')[0].toLowerCase();
    return AVATAR_GENDER_MAP[firstName] || null;
}

export interface AvatarConfig {
    avatarId: string;
    voiceId?: string;
    contextId?: string;
    language?: string;
    /** LiveAvatar LLM Configuration ID — routes LLM calls to our RAG endpoint (FULL Híbrido) */
    llmConfigurationId?: string;
}

export interface SessionTokenResponse {
    session_id: string;
    session_token: string;
}

export interface SessionStartResponse {
    livekit_url: string;
    livekit_client_token: string;
    livekit_agent_token?: string; // Token for server-side agent to join room
    session_id: string;
    ws_url?: string; // WebSocket URL for audio streaming in CUSTOM mode
}

// Public avatar from LiveAvatar catalog
export interface PublicAvatar {
    id: string;
    name: string;
    preview_url: string;
    gender?: string;
    style?: string;
    created_at?: string;
    default_voice_id?: string;
    default_voice?: {
        id: string;
        name: string;
        gender?: string;
        language?: string;
        preview_url?: string;
    };
}

// ========================
// CUSTOM AVATAR CREATION
// ========================

export interface CreateAvatarRequest {
    training_video_url?: string; // URL from S3/Drive/etc
    name?: string;
}

export interface CreateAvatarResponse {
    id: string;
    name?: string;
    status: 'processing' | 'ready' | 'failed' | 'pending';
    preview_url?: string;
    created_at?: string;
}

export interface VideoUploadResponse {
    upload_url: string;
    video_id: string;
}

/**
 * Create a custom avatar from a training video
 * The video should be at least 2 minutes with structure:
 * - 15s listening
 * - 90s speaking naturally
 * - 90s speaking naturally 
 * - 15s active waiting
 */
export async function createCustomAvatar(
    videoUrl: string,
    name?: string
): Promise<CreateAvatarResponse> {
    const requestBody: CreateAvatarRequest = {
        training_video_url: videoUrl,
        name: name || `Custom Avatar ${new Date().toISOString()}`,
    };

    console.log("Creating custom avatar:", requestBody);

    const response = await fetch(`${LIVEAVATAR_API_URL}/avatars`, {
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
        console.error("LiveAvatar create avatar error:", error);
        let errorMessage = error.message || `Error creating avatar: ${response.status}`;
        if (error.data && Array.isArray(error.data)) {
            errorMessage = error.data.map((e: any) => e.message).join(', ');
        }
        throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("LiveAvatar create avatar response:", responseData);

    // API returns { code: 1000, data: {...}, message }
    if (responseData.data) {
        return responseData.data;
    }
    return responseData;
}

/**
 * Upload a video file to LiveAvatar for avatar training
 * Returns a video URL that can be used with createCustomAvatar
 */
export async function uploadTrainingVideo(
    videoUri: string,
    mimeType: string = "video/mp4"
): Promise<string> {
    // Create form data with the video file
    const formData = new FormData();

    // For React Native, we need to construct the file object properly
    const filename = videoUri.split('/').pop() || 'training_video.mp4';
    formData.append('file', {
        uri: videoUri,
        type: mimeType,
        name: filename,
    } as any);

    console.log("Uploading training video:", { uri: videoUri, filename, mimeType });

    const response = await fetch(`${LIVEAVATAR_API_URL}/avatars/upload-video`, {
        method: "POST",
        headers: {
            "X-API-KEY": LIVEAVATAR_API_KEY,
            "Accept": "application/json",
            // Don't set Content-Type - let fetch set it with boundary for multipart
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("LiveAvatar video upload error:", error);
        throw new Error(error.message || `Error uploading video: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("LiveAvatar video upload response:", responseData);

    // Return the video URL for use with createCustomAvatar
    if (responseData.data?.url) {
        return responseData.data.url;
    }
    if (responseData.url) {
        return responseData.url;
    }
    // If API returns the video ID, construct URL
    if (responseData.data?.video_id) {
        return responseData.data.video_id;
    }

    throw new Error("No video URL returned from upload");
}

/**
 * Get list of public avatars from LiveAvatar catalog
 * Handles pagination to fetch ALL available avatars
 */
export async function getPublicAvatars(): Promise<PublicAvatar[]> {
    try {
        let allAvatars: PublicAvatar[] = [];
        let nextUrl: string | null = `${LIVEAVATAR_API_URL}/avatars/public`;

        while (nextUrl) {
            const response: Response = await fetch(nextUrl, {
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

            const responseData: any = await response.json();
            console.log("LiveAvatar public avatars response:", responseData);

            // API returns { code: 1000, data: { count, next, previous, results: [...] }, message }
            if (responseData.data && responseData.data.results && Array.isArray(responseData.data.results)) {
                allAvatars = [...allAvatars, ...responseData.data.results];
                nextUrl = responseData.data.next || null;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                // Fallback for direct array in data
                allAvatars = [...allAvatars, ...responseData.data];
                nextUrl = null;
            } else if (Array.isArray(responseData)) {
                allAvatars = [...allAvatars, ...responseData];
                nextUrl = null;
            } else {
                nextUrl = null;
            }
        }

        console.log(`Loaded ${allAvatars.length} public avatars total`);
        return allAvatars;
    } catch (error) {
        console.error("Error fetching public avatars:", error);
        return [];
    }
}

// Extended PublicAvatar for user avatars with status
export interface UserAvatar extends PublicAvatar {
    status?: 'processing' | 'ready' | 'failed' | 'pending';
    training_progress?: number;
}

/**
 * Get list of user's own avatars (custom avatars created from video training)
 * API: GET /v1/avatars - returns all avatars for the authenticated user
 */
export async function getUserAvatars(): Promise<UserAvatar[]> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/avatars`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar user avatars error:", error);
            throw new Error(error.message || `Error fetching user avatars: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("LiveAvatar user avatars response:", responseData);

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
        console.error("Error fetching user avatars:", error);
        return [];
    }
}

/**
 * Get a specific avatar by ID
 * API: GET /v1/avatars/{avatar_id}
 */
export async function getAvatarById(avatarId: string): Promise<UserAvatar | null> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/avatars/${avatarId}`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar get avatar error:", error);
            return null;
        }

        const responseData = await response.json();
        console.log("LiveAvatar avatar details:", responseData);

        // API returns { code: 1000, data: {...}, message }
        if (responseData.data) {
            return responseData.data;
        }
        return responseData;
    } catch (error) {
        console.error("Error fetching avatar by ID:", error);
        return null;
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
    age?: string;
    use_case?: string;
    category?: string;
}

/**
 * OpenAI TTS Voices for CUSTOM mode
 * These voices are used when the digital twin operates in CUSTOM mode
 * with OpenAI's gpt-4o-mini-tts model
 */
export const OPENAI_TTS_VOICES: PublicVoice[] = [
    {
        id: 'alloy',
        name: 'Alloy',
        gender: 'neutral',
        language: 'multi',
        provider: 'openai',
        description: 'Voz neutral y versátil, ideal para asistentes profesionales',
    },
    {
        id: 'nova',
        name: 'Nova',
        gender: 'female',
        language: 'multi',
        provider: 'openai',
        description: 'Voz femenina cálida y amigable',
    },
    {
        id: 'shimmer',
        name: 'Shimmer',
        gender: 'female',
        language: 'multi',
        provider: 'openai',
        description: 'Voz femenina expresiva y dinámica',
    },
    {
        id: 'echo',
        name: 'Echo',
        gender: 'male',
        language: 'multi',
        provider: 'openai',
        description: 'Voz masculina profunda y resonante',
    },
    {
        id: 'fable',
        name: 'Fable',
        gender: 'male',
        language: 'multi',
        provider: 'openai',
        description: 'Voz masculina narradora, perfecta para explicaciones',
    },
    {
        id: 'onyx',
        name: 'Onyx',
        gender: 'male',
        language: 'multi',
        provider: 'openai',
        description: 'Voz masculina autoritaria y profesional',
    },
];

/**
 * Get OpenAI TTS voices for CUSTOM mode
 * Returns the static list of available OpenAI TTS voices
 */
export function getOpenAIVoices(): PublicVoice[] {
    return OPENAI_TTS_VOICES;
}

/**
 * Get list of private/cloned voices from LiveAvatar catalog
 * Uses voice_type=private parameter
 * @param language Optional language filter (e.g., "es", "en")
 */
export async function getPrivateVoices(language?: string): Promise<PublicVoice[]> {
    try {
        let url = `${LIVEAVATAR_API_URL}/voices?voice_type=private`;
        if (language) {
            url += `&language=${encodeURIComponent(language)}`;
        }
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar private voices error:", error);
            throw new Error(error.message || `Error fetching private voices: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("LiveAvatar private voices response:", responseData);

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
        console.error("Error fetching private voices:", error);
        return [];
    }
}

/**
 * Get list of public voices from LiveAvatar catalog
 * @param language Optional language filter (e.g., "es", "en")
 */
export async function getPublicVoices(language?: string): Promise<PublicVoice[]> {
    try {
        let url = `${LIVEAVATAR_API_URL}/voices`;
        if (language) {
            url += `?language=${encodeURIComponent(language)}`;
        }
        const response = await fetch(url, {
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

/**
 * Get a specific voice by ID including preview URL
 * API: GET /v1/voices/{voice_id}
 */
export async function getVoiceById(voiceId: string): Promise<PublicVoice | null> {
    try {
        const response = await fetch(`${LIVEAVATAR_API_URL}/voices/${voiceId}`, {
            method: "GET",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar get voice error:", error);
            return null;
        }

        const responseData = await response.json();
        console.log("LiveAvatar voice details:", responseData);

        // API returns { code: 1000, data: {...}, message }
        if (responseData.data) {
            return responseData.data;
        }
        return responseData;
    } catch (error) {
        console.error("Error fetching voice by ID:", error);
        return null;
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
            method: "PATCH",
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
 * Delete a LiveAvatar context
 * API: DELETE /v1/contexts/{context_id}
 */
export async function deleteContext(contextId: string): Promise<boolean> {
    try {
        console.log("Deleting LiveAvatar context:", contextId);

        const response = await fetch(`${LIVEAVATAR_API_URL}/contexts/${contextId}`, {
            method: "DELETE",
            headers: {
                "X-API-KEY": LIVEAVATAR_API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("LiveAvatar delete context error:", error);
            // Don't throw - just log and return false
            return false;
        }

        console.log("LiveAvatar context deleted successfully:", contextId);
        return true;
    } catch (error) {
        console.error("Error deleting context:", error);
        return false;
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

    // FULL Híbrido: Route LLM calls to our RAG endpoint
    if (config.llmConfigurationId) {
        requestBody.llm_configuration_id = config.llmConfigurationId;
        console.log("[LiveAvatar] FULL Híbrido — using custom LLM:", config.llmConfigurationId);
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
 * Create a LiveAvatar session token in CUSTOM mode
 * CUSTOM mode allows sending external audio for lip-sync (doesn't use LiveAvatar's LLM/TTS)
 */
export async function createCustomSessionToken(config: { avatarId: string; language?: string }): Promise<SessionTokenResponse> {
    if (!config.avatarId) {
        throw new Error("Se requiere un avatar configurado para iniciar la sesión.");
    }

    const requestBody: any = {
        mode: "CUSTOM",
        avatar_id: config.avatarId,
        avatar_persona: {
            language: config.language || "es",
        },
    };

    console.log("LiveAvatar CUSTOM mode request:", JSON.stringify(requestBody, null, 2));

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
        console.error("LiveAvatar CUSTOM token error:", error);
        throw new Error(error.message || `Error creating CUSTOM session: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("LiveAvatar CUSTOM token response:", responseData);

    if (responseData.data) {
        return responseData.data;
    }
    return responseData;
}

/**
 * Create a LiveAvatar session token in CUSTOM mode using OUR OWN LiveKit room.
 * 
 * This uses the livekit_config parameter to send the HeyGen avatar to our
 * LiveKit Cloud room, allowing us to use the @livekit/agents framework
 * with Turn Detector for intelligent end-of-turn detection.
 * 
 * @param config - Configuration including avatarId and LiveKit room details
 * @returns Session token response
 */
export interface OwnRoomConfig {
    avatarId: string;
    language?: string;
    livekitUrl: string;      // Our LiveKit Cloud URL
    livekitRoom: string;     // Room name in our account
    livekitClientToken: string;  // Token for the HeyGen avatar to join
}

export async function createCustomSessionWithOwnRoom(config: OwnRoomConfig): Promise<SessionTokenResponse> {
    if (!config.avatarId) {
        throw new Error("Se requiere un avatar configurado para iniciar la sesión.");
    }

    if (!config.livekitUrl || !config.livekitRoom || !config.livekitClientToken) {
        throw new Error("Se requieren las credenciales de LiveKit para usar nuestro propio room.");
    }

    const requestBody: any = {
        mode: "CUSTOM",
        avatar_id: config.avatarId,
        avatar_persona: {
            language: config.language || "es",
        },
        // This is the key addition - send avatar to our LiveKit room
        livekit_config: {
            livekit_url: config.livekitUrl,
            livekit_room: config.livekitRoom,
            livekit_client_token: config.livekitClientToken,
        },
    };

    console.log("[LiveAvatar] Creating CUSTOM session with OUR OWN LiveKit room");
    console.log("[LiveAvatar] livekit_config:", {
        url: config.livekitUrl,
        room: config.livekitRoom,
        token: config.livekitClientToken.substring(0, 20) + "...",
    });

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
        console.error("[LiveAvatar] Own room session token error:", error);
        throw new Error(error.message || `Error creating session with own room: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("[LiveAvatar] Own room session token created:", responseData.data?.session_id);

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
 * Start a LiveAvatar session in CUSTOM mode with external audio input
 * This allows us to send our own TTS audio for lip-sync
 */
export async function startCustomSession(sessionToken: string): Promise<SessionStartResponse> {
    console.log("Starting CUSTOM session with audio input...");

    const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/start`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input_type: "audio",  // External audio input for lip-sync
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("LiveAvatar CUSTOM start error:", error);
        throw new Error(error.message || `Error starting CUSTOM session: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("LiveAvatar CUSTOM start response:", responseData);

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
