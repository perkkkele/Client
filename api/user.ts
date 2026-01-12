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
    tiktok?: string | null;
    youtube?: string | null;
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
    manualContent?: {
        faq?: string | null;
        services?: string | null;
        pricing?: string | null;
        policy?: string | null;
        troubleshooting?: string | null;
    };
    contextPrompt?: string | null;
    documents?: KnowledgeDocument[];
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
    contextNeedsSync?: boolean;  // Flag to trigger context regeneration
    isActive?: boolean;
    activatedAt?: string | null;
    sessionLimitMinutes?: number;  // Per-client session time limit (0 = no limit)
    disclaimer?: string | null;  // Professional's disclaimer text for clients
}

export interface EscalationTriggers {
    clientRequest?: boolean;  // Client can manually request to talk to professional
    twinUnable?: boolean;     // Twin suggests escalation when it can't respond
    keywords?: boolean;       // Specific keywords trigger escalation
}

export interface Escalation {
    enabled?: boolean;
    triggers?: EscalationTriggers;
    keywords?: string[];
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
    language?: 'es' | 'en' | 'fr' | 'de' | null;  // Idioma preferido del usuario
    createdAt?: string;
    lastActive?: string;

    // === Campos profesionales ===
    publicName?: string | null;
    profession?: string | null;
    businessName?: string | null;  // Nombre de empresa/marca profesional
    businessType?: 'Autónomo' | 'Empresa' | 'Clínica/Centro' | null;
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
    contactVisibility?: {
        email?: boolean;
        phone?: boolean;
        website?: boolean;
    };
    connectedCalendar?: {
        provider?: 'google' | 'outlook' | 'apple' | null;
        connected?: boolean;
    };

    // Estadísticas
    rating?: number;
    ratingCount?: number;
    isOnline?: boolean;
    isFeatured?: boolean;
    isVerified?: boolean;  // Professional verified by TwinPro
    priceRange?: 1 | 2 | 3 | null;
    tags?: string[];

    // === Configuración de Citas ===
    appointmentsEnabled?: boolean;
    appointmentDuration?: number;  // LEGACY - usar appointmentDurations
    appointmentDurations?: {
        videoconference?: number;
        presencial?: number;
    };
    appointmentHours?: {
        start?: string;
        end?: string;
    };
    appointmentTypesEnabled?: {
        videoconference?: boolean;
        presencial?: boolean;
    };
    appointmentPrices?: {
        videoconference?: Record<number, number>;
        presencial?: Record<number, number>;
    };
    workSchedule?: {
        workDays?: number[];
        defaultHours?: { start?: string; end?: string };
        dayOverrides?: Array<{ day: number; enabled: boolean; start: string; end: string }>;
        breaks?: Array<{ start: string; end: string }>;
    };
    autoConfirmAppointments?: boolean;
    requirePaymentOnBooking?: boolean;  // Si citas presenciales requieren pago al agendar

    // === Gemelo Digital ===
    digitalTwin?: DigitalTwin;

    // === Escalación a Profesional ===
    escalation?: Escalation;

    // === Stripe Connect (pagos directos a profesionales) ===
    stripeConnectAccountId?: string | null;
    stripeConnectOnboarded?: boolean;
    stripeConnectDetailsSubmitted?: boolean;
    stripeConnectChargesEnabled?: boolean;
    stripeConnectPayoutsEnabled?: boolean;

    // === Suscripción Profesional ===
    subscription?: {
        plan?: 'starter' | 'professional' | 'premium';
        stripeSubscriptionId?: string | null;
        stripeCustomerId?: string | null;
        status?: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
        currentPeriodStart?: string | null;
        currentPeriodEnd?: string | null;
        minutesUsed?: number;
        minutesIncluded?: number;
        minutesResetDate?: string | null;
        extraMinutesUsed?: number;
        extraMinutePrice?: number;
    };

    // === Verificaciones ===
    verification?: {
        identityVerified?: boolean;
        identityVerifiedAt?: string | null;
        professionalVerified?: boolean;
        professionalVerifiedAt?: string | null;
        professionalVerificationData?: {
            declarationAccepted?: boolean;
            licenseNumber?: string | null;
            additionalInfo?: string | null;
            documents?: Array<{
                id: string;
                filename: string;
                url: string;
                uploadedAt: string;
            }>;
            submittedAt?: string | null;
        };
    };
}

// Tipo para actualizaciones parciales del usuario
export interface UserUpdateData {
    // Campos comunes
    firstname?: string;
    lastname?: string;
    interests?: string[];
    language?: 'es' | 'en' | 'fr' | 'de';  // Idioma preferido del usuario

    // Cambio a profesional
    userType?: UserType;

    // Campos profesionales
    publicName?: string;
    profession?: string;
    businessName?: string;  // Nombre de empresa/marca profesional
    businessType?: 'Autónomo' | 'Empresa' | 'Clínica/Centro';
    category?: CategoryType;
    specialties?: string[];
    bio?: string;
    username?: string;  // Alias único para URL: twinpro.app/@username

    // Contacto
    professionalEmail?: string;
    phone?: string;
    website?: string;
    location?: Location;
    schedule?: Schedule;
    socialLinks?: SocialLinks;
    contactVisibility?: {
        email?: boolean;
        phone?: boolean;
        website?: boolean;
    };
    connectedCalendar?: {
        provider?: 'google' | 'outlook' | 'apple' | null;
        connected?: boolean;
    };

    // Precios/tags
    priceRange?: 1 | 2 | 3;
    tags?: string[];

    // Configuración de citas
    appointmentsEnabled?: boolean;
    appointmentDuration?: number;
    appointmentDurations?: {
        videoconference?: number;
        presencial?: number;
    };
    appointmentHours?: {
        start?: string;
        end?: string;
    };
    appointmentTypesEnabled?: {
        videoconference?: boolean;
        presencial?: boolean;
    };
    appointmentPrices?: {
        videoconference?: Record<number, number>;
        presencial?: Record<number, number>;
    };
    workSchedule?: {
        workDays?: number[];
        defaultHours?: { start?: string; end?: string };
        dayOverrides?: Array<{ day: number; enabled: boolean; start: string; end: string }>;
        breaks?: Array<{ start: string; end: string }>;
    };
    autoConfirmAppointments?: boolean;
    requirePaymentOnBooking?: boolean;  // Si citas presenciales requieren pago al agendar

    // Gemelo Digital
    digitalTwin?: DigitalTwin;

    // Escalación a profesional
    escalation?: Escalation;
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

// === Funciones de Documentos para Base de Conocimientos ===

export interface KnowledgeDocument {
    id: string;
    name: string;
    category: 'faq' | 'services' | 'pricing' | 'policy' | 'troubleshooting' | 'other';
    filename: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
}

/**
 * Subir documento para la base de conocimientos
 */
export async function uploadKnowledgeDocument(
    token: string,
    category: string,
    file: { uri: string; name: string; type: string }
): Promise<{ msg: string; document: KnowledgeDocument; documents: KnowledgeDocument[] }> {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('document', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as any);

    const response = await fetch(`${API_URL}/user/knowledge-document`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al subir el documento");
    }

    return response.json();
}

/**
 * Eliminar documento de la base de conocimientos
 */
export async function deleteKnowledgeDocument(
    token: string,
    documentId: string
): Promise<{ msg: string; documents: KnowledgeDocument[] }> {
    const response = await fetch(`${API_URL}/user/knowledge-document/${documentId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al eliminar el documento");
    }

    return response.json();
}
