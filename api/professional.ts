import { API_URL } from "./config";
import { User } from "./user";

/**
 * Interfaz Professional extiende User con campos específicos de userpro
 */
export interface Professional extends User {
    userType: 'userpro';
    profession: string;
    category: 'legal' | 'salud' | 'hogar' | 'educacion' | 'fitness' | 'otros';
    description?: string;
    rating: number;
    ratingCount: number;
    isOnline: boolean;
    isFeatured: boolean;
}

export interface ProfessionalFilters {
    category?: string;
    search?: string;
    featured?: boolean;
}

/**
 * Obtener lista de profesionales con filtros opcionales
 */
export async function getProfessionals(
    token: string,
    filters?: ProfessionalFilters
): Promise<Professional[]> {
    const params = new URLSearchParams();

    if (filters?.category && filters.category !== 'todos') {
        params.append('category', filters.category);
    }
    if (filters?.search) {
        params.append('search', filters.search);
    }
    if (filters?.featured) {
        params.append('featured', 'true');
    }

    const queryString = params.toString();
    const url = queryString
        ? `${API_URL}/professionals?${queryString}`
        : `${API_URL}/professionals`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Error al obtener profesionales');
    }

    return response.json();
}

/**
 * Obtener profesionales destacados (para carrusel horizontal)
 */
export async function getFeaturedProfessionals(token: string): Promise<Professional[]> {
    const response = await fetch(`${API_URL}/professionals/featured`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Error al obtener profesionales destacados');
    }

    return response.json();
}
