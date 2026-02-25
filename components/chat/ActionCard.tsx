import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAppointment } from '../../api/appointment';
import { createCheckoutSession } from '../../api/payment';

// ─── Shared Types ────────────────────────────────────────────────────

/** All supported action card types */
export type ActionCardType = 'appointment' | 'review' | 'payment' | 'form';

/** Base card status shared across all card types */
export type ActionCardStatus = 'proposed' | 'confirming' | 'confirmed' | 'pending_payment' | 'error';

/** Generic action card data — `cardType` determines the shape of `payload` */
export interface ActionCardData<T = any> {
    cardType: ActionCardType;
    payload: T;
    status?: 'proposed' | 'confirmed' | 'expired' | 'error';
}

/** Appointment-specific payload */
export interface AppointmentPayload {
    date: string;           // YYYY-MM-DD
    time: string;           // HH:MM
    type: string;           // 'presencial' | 'videoconference' | 'videollamada'
    duration?: number | null; // minutes (from twin proposal)
    professionalId: string;
    clientId: string;
    chatId: string;
    appointmentId?: string;
}

/** Payment-related info from the professional (used by appointment cards) */
export interface ProfessionalPaymentInfo {
    requirePaymentOnBooking?: boolean;
    appointmentPrices?: {
        videoconference?: Record<string, number>;
        presencial?: Record<string, number>;
    };
    appointmentDuration?: number;
}

/** Props for the root ActionCard component */
interface ActionCardProps {
    data: ActionCardData;
    token: string;
    professional?: ProfessionalPaymentInfo;
    onAction?: (result: { type: string; id?: string;[key: string]: any }) => void;
}

// ─── Design Tokens ───────────────────────────────────────────────────

const COLORS = {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',
    surface: 'rgba(99, 102, 241, 0.08)',
    surfaceBorder: 'rgba(99, 102, 241, 0.2)',
    text: '#1E1B4B',
    textSecondary: '#6B7280',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.3)',
    error: '#EF4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    white: '#FFFFFF',
};

// ─── Card Header Config ──────────────────────────────────────────────

interface CardHeaderConfig {
    icon: string;
    proposed: string;
    confirmed: string;
    pending_payment: string;
}

const CARD_HEADERS: Record<ActionCardType, CardHeaderConfig> = {
    appointment: {
        icon: 'calendar',
        proposed: 'Propuesta de Cita',
        confirmed: 'Cita Confirmada',
        pending_payment: 'Pendiente de Pago',
    },
    review: {
        icon: 'star',
        proposed: 'Solicitud de Reseña',
        confirmed: 'Reseña Enviada',
        pending_payment: '',
    },
    payment: {
        icon: 'card',
        proposed: 'Pago Pendiente',
        confirmed: 'Pago Completado',
        pending_payment: 'Procesando Pago',
    },
    form: {
        icon: 'document-text',
        proposed: 'Formulario',
        confirmed: 'Formulario Enviado',
        pending_payment: '',
    },
};

// ─── Utility Functions ───────────────────────────────────────────────

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatTime(timeStr: string): string {
    const [h, m] = timeStr.split(':');
    return `${parseInt(h)}:${m} h`;
}

function formatPrice(euros: number): string {
    return `${euros.toFixed(2).replace('.', ',')}€`;
}

function getAppointmentPrice(
    professional: ProfessionalPaymentInfo | undefined,
    appointmentType: string,
    proposalDuration?: number | null
): number {
    if (!professional?.appointmentPrices) return 0;

    const isVideo = appointmentType === 'videoconference' || appointmentType === 'videollamada';
    const priceCategory = isVideo ? 'videoconference' : 'presencial';
    const prices = professional.appointmentPrices[priceCategory];

    if (!prices) return 0;

    // Use proposal duration if provided, otherwise professional default
    const duration = proposalDuration || professional.appointmentDuration || 60;
    const durationKey = String(duration);

    console.log('[ActionCard:Price] Category:', priceCategory, 'Duration:', durationKey, 'Prices:', JSON.stringify(prices));

    const exactPrice = prices[durationKey as any];
    if (exactPrice && exactPrice > 0) {
        console.log('[ActionCard:Price] Exact match:', exactPrice);
        return exactPrice;
    }

    const entries = Object.entries(prices);
    const nonZeroEntry = entries.find(([_, p]) => typeof p === 'number' && p > 0);
    const fallbackPrice = nonZeroEntry ? (nonZeroEntry[1] as number) : 0;
    console.log('[ActionCard:Price] Fallback:', fallbackPrice);
    return fallbackPrice;
}

// ─── Root ActionCard Component ───────────────────────────────────────

export default function ActionCard({ data, token, professional, onAction }: ActionCardProps) {
    const [status, setStatus] = useState<ActionCardStatus>(
        data.status === 'confirmed' ? 'confirmed' : 'proposed'
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const headerConfig = CARD_HEADERS[data.cardType] || CARD_HEADERS.appointment;

    const headerTitle =
        status === 'confirmed' ? headerConfig.confirmed :
            status === 'pending_payment' ? headerConfig.pending_payment :
                headerConfig.proposed;

    const headerIcon = headerConfig.icon;

    return (
        <View style={[
            styles.card,
            status === 'confirmed' && styles.cardConfirmed,
            status === 'error' && styles.cardError,
        ]}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons
                    name={headerIcon as any}
                    size={20}
                    color={status === 'confirmed' ? COLORS.success : COLORS.primary}
                />
                <Text style={[styles.headerText, status === 'confirmed' && styles.headerTextConfirmed]}>
                    {headerTitle}
                </Text>
                {status === 'confirmed' && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                )}
            </View>

            {/* Delegated content */}
            {data.cardType === 'appointment' ? (
                <AppointmentCardContent
                    payload={data.payload as AppointmentPayload}
                    token={token}
                    professional={professional}
                    status={status}
                    setStatus={setStatus}
                    errorMsg={errorMsg}
                    setErrorMsg={setErrorMsg}
                    onAction={onAction}
                />
            ) : (
                <GenericCardContent
                    data={data}
                    status={status}
                />
            )}

            {/* Shared status indicators */}
            {status === 'confirming' && (
                <View style={styles.confirmingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.confirmingText}>Confirmando...</Text>
                </View>
            )}

            {status === 'pending_payment' && (
                <View style={styles.confirmedBadge}>
                    <Ionicons name="card-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.confirmedText}>
                        Cita reservada · Completa el pago en tu navegador
                    </Text>
                </View>
            )}

            {status === 'error' && errorMsg && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            )}
        </View>
    );
}

// ─── Appointment Sub-Component ───────────────────────────────────────

interface AppointmentCardContentProps {
    payload: AppointmentPayload;
    token: string;
    professional?: ProfessionalPaymentInfo;
    status: ActionCardStatus;
    setStatus: (s: ActionCardStatus) => void;
    errorMsg: string | null;
    setErrorMsg: (msg: string | null) => void;
    onAction?: (result: { type: string; id?: string;[key: string]: any }) => void;
}

function AppointmentCardContent({
    payload, token, professional, status, setStatus, setErrorMsg, onAction,
}: AppointmentCardContentProps) {
    const isVideoCall = payload.type === 'videoconference' || payload.type === 'videollamada';
    const typeLabel = isVideoCall ? 'Videollamada' : 'Presencial';
    const typeIcon = isVideoCall ? 'videocam' : 'location';

    // Use proposal duration if available, otherwise professional's default
    const duration = payload.duration || professional?.appointmentDuration || 60;
    const price = getAppointmentPrice(professional, payload.type, payload.duration);
    const requiresPayment = price > 0 && (
        isVideoCall || professional?.requirePaymentOnBooking !== false
    );

    const handleConfirm = async () => {
        if (status !== 'proposed') return;
        setStatus('confirming');
        setErrorMsg(null);

        try {
            const result = await createAppointment(token, {
                professionalId: payload.professionalId,
                date: payload.date,
                time: payload.time,
                type: isVideoCall ? 'videoconference' : 'presencial',
                serviceType: duration === 30 ? '30min' : duration === 60 ? '60min' : 'custom',
                duration,
                price,
            });

            if (result.requiresPayment) {
                setStatus('pending_payment');
                try {
                    const session = await createCheckoutSession(token, result._id);
                    const canOpen = await Linking.canOpenURL(session.url);
                    if (canOpen) {
                        await Linking.openURL(session.url);
                    } else {
                        setErrorMsg('No se pudo abrir el enlace de pago');
                        setStatus('error');
                    }
                    onAction?.({ type: 'appointment_confirmed', id: result._id });
                } catch (payError: any) {
                    console.error('[ActionCard] Payment error:', payError);
                    setErrorMsg('Error al iniciar el pago. Puedes pagar desde los detalles de la cita.');
                    setStatus('error');
                    onAction?.({ type: 'appointment_confirmed', id: result._id });
                }
            } else {
                setStatus('confirmed');
                onAction?.({ type: 'appointment_confirmed', id: result._id });
            }
        } catch (err: any) {
            console.error('[ActionCard] Error creating appointment:', err);
            setStatus('error');
            setErrorMsg(err?.message || 'No se pudo confirmar la cita');
            setTimeout(() => setStatus('proposed'), 3000);
        }
    };

    return (
        <>
            {/* Details */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{formatDate(payload.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{formatTime(payload.time)} ({duration} min)</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name={typeIcon as any} size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{typeLabel}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>
                        {price > 0
                            ? (requiresPayment
                                ? `${formatPrice(price)} (pago online)`
                                : `${formatPrice(price)} (pago in situ)`)
                            : "Gratuita"}
                    </Text>
                </View>
            </View>

            {/* CTA Button */}
            {status === 'proposed' && (
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={requiresPayment ? "card" : "checkmark-circle"}
                        size={18}
                        color={COLORS.white}
                    />
                    <Text style={styles.confirmButtonText}>
                        {requiresPayment ? 'Reservar y Pagar' : 'Confirmar Cita'}
                    </Text>
                </TouchableOpacity>
            )}

            {status === 'confirmed' && (
                <View style={styles.confirmedBadge}>
                    <Ionicons name="checkmark" size={14} color={COLORS.success} />
                    <Text style={styles.confirmedText}>
                        {!requiresPayment ? 'Reservada con éxito (pago in situ)' : 'Reservada con éxito'}
                    </Text>
                </View>
            )}
        </>
    );
}

// ─── Generic Placeholder (for future card types) ─────────────────────

function GenericCardContent({ data, status }: { data: ActionCardData; status: ActionCardStatus }) {
    return (
        <View style={styles.details}>
            <Text style={styles.detailText}>
                Tarjeta tipo "{data.cardType}" — próximamente
            </Text>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.surfaceBorder,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 4,
        maxWidth: 300,
    },
    cardConfirmed: {
        backgroundColor: COLORS.successBg,
        borderColor: COLORS.successBorder,
    },
    cardError: {
        backgroundColor: COLORS.errorBg,
        borderColor: COLORS.error,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    headerText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        flex: 1,
    },
    headerTextConfirmed: {
        color: COLORS.success,
    },
    details: {
        gap: 8,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    confirmingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    confirmingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    confirmedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    confirmedText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '500',
    },
});
