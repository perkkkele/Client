import { API_URL } from "./config";
import { Location } from "./user";

// Tipos de cita
export type AppointmentType = "presencial" | "videoconference";
export type ServiceType = "30min" | "60min" | "custom";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
    _id: string;
    professional: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
        profession?: string;
        publicName?: string;
        phone?: string;
        professionalEmail?: string;
        location?: Location;
        category?: string;
        requirePaymentOnBooking?: boolean;  // If false, presencial appointments are paid in-situ
    };
    client: {
        _id: string;
        firstname: string;
        lastname: string;
        avatar?: string;
        email: string;
        phone?: string;
    };
    date: string;
    time: string;
    duration: number;
    type: AppointmentType;
    serviceType: ServiceType;
    price: number;
    currency: string;
    meetingLink?: string | null;
    location?: Location;
    status: AppointmentStatus;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
    notes?: string | null;
    createdAt: string;
    confirmedAt?: string | null;
    cancelledAt?: string | null;
    completedAt?: string | null;
    paidAt?: string | null;
    refundedAt?: string | null;
    chat?: string;  // Associated chat ID for video call navigation
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

// Datos para crear una cita
export interface CreateAppointmentData {
    professionalId: string;
    date: string;
    time: string;
    type: AppointmentType;
    serviceType: ServiceType;
    price: number;
    notes?: string;
}

// Create a new appointment
export async function createAppointment(
    token: string,
    data: CreateAppointmentData
): Promise<Appointment> {
    const url = `${API_URL}/appointment`;
    console.log("[Appointment API] POST", url, data);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    // Check content type to ensure it's JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[Appointment API] Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create appointment");
    }

    const appointment = await response.json();
    console.log("[Appointment API] Created appointment:", appointment._id);
    return appointment;
}

// Get available slots for a specific date
export async function getAvailableSlots(
    token: string,
    professionalId: string,
    date: string,
    type?: AppointmentType
): Promise<AvailableSlotsResponse> {
    const queryParams = type ? `?type=${type}` : '';
    const response = await fetch(`${API_URL}/appointment/slots/${professionalId}/${date}${queryParams}`, {
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
    const url = `${API_URL}/appointment?role=${role}`;
    console.log("[Appointment API] GET", url);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("[Appointment API] Error:", error);
        throw new Error(error.message || "Failed to get appointments");
    }

    const data = await response.json();
    console.log("[Appointment API] getAppointments response:", data.length, "appointments");
    return data;
}

// Get appointment by ID
export async function getAppointmentById(
    token: string,
    appointmentId: string
): Promise<Appointment> {
    const url = `${API_URL}/appointment/${appointmentId}`;
    console.log("[Appointment API] GET", url);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    // Check content type to ensure it's JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[Appointment API] Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get appointment");
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

// Reschedule an appointment (professional only)
export async function rescheduleAppointment(
    token: string,
    appointmentId: string,
    newDate: string,
    newTime: string,
    comments?: string
): Promise<Appointment> {
    const response = await fetch(`${API_URL}/appointment/${appointmentId}/reschedule`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newDate, newTime, comments }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reschedule appointment");
    }

    return response.json();
}
