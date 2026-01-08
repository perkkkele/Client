/**
 * Digital Twin Context Management
 * 
 * Centralized functions for managing LiveAvatar context regeneration
 * when digital twin settings (appearance, personality, knowledge) change.
 */

import * as liveAvatarApi from "./liveAvatar";
import * as userApi from "./user";

/**
 * Build the context prompt from user data.
 * This includes professional info, behavior settings, and guardrails.
 */
export function buildContextPrompt(user: any): string {
    const parts: string[] = [];

    // Professional info
    if (user?.publicName || user?.profession) {
        parts.push(`Eres ${user.publicName || 'un profesional'}, ${user.profession || 'experto en tu campo'}.`);
    }
    if (user?.bio) {
        parts.push(user.bio);
    }

    // Objective - what the twin should achieve
    const objective = user?.digitalTwin?.behavior?.objective;
    if (objective) {
        parts.push(`Tu objetivo principal es: ${objective}`);
    }

    // Behavior settings
    const behavior = user?.digitalTwin?.behavior;
    if (behavior) {
        const formalityLabels = ["muy cercano y amigable", "profesional y equilibrado", "muy formal y respetuoso"];
        const depthLabels = ["respuestas cortas y directas", "respuestas equilibradas", "respuestas detalladas y completas"];
        const toneLabels = ["empático y comprensivo", "neutral y objetivo", "directo y conciso"];

        parts.push(`Tu estilo de comunicación es ${formalityLabels[behavior.formality || 1]}.`);
        parts.push(`Das ${depthLabels[behavior.depth || 1]}.`);
        parts.push(`Tu tono es ${toneLabels[behavior.tone || 0]}.`);
    }

    // Guardrails
    const guardrails = user?.digitalTwin?.guardrails;
    if (guardrails) {
        if (guardrails.allowed && guardrails.allowed.length > 0) {
            parts.push(`Puedes: ${guardrails.allowed.join(', ')}.`);
        }
        if (guardrails.restricted && guardrails.restricted.length > 0) {
            parts.push(`No debes: ${guardrails.restricted.join(', ')}.`);
        }
    }

    // Specialties
    if (user?.specialties && user.specialties.length > 0) {
        parts.push(`Tus especialidades incluyen: ${user.specialties.join(', ')}.`);
    }

    return parts.join(' ');
}

/**
 * Build context name for LiveAvatar
 */
export function buildContextName(user: any): string {
    const userId = user?._id || Date.now().toString();
    return `TwinPro - ${user?.publicName || user?.firstname || 'Professional'} (${userId.toString().slice(-6)})`;
}

/**
 * Regenerate the LiveAvatar context with current user data.
 * Creates a new context if none exists, or updates the existing one.
 * 
 * @param token - Auth token
 * @param user - Fresh user data with digitalTwin configuration
 * @returns The context ID (new or existing)
 */
export async function regenerateDigitalTwinContext(
    token: string,
    user: any
): Promise<string | null> {
    try {
        console.log("[DigitalTwinContext] Regenerating context...");

        // Build the context prompt
        const contextPrompt = buildContextPrompt(user);
        const contextName = buildContextName(user);
        const existingContextId = user?.digitalTwin?.liveAvatarContextId;

        console.log("[DigitalTwinContext] Context name:", contextName);
        console.log("[DigitalTwinContext] Existing context ID:", existingContextId);
        console.log("[DigitalTwinContext] Prompt length:", contextPrompt.length);

        let contextId: string | null = null;
        let shouldDeleteOldContext = false;
        let oldContextIdToDelete: string | null = null;

        if (existingContextId) {
            // Try to update existing context first
            console.log("[DigitalTwinContext] Updating existing context...");
            const result = await liveAvatarApi.updateContext(
                existingContextId,
                contextName,
                contextPrompt,
                [] // Links are optional, prompt contains the key info
            );
            if (result) {
                contextId = result.id;
                console.log("[DigitalTwinContext] Context updated:", contextId);
            } else {
                // Update failed, will need to create new context and delete old one
                console.log("[DigitalTwinContext] Update failed, will create new context and delete old");
                shouldDeleteOldContext = true;
                oldContextIdToDelete = existingContextId;
            }
        }

        // If no existing context or update failed, create a new one
        if (!contextId) {
            console.log("[DigitalTwinContext] Creating new context...");
            try {
                const result = await liveAvatarApi.createContext(
                    contextName,
                    contextPrompt,
                    []
                );
                if (result) {
                    contextId = result.id;
                    console.log("[DigitalTwinContext] Context created:", contextId);

                    // If we had an old context that we're replacing, delete it now
                    if (shouldDeleteOldContext && oldContextIdToDelete) {
                        console.log("[DigitalTwinContext] Deleting old context:", oldContextIdToDelete);
                        await liveAvatarApi.deleteContext(oldContextIdToDelete);
                    }
                }
            } catch (createError: any) {
                // If context with name exists, try with a more unique name
                if (createError.message?.includes("already exists")) {
                    console.log("[DigitalTwinContext] Name exists, trying with timestamp...");
                    const uniqueName = `TwinPro - ${user?.publicName || 'Professional'} (${Date.now()})`;
                    const result = await liveAvatarApi.createContext(
                        uniqueName,
                        contextPrompt,
                        []
                    );
                    if (result) {
                        contextId = result.id;
                        console.log("[DigitalTwinContext] Context created with unique name:", contextId);

                        // Delete old context if we're replacing it
                        if (shouldDeleteOldContext && oldContextIdToDelete) {
                            console.log("[DigitalTwinContext] Deleting old context:", oldContextIdToDelete);
                            await liveAvatarApi.deleteContext(oldContextIdToDelete);
                        }
                    }
                } else {
                    throw createError;
                }
            }
        }

        // If we have a new/updated context ID, save it and clear the sync flag
        if (contextId) {
            await userApi.updateUser(token, {
                digitalTwin: {
                    liveAvatarContextId: contextId,
                    contextNeedsSync: false
                }
            });
            console.log("[DigitalTwinContext] Saved context ID and cleared sync flag");
        }

        return contextId;
    } catch (error: any) {
        console.error("[DigitalTwinContext] Error regenerating context:", error);
        throw error;
    }
}

/**
 * Check if the digital twin context needs synchronization and regenerate if needed.
 * Call this before starting a LiveAvatar session.
 * 
 * @param token - Auth token
 * @param user - User data (will be refreshed if sync needed)
 * @returns Updated context ID
 */
export async function ensureContextSynced(
    token: string,
    user: any
): Promise<string | null> {
    const needsSync = user?.digitalTwin?.contextNeedsSync === true;
    const hasContext = !!user?.digitalTwin?.liveAvatarContextId;

    console.log("[DigitalTwinContext] ensureContextSynced - needsSync:", needsSync, "hasContext:", hasContext);

    if (needsSync || !hasContext) {
        // Get fresh user data before regenerating
        const freshUser = await userApi.getMe(token);
        return await regenerateDigitalTwinContext(token, freshUser);
    }

    return user?.digitalTwin?.liveAvatarContextId || null;
}
