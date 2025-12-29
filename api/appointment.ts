import { API_HOST, API_PORT } from "./config";

const API_URL = `http://${API_HOST}:${API_PORT}/api`;

export interface Appointment {
    _id: string;
    professional: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
        profession?: string;
        publicName?: string;
    };
    client: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
        email: string;
    };
    date: string;
    time: string;
    duration: number;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    notes?: string;
    createdAt: string;
    confirmedAt?: string;
    cancelledAt?: string;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface AvailableSlotsResponse {
    date: string;
    professionalId: string;
    duration: number;
    slots: TimeSlot[];
}

// Create a new appointment
export async function createAppointment(
    token: string,
    professionalId: string,
    date: string,
    time: string,
    notes?: string
): Promise<Appointment> {
    const response = await fetch(`${API_URL}/appointment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ professionalId, date, time, notes }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create appointment");
    }

    return response.json();
}

// Get available slots for a specific date
export async function getAvailableSlots(
    token: string,
    professionalId: string,
    date: string
): Promise<AvailableSlotsResponse> {
    const response = await fetch(`${API_URL}/appointment/slots/${professionalId}/${date}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get available slots");
    }

    return response.json();
}

// Get user's appointments
export async function getAppointments(
    token: string,
    role: "client" | "professional" = "client"
): Promise<Appointment[]> {
    const response = await fetch(`${API_URL}/appointment?role=${role}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get appointments");
    }

    return response.json();
}

// Confirm an appointment (professional only)
export async function confirmAppointment(
    token: string,
    appointmentId: string
): Promise<Appointment> {
    const response = await fetch(`${API_URL}/appointment/${appointmentId}/confirm`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to confirm appointment");
    }

    return response.json();
}

// Cancel an appointment
export async function cancelAppointment(
    token: string,
    appointmentId: string
): Promise<Appointment> {
    const response = await fetch(`${API_URL}/appointment/${appointmentId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel appointment");
    }

    return response.json();
}
