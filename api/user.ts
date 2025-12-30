import { API_URL } from "./config";

export type UserType = 'user' | 'userpro';
export type CategoryType = 'legal' | 'salud' | 'hogar' | 'educacion' | 'fitness' | 'tecnologia' | 'diseno' | 'bienestar' | 'inmobiliario' | 'estetica' | 'empleo' | 'finanzas' | 'energia' | 'otros';

// Interfaces auxiliares
export interface ScheduleDay {
    from?: string;
    to?: string;
    enabled: boolean;
}

export interface Schedule {
    monday: ScheduleDay;
    tuesday: ScheduleDay;
    wednesday: ScheduleDay;
    thursday: ScheduleDay;
    friday: ScheduleDay;
    saturday: ScheduleDay;
    sunday: ScheduleDay;
}

export interface SocialLinks {
    linkedin?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    facebook?: string | null;
}

export interface Location {
    address?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
}

export interface DigitalTwinPersonality {
    traits?: string[];
    greeting?: string | null;
    description?: string | null;
}

export interface DigitalTwinBehavior {
    formality?: number; // 0-2
    depth?: number;     // 0-2
    tone?: number;      // 0-2
    objective?: string | null;  // Objetivo general del gemelo digital
}

export interface DigitalTwinGuardrails {
    allowed?: string[];
    restricted?: string[];
}

export interface DigitalTwinKnowledgeLinks {
    faq?: string | null;
    services?: string | null;
    pricing?: string | null;
    policy?: string | null;
    troubleshooting?: string | null;
    other?: string | null;
}

export interface DigitalTwinKnowledge {
    links?: DigitalTwinKnowledgeLinks;
    contextPrompt?: string | null;
    documents?: Array<{
        name: string;
        type: 'servicios' | 'precios' | 'faqs' | 'otro';
        url: string;
        uploadedAt?: string;
    }>;
    trainingProgress?: number;
    trainingStatus?: 'pending' | 'training' | 'ready' | null;
}

export interface DigitalTwinAppearance {
    videoType?: 'predefined' | 'trained' | null;
    videoId?: string | null;
    voiceType?: 'standard' | 'cloned' | null;
    voiceId?: string | null;
    liveAvatarId?: string | null;
    liveAvatarName?: string | null;
    liveAvatarPreview?: string | null;
    liveVoiceId?: string | null;
    liveVoiceName?: string | null;
    liveVoiceGender?: string | null;
    liveVoiceLanguage?: string | null;
}

export interface DigitalTwin {
    appearance?: DigitalTwinAppearance;
    personality?: DigitalTwinPersonality;
    behavior?: DigitalTwinBehavior;
    guardrails?: DigitalTwinGuardrails;
    knowledge?: DigitalTwinKnowledge;
    liveAvatarContextId?: string | null;
    isActive?: boolean;
    activatedAt?: string | null;
}

export interface User {
    _id: string;
    email: string;

    // === Campos comunes ===
    firstname?: string;
    lastname?: string;
    avatar?: string;
    userType: UserType;
    interests?: string[];
    createdAt?: string;
    lastActive?: string;

    // === Campos profesionales ===
    publicName?: string | null;
    profession?: string | null;
    category?: CategoryType | null;
    specialties?: string[];
    bio?: string | null;
    username?: string | null;  // Para QR code URL: twinpro.app/@username

    // Contacto profesional
    professionalEmail?: string | null;
    phone?: string | null;
    website?: string | null;
    location?: Location;
    schedule?: Schedule;
    socialLinks?: SocialLinks;
    connectedCalendar?: {
        provider?: 'google' | 'outlook' | 'apple' | null;
        connected?: boolean;
    };

    // Estadísticas
    rating?: number;
    ratingCount?: number;
    isOnline?: boolean;
    isFeatured?: boolean;
    priceRange?: 1 | 2 | 3 | null;
    tags?: string[];

    // === Configuración de Citas ===
    appointmentsEnabled?: boolean;
    appointmentDuration?: number;
    appointmentHours?: {
        start?: string;
        end?: string;
    };
    autoConfirmAppointments?: boolean;

    // === Gemelo Digital ===
    digitalTwin?: DigitalTwin;
}

// Tipo para actualizaciones parciales del usuario
export interface UserUpdateData {
    // Campos comunes
    firstname?: string;
    lastname?: string;
    interests?: string[];

    // Cambio a profesional
    userType?: UserType;

    // Campos profesionales
    publicName?: string;
    profession?: string;
    category?: CategoryType;
    specialties?: string[];
    bio?: string;

    // Contacto
    professionalEmail?: string;
    phone?: string;
    website?: string;
    location?: Location;
    schedule?: Schedule;
    socialLinks?: SocialLinks;
    connectedCalendar?: {
        provider?: 'google' | 'outlook' | 'apple' | null;
        connected?: boolean;
    };

    // Precios/tags
    priceRange?: 1 | 2 | 3;
    tags?: string[];

    // Configuración de citas
    appointmentsEnabled?: boolean;
    appointmentHours?: {
        start?: string;
        end?: string;
    };
    autoConfirmAppointments?: boolean;

    // Gemelo Digital
    digitalTwin?: DigitalTwin;
}

export async function getMe(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuario");
    }

    return response.json();
}

export async function getUsers(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/user`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuarios");
    }

    return response.json();
}

export async function getUser(token: string, userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener usuario");
    }

    return response.json();
}

export async function updateUser(
    token: string,
    data: UserUpdateData
): Promise<User> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al actualizar usuario");
    }

    return response.json();
}

export async function updateAvatar(
    token: string,
    imageUri: string
): Promise<User> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();

        // Get the file extension and create proper file info
        const uriParts = imageUri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("avatar", {
            uri: imageUri,
            name: `avatar.${fileType}`,
            type: `image/${fileType}`,
        } as any);

        console.log("Uploading avatar:", { uri: imageUri, type: `image/${fileType}` });

        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", `${API_URL}/user/me`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        // Don't set Content-Type - let XHR handle multipart boundary

        xhr.onload = () => {
            console.log("Avatar upload response:", xhr.status, xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error("Error parsing response"));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.msg || error.message || `Error ${xhr.status}`));
                } catch (e) {
                    reject(new Error(`Error del servidor (${xhr.status})`));
                }
            }
        };

        xhr.onerror = () => {
            console.error("XHR error:", xhr.status, xhr.statusText);
            reject(new Error("Error de red al subir la imagen. Verifica tu conexión."));
        };

        xhr.ontimeout = () => {
            reject(new Error("Tiempo de espera agotado al subir la imagen"));
        };

        xhr.timeout = 30000; // 30 second timeout
        xhr.send(formData);
    });
}

export async function deleteAccount(token: string): Promise<{ msg: string }> {
    const response = await fetch(`${API_URL}/user/me`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al eliminar la cuenta");
    }

    return response.json();
}

// === Funciones de Favoritos ===

export async function getFavorites(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/user/favorites`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener favoritos");
    }

    return response.json();
}

export async function addFavorite(token: string, professionalId: string): Promise<{ msg: string; favorites: User[] }> {
    const response = await fetch(`${API_URL}/user/favorites/${professionalId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al añadir a favoritos");
    }

    return response.json();
}

export async function removeFavorite(token: string, professionalId: string): Promise<{ msg: string; favorites: User[] }> {
    const response = await fetch(`${API_URL}/user/favorites/${professionalId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al eliminar de favoritos");
    }

    return response.json();
}
