import { API_URL } from "./config";

/**
 * Interface para una reseña
 */
export interface Review {
    _id: string;
    author: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string | null;
    };
    professional: string;
    rating: number;
    comment: string;
    tags: string[];
    reply?: {
        text: string;
        repliedAt: string;
    } | null;
    createdAt: string;
}

export interface ReviewsResponse {
    reviews: Review[];
    total: number;
    topTags: { tag: string; count: number }[];
    rating: number;
    ratingCount: number;
}

export interface CreateReviewData {
    professionalId: string;
    rating: number;
    comment: string;
    tags?: string[];
}

/**
 * Crear una nueva reseña
 */
export async function createReview(
    token: string,
    data: CreateReviewData
): Promise<{ msg: string; review: Review }> {
    const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al crear la reseña");
    }

    return response.json();
}

/**
 * Obtener reseñas de un profesional
 */
export async function getReviewsForProfessional(
    professionalId: string,
    sortBy: 'recent' | 'highest' | 'lowest' = 'recent',
    limit: number = 50,
    skip: number = 0
): Promise<ReviewsResponse> {
    const params = new URLSearchParams({
        sortBy,
        limit: limit.toString(),
        skip: skip.toString()
    });

    const response = await fetch(
        `${API_URL}/reviews/professional/${professionalId}?${params}`,
        { method: "GET" }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener reseñas");
    }

    return response.json();
}

/**
 * Eliminar una reseña
 */
export async function deleteReview(
    token: string,
    reviewId: string
): Promise<{ msg: string }> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al eliminar la reseña");
    }

    return response.json();
}

/**
 * Profesional responde a una reseña
 */
export async function replyToReview(
    token: string,
    reviewId: string,
    text: string
): Promise<{ msg: string; review: Review }> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al responder a la reseña");
    }

    return response.json();
}

/**
 * Obtener reseñas escritas por el usuario actual
 */
export async function getMyReviews(
    token: string,
    userId: string
): Promise<{ reviews: Review[] }> {
    const response = await fetch(`${API_URL}/reviews/user/${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || "Error al obtener mis reseñas");
    }

    return response.json();
}
