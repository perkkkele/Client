/**
 * Manage Appointments Screen - Professional
 * 
 * Redesigned appointment management interface with search, tabs,
 * pending confirmations banner, and new appointment cards.
 */

import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
    Platform,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
// Note: DateTimePicker not installed - using TextInput for date selection
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";
import * as appointmentApi from "../../api/appointment";
import { Appointment } from "../../api/appointment";
import { createChat } from "../../api/chat";
import * as calendarApi from "../../api/calendar";
import { useAlert } from "../../components/TwinProAlert";
import { useTranslation } from 'react-i18next';

// =============================================================================
// COLORS
// =============================================================================
const COLORS = {
    primary: "#4F46E5",        // Indigo
    primaryLight: "#EEF2FF",
    backgroundLight: "#f3f4f6",
    surfaceLight: "#FFFFFF",
    textMain: "#1F2937",
    textMuted: "#6B7280",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green500: "#22c55e",
    green600: "#16a34a",
    green700: "#15803d",
    orange50: "#fff7ed",
    orange100: "#ffedd5",
    orange400: "#fb923c",
    orange500: "#f97316",
    orange600: "#ea580c",
    purple50: "#faf5ff",
    purple100: "#f3e8ff",
    purple600: "#9333ea",
    purple700: "#7c3aed",
    blue50: "#eff6ff",
    blue100: "#dbeafe",
    blue600: "#2563eb",
    red50: "#fef2f2",
    red500: "#ef4444",
    red600: "#dc2626",
    red700: "#b91c1c",
    yellow50: "#fefce8",
    yellow600: "#ca8a04",
    yellow700: "#a16207",
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}

const LOCALE_MAP: Record<string, string> = {
    es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE',
};

function formatDate(dateStr: string, locale: string, t: any): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return t('manageAppointmentsScreen.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return t('manageAppointmentsScreen.tomorrow');
    } else {
        return date.toLocaleDateString(locale, {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    }
}

function formatDateFull(dateStr: string, locale: string = 'es-ES'): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function getClientInitials(client: Appointment["client"] | undefined): string {
    if (!client) return "?";
    const first = client.firstname?.charAt(0) || "";
    const last = client.lastname?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
}

function getStatusStyle(status: Appointment["status"]) {
    switch (status) {
        case "confirmed":
            return { bg: COLORS.green50, text: COLORS.green700, border: COLORS.green100, indicator: COLORS.green500 };
        case "pending":
            return { bg: COLORS.yellow50, text: COLORS.yellow700, border: COLORS.orange100, indicator: COLORS.orange400 };
        case "cancelled":
            return { bg: COLORS.gray200, text: COLORS.gray500, border: COLORS.gray300, indicator: COLORS.gray400 };
        case "completed":
            return { bg: COLORS.blue100, text: COLORS.blue600, border: COLORS.blue100, indicator: COLORS.blue600 };
        default:
            return { bg: COLORS.gray200, text: COLORS.gray500, border: COLORS.gray300, indicator: COLORS.gray400 };
    }
}

function getStatusLabel(status: Appointment["status"], t: any) {
    switch (status) {
        case "confirmed": return t('manageAppointmentsScreen.statusConfirmed');
        case "pending": return t('manageAppointmentsScreen.statusPending');
        case "cancelled": return t('manageAppointmentsScreen.statusCancelled');
        case "completed": return t('manageAppointmentsScreen.statusCompleted');
        default: return status;
    }
}

function getPaymentStatusStyle(status: string | undefined, t: any) {
    switch (status) {
        case "paid":
            return { bg: COLORS.green50, text: COLORS.green600, label: t('manageAppointmentsScreen.paymentPaid') };
        case "authorized":
            return { bg: "#e0f2fe", text: "#0369a1", label: t('manageAppointmentsScreen.paymentAuthorized') };
        case "pending":
            return { bg: COLORS.orange50, text: COLORS.orange600, label: t('manageAppointmentsScreen.paymentPending') };
        case "failed":
            return { bg: COLORS.red50, text: COLORS.red600, label: t('manageAppointmentsScreen.paymentFailed') };
        case "cancelled":
            return { bg: COLORS.gray100, text: COLORS.gray500, label: t('manageAppointmentsScreen.paymentCancelled') };
        default:
            return null;
    }
}

type TabType = "past" | "today" | "upcoming";

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function ManageAppointmentsScreen() {
    const { showAlert } = useAlert();
    const { user, token } = useAuth();
    const { t, i18n } = useTranslation('settings');

    // Data states
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // UI states
    const [activeTab, setActiveTab] = useState<TabType>("today");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    // Reschedule modal states
    const [rescheduleModal, setRescheduleModal] = useState<{
        visible: boolean;
        appointment: Appointment | null;
        newDateStr: string; // Format: YYYY-MM-DD
        newTime: string;
        comments: string;
    }>({
        visible: false,
        appointment: null,
        newDateStr: "",
        newTime: "",
        comments: "",
    });

    const calendarConnected = user?.connectedCalendar?.connected || false;
    const calendarProvider = user?.connectedCalendar?.provider || null;
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

    // Calendar connection handlers
    const handleConnectGoogle = async () => {
        if (!token) return;
        setIsConnectingCalendar(true);
        try {
            const { url } = await calendarApi.getGoogleAuthUrl(token);
            await Linking.openURL(url);
        } catch (error: any) {
            showAlert({ type: 'error', title: "Error", message: error.message || t('manageAppointmentsScreen.errorGoogle') })
        } finally {
            setIsConnectingCalendar(false);
        }
    };

    const handleConnectOutlook = async () => {
        if (!token) return;
        setIsConnectingCalendar(true);
        try {
            const { url } = await calendarApi.getOutlookAuthUrl(token);
            await Linking.openURL(url);
        } catch (error: any) {
            showAlert({ type: 'error', title: "Error", message: error.message || t('manageAppointmentsScreen.errorOutlook') })
        } finally {
            setIsConnectingCalendar(false);
        }
    };

    const handleDisconnectCalendar = () => {
        showAlert({
            type: 'warning', title: t('manageAppointmentsScreen.disconnectTitle'), message: t('manageAppointmentsScreen.disconnectMessage'), buttons: [
                { text: t('manageAppointmentsScreen.cancel'), style: "cancel" },
                {
                    text: t('manageAppointmentsScreen.disconnect'),
                    style: "destructive",
                    onPress: async () => {
                        if (!token) return;
                        try {
                            await calendarApi.disconnectCalendar(token);
                            // User context will be refreshed on focus
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message });
                        }
                    },
                },
            ]
        })
    };

    // =========================================================================
    // DATA LOADING
    // =========================================================================
    const loadAppointments = useCallback(async () => {
        if (!token) return;

        try {
            const data = await appointmentApi.getAppointments(token, "professional");
            const sorted = data.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setAppointments(sorted);
        } catch (error: any) {
            console.error("[ManageAppointments] Error loading:", error);
            showAlert({ type: 'error', title: "Error", message: t('manageAppointmentsScreen.loadError') })
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments();
        }, [loadAppointments])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadAppointments();
    };

    // =========================================================================
    // COMPUTED VALUES
    // =========================================================================
    const today = new Date().toISOString().split("T")[0];

    const filteredAppointments = useMemo(() => {
        let filtered = appointments.filter(apt => apt.status !== "cancelled");

        // Filter by tab
        switch (activeTab) {
            case "past":
                filtered = appointments.filter(apt =>
                    apt.date < today || (apt.date === today && apt.status === "completed")
                );
                break;
            case "today":
                filtered = appointments.filter(apt =>
                    apt.date === today && apt.status !== "cancelled"
                );
                break;
            case "upcoming":
                filtered = appointments.filter(apt =>
                    apt.date > today && apt.status !== "cancelled"
                );
                break;
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(apt => {
                const clientName = `${apt.client?.firstname} ${apt.client?.lastname}`.toLowerCase();
                const dateStr = formatDate(apt.date, LOCALE_MAP[i18n.language] || 'es-ES', t).toLowerCase();
                const serviceType = apt.type === "videoconference" ? t('manageAppointmentsScreen.videoCall').toLowerCase() : t('manageAppointmentsScreen.inPersonShort').toLowerCase();
                return (
                    clientName.includes(query) ||
                    dateStr.includes(query) ||
                    serviceType.includes(query) ||
                    apt.date.includes(query)
                );
            });
        }

        return filtered;
    }, [appointments, activeTab, searchQuery, today]);

    // Count for each tab
    const pastCount = appointments.filter(apt => apt.date < today).length;
    const todayCount = appointments.filter(apt => apt.date === today && apt.status !== "cancelled").length;
    const upcomingCount = appointments.filter(apt => apt.date > today && apt.status !== "cancelled").length;
    const pendingConfirmationCount = appointments.filter(apt => apt.status === "pending").length;

    // Group filtered appointments by date
    const groupedAppointments = useMemo(() => {
        return filteredAppointments.reduce((acc, apt) => {
            const dateKey = apt.date;
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(apt);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [filteredAppointments]);

    // Upcoming appointments preview (for "today" tab - shows next 5 appointments after today)
    const upcomingAppointmentsPreview = useMemo(() => {
        if (activeTab !== "today") return [];
        return appointments
            .filter(apt => apt.date > today && apt.status !== "cancelled")
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 5); // Show max 5 upcoming appointments
    }, [appointments, activeTab, today]);

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleConfirm = async (appointmentId: string) => {
        if (!token) return;

        showAlert({
            type: 'info', title: t('manageAppointmentsScreen.confirmTitle'), message: t('manageAppointmentsScreen.confirmMessage'), buttons: [
                { text: t('manageAppointmentsScreen.cancelAction'), style: "cancel" },
                {
                    text: t('manageAppointmentsScreen.confirm'),
                    onPress: async () => {
                        setActionLoading(appointmentId);
                        try {
                            await appointmentApi.confirmAppointment(token, appointmentId);
                            setAppointments(prev =>
                                prev.map(apt =>
                                    apt._id === appointmentId
                                        ? { ...apt, status: "confirmed", confirmedAt: new Date().toISOString() }
                                        : apt
                                )
                            );
                            showAlert({ type: 'success', title: t('manageAppointmentsScreen.confirmTitle'), message: t('manageAppointmentsScreen.confirmSuccess') });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message || t('manageAppointmentsScreen.confirmError') });
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        })
    };

    const handleCancel = async (appointmentId: string) => {
        if (!token) return;

        showAlert({
            type: 'info', title: t('manageAppointmentsScreen.cancelTitle'), message: t('manageAppointmentsScreen.cancelMessage'), buttons: [
                { text: t('manageAppointmentsScreen.cancelNo'), style: "cancel" },
                {
                    text: t('manageAppointmentsScreen.cancelYes'),
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(appointmentId);
                        try {
                            await appointmentApi.cancelAppointment(token, appointmentId);
                            setAppointments(prev =>
                                prev.map(apt =>
                                    apt._id === appointmentId
                                        ? { ...apt, status: "cancelled", cancelledAt: new Date().toISOString() }
                                        : apt
                                )
                            );
                            showAlert({ type: 'success', title: t('manageAppointmentsScreen.cancelSuccess'), message: t('manageAppointmentsScreen.cancelSuccessMessage') });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message || t('manageAppointmentsScreen.cancelError') });
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        })
    };

    const handleViewDetails = (appointmentId: string) => {
        router.push(`/appointment-details/${appointmentId}` as any);
    };

    const handleStartVideoCall = async (appointment: Appointment) => {
        if (!token || !user) return;

        try {
            const chat = await createChat(token, user._id, appointment.client._id);
            router.push(`/pro-chat/${chat._id}?startVideoCall=true` as any);
        } catch (error: any) {
            showAlert({ type: 'error', title: "Error", message: error.message || t('manageAppointmentsScreen.videoCallError') })
        }
    };

    const handleViewClientChats = (clientId: string) => {
        router.push(`/client-chat-history/${clientId}` as any);
    };

    const handleViewClientHistory = (clientId: string) => {
        router.push(`/client-appointments/${clientId}` as any);
    };

    const handleOpenReschedule = (appointment: Appointment) => {
        setRescheduleModal({
            visible: true,
            appointment,
            newDateStr: appointment.date, // Format: YYYY-MM-DD
            newTime: appointment.time,
            comments: "",
        });
    };

    const handleReschedule = async () => {
        if (!token || !rescheduleModal.appointment) return;

        const { appointment, newDateStr, newTime, comments } = rescheduleModal;

        if (!newDateStr || !newTime) {
            showAlert({ type: 'warning', title: t('manageAppointmentsScreen.rescheduleIncomplete'), message: t('manageAppointmentsScreen.rescheduleIncompleteMessage') })
            return;
        }

        if (newDateStr === appointment.date && newTime === appointment.time) {
            showAlert({ type: 'warning', title: t('manageAppointmentsScreen.rescheduleNoChange'), message: t('manageAppointmentsScreen.rescheduleNoChangeMessage') })
            return;
        }

        setActionLoading(appointment._id);
        setRescheduleModal(prev => ({ ...prev, visible: false }));

        try {
            // Call reschedule API
            await appointmentApi.rescheduleAppointment(token, appointment._id, newDateStr, newTime, comments || undefined);

            // Update local state
            setAppointments(prev =>
                prev.map(apt =>
                    apt._id === appointment._id
                        ? { ...apt, date: newDateStr, time: newTime }
                        : apt
                )
            );
            showAlert({ type: 'info', title: t('manageAppointmentsScreen.rescheduleSuccess'), message: t('manageAppointmentsScreen.rescheduleSuccessMessage', { date: formatDateFull(newDateStr, LOCALE_MAP[i18n.language] || 'es-ES'), time: newTime }) })
        } catch (error: any) {
            showAlert({ type: 'error', title: "Error", message: error.message || t('manageAppointmentsScreen.rescheduleError') })
        } finally {
            setActionLoading(null);
        }
    };

    const handleCalendarPress = () => {
        setShowCalendarModal(true);
    };

    // =========================================================================
    // RENDER HELPERS
    // =========================================================================
    const renderAppointmentCard = (appointment: Appointment) => {
        if (!appointment?.client) return null;

        const statusStyle = getStatusStyle(appointment.status);
        const paymentStyle = getPaymentStatusStyle(appointment.paymentStatus, t);
        const isCancelled = appointment.status === "cancelled";
        const isPending = appointment.status === "pending";
        const isConfirmed = appointment.status === "confirmed";
        const isVideoconference = appointment.type === "videoconference";
        const canStartVideoCall = isVideoconference && isConfirmed;
        const isActionLoading = actionLoading === appointment._id;
        const isToday = appointment.date === today;

        return (
            <View
                key={appointment._id}
                style={[
                    styles.appointmentCard,
                    isToday && isConfirmed && styles.appointmentCardHighlight,
                    isCancelled && styles.appointmentCardCancelled,
                ]}
            >
                {/* Status indicator bar */}
                <View style={[styles.statusIndicator, { backgroundColor: statusStyle.indicator }]} />

                <View style={styles.cardContent}>
                    {/* Header: Time + Status */}
                    <View style={styles.cardHeader}>
                        <View style={styles.timeContainer}>
                            <Text style={[styles.timeText, isCancelled && styles.textCancelled]}>
                                {appointment.time}
                            </Text>
                            <Text style={styles.durationText}>
                                {appointment.serviceType === "30min" ? "30 min" : "60 min"}
                            </Text>
                        </View>
                        <View style={styles.statusContainer}>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }
                            ]}>
                                {isConfirmed && (
                                    <View style={[styles.statusDot, { backgroundColor: COLORS.green500 }]} />
                                )}
                                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                    {getStatusLabel(appointment.status, t)}
                                </Text>
                            </View>
                            {!isCancelled && (
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => handleCancel(appointment._id)}
                                >
                                    <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Client Info Row */}
                    <TouchableOpacity
                        style={styles.clientRow}
                        onPress={() => handleViewDetails(appointment._id)}
                        activeOpacity={0.7}
                    >
                        {appointment.client.avatar ? (
                            <Image
                                source={{ uri: getAvatarUrl(appointment.client.avatar) || undefined }}
                                style={styles.clientAvatar}
                            />
                        ) : (
                            <View style={[styles.clientAvatar, styles.clientInitialsContainer]}>
                                <Text style={styles.clientInitials}>
                                    {getClientInitials(appointment.client)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.clientInfo}>
                            <Text style={[styles.clientName, isCancelled && styles.textCancelled]}>
                                {appointment.client.firstname} {appointment.client.lastname}
                            </Text>
                            <View style={styles.clientLinks}>
                                <TouchableOpacity onPress={() => handleViewClientChats(appointment.client._id)}>
                                    <Text style={styles.clientLink}>{t('manageAppointmentsScreen.viewChats')}</Text>
                                </TouchableOpacity>
                                <Text style={styles.linkSeparator}>•</Text>
                                <TouchableOpacity onPress={() => handleViewClientHistory(appointment.client._id)}>
                                    <Text style={styles.clientLink}>{t('manageAppointmentsScreen.viewHistory')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.typeBadgeContainer}>
                                <View style={[
                                    styles.typeBadge,
                                    isVideoconference ? styles.typeBadgeVideo : styles.typeBadgePresencial
                                ]}>
                                    <MaterialIcons
                                        name={isVideoconference ? "videocam" : "store"}
                                        size={12}
                                        color={isVideoconference ? COLORS.purple700 : COLORS.gray600}
                                    />
                                    <Text style={[
                                        styles.typeBadgeText,
                                        isVideoconference ? styles.typeBadgeTextVideo : styles.typeBadgeTextPresencial
                                    ]}>
                                        {isVideoconference ? t('manageAppointmentsScreen.videoCall') : t('manageAppointmentsScreen.inPerson')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>
                                {(appointment.price / 100).toFixed(0)}€
                            </Text>
                            {paymentStyle && (
                                <View style={[styles.paymentBadge, { backgroundColor: paymentStyle.bg }]}>
                                    <Text style={[styles.paymentBadgeText, { color: paymentStyle.text }]}>
                                        {paymentStyle.label}
                                    </Text>
                                </View>
                            )}
                            {!appointment.paymentStatus && appointment.type === "presencial" && (
                                <View style={[styles.paymentBadge, { backgroundColor: COLORS.gray100 }]}>
                                    <Text style={[styles.paymentBadgeText, { color: COLORS.gray500 }]}>
                                        {t('manageAppointmentsScreen.paymentPresencial')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Video Call Button */}
                    {canStartVideoCall && (
                        <TouchableOpacity
                            style={styles.videoCallButton}
                            onPress={() => handleStartVideoCall(appointment)}
                        >
                            <MaterialIcons name="video-camera-front" size={18} color="#fff" />
                            <Text style={styles.videoCallButtonText}>{t('manageAppointmentsScreen.startVideoCall')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Action Buttons */}
                    {isActionLoading ? (
                        <View style={styles.loadingActions}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : !isCancelled && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleOpenReschedule(appointment)}
                            >
                                <Text style={styles.actionButtonText}>{t('manageAppointmentsScreen.reschedule')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonDanger]}
                                onPress={() => handleCancel(appointment._id)}
                            >
                                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                                    {t('manageAppointmentsScreen.cancelAction')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleViewDetails(appointment._id)}
                            >
                                <Text style={styles.actionButtonText}>{t('manageAppointmentsScreen.details')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // =========================================================================
    // MAIN RENDER
    // =========================================================================
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.gray600} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('manageAppointmentsScreen.headerTitle')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={handleCalendarPress}
                >
                    <MaterialIcons name="calendar-month" size={24} color={COLORS.primary} />
                    {calendarConnected && <View style={styles.calendarDot} />}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialIcons name="search" size={20} color={COLORS.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('manageAppointmentsScreen.searchPlaceholder')}
                        placeholderTextColor={COLORS.gray500}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab("past")}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === "past" && styles.tabTextActive
                    ]}>
                        {t('manageAppointmentsScreen.tabPast')}
                    </Text>
                    <View style={[
                        styles.tabBadge,
                        activeTab === "past" && styles.tabBadgeActive
                    ]}>
                        <Text style={[
                            styles.tabBadgeText,
                            activeTab === "past" && styles.tabBadgeTextActive
                        ]}>
                            {pastCount}
                        </Text>
                    </View>
                    {activeTab === "past" && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab("today")}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === "today" && styles.tabTextActive
                    ]}>
                        {t('manageAppointmentsScreen.tabToday')}
                    </Text>
                    <View style={[
                        styles.tabBadge,
                        activeTab === "today" && styles.tabBadgeActive
                    ]}>
                        <Text style={[
                            styles.tabBadgeText,
                            activeTab === "today" && styles.tabBadgeTextActive
                        ]}>
                            {todayCount}
                        </Text>
                    </View>
                    {activeTab === "today" && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab("upcoming")}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === "upcoming" && styles.tabTextActive
                    ]}>
                        {t('manageAppointmentsScreen.tabUpcoming')}
                    </Text>
                    <View style={[
                        styles.tabBadge,
                        activeTab === "upcoming" && styles.tabBadgeActive
                    ]}>
                        <Text style={[
                            styles.tabBadgeText,
                            activeTab === "upcoming" && styles.tabBadgeTextActive
                        ]}>
                            {upcomingCount}
                        </Text>
                    </View>
                    {activeTab === "upcoming" && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>{t('manageAppointmentsScreen.loading')}</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    {/* Pending Confirmations Banner */}
                    {pendingConfirmationCount > 0 && (
                        <TouchableOpacity
                            style={styles.pendingBanner}
                            onPress={() => router.push("/(settings)/pending-confirmations" as any)}
                        >
                            <View style={styles.pendingBannerIcon}>
                                <MaterialIcons name="pending-actions" size={18} color={COLORS.orange600} />
                            </View>
                            <View style={styles.pendingBannerContent}>
                                <Text style={styles.pendingBannerTitle}>{t('manageAppointmentsScreen.pendingTitle')}</Text>
                                <Text style={styles.pendingBannerSubtitle}>
                                    {pendingConfirmationCount > 1
                                        ? t('manageAppointmentsScreen.pendingPlural', { count: pendingConfirmationCount })
                                        : t('manageAppointmentsScreen.pendingSingular', { count: pendingConfirmationCount })}
                                </Text>
                            </View>
                            <View style={styles.pendingBannerRight}>
                                <View style={styles.pulseDot}>
                                    <View style={styles.pulseDotInner} />
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.gray300} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Appointments List */}
                    {filteredAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="event-available" size={64} color={COLORS.gray300} />
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? t('manageAppointmentsScreen.emptyNoResults') : t('manageAppointmentsScreen.emptyNoAppointments')}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? t('manageAppointmentsScreen.emptySearchResult', { query: searchQuery })
                                    : activeTab === "past"
                                        ? t('manageAppointmentsScreen.emptyPast')
                                        : activeTab === "today"
                                            ? t('manageAppointmentsScreen.emptyToday')
                                            : t('manageAppointmentsScreen.emptyUpcoming')
                                }
                            </Text>
                        </View>
                    ) : (
                        Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
                            <View key={date} style={styles.dateSection}>
                                <View style={styles.dateHeaderRow}>
                                    <Text style={styles.dateHeader}>
                                        {date === today ? `${t('manageAppointmentsScreen.today')}, ${formatDateFull(date, LOCALE_MAP[i18n.language] || 'es-ES').split(",")[1] || ''}` : formatDateFull(date, LOCALE_MAP[i18n.language] || 'es-ES')}
                                    </Text>
                                </View>
                                {dateAppointments.map(renderAppointmentCard)}
                            </View>
                        ))
                    )}

                    {/* Upcoming Appointments Preview Section - Only in "Today" tab */}
                    {activeTab === "today" && upcomingAppointmentsPreview.length > 0 && (
                        <View style={styles.upcomingPreviewSection}>
                            <View style={styles.upcomingPreviewHeader}>
                                <View style={styles.upcomingPreviewTitleRow}>
                                    <MaterialIcons name="event-note" size={20} color={COLORS.blue600} />
                                    <Text style={styles.upcomingPreviewTitle}>{t('manageAppointmentsScreen.upcomingPreview')}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => setActiveTab("upcoming")}
                                >
                                    <Text style={styles.viewAllText}>{t('manageAppointmentsScreen.viewAll')}</Text>
                                    <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            {upcomingAppointmentsPreview.map(apt => (
                                <TouchableOpacity
                                    key={apt._id}
                                    style={styles.upcomingPreviewCard}
                                    onPress={() => setActiveTab("upcoming")}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.upcomingPreviewDate}>
                                        <Text style={styles.upcomingPreviewDay}>
                                            {new Date(apt.date + 'T00:00:00').toLocaleDateString(LOCALE_MAP[i18n.language] || 'es-ES', { weekday: 'short' }).toUpperCase()}
                                        </Text>
                                        <Text style={styles.upcomingPreviewDayNum}>
                                            {new Date(apt.date + 'T00:00:00').getDate()}
                                        </Text>
                                    </View>
                                    <View style={styles.upcomingPreviewInfo}>
                                        <Text style={styles.upcomingPreviewTime}>{apt.time}</Text>
                                        <Text style={styles.upcomingPreviewClient}>
                                            {apt.client?.firstname} {apt.client?.lastname}
                                        </Text>
                                        <View style={styles.upcomingPreviewBadge}>
                                            <MaterialIcons
                                                name={apt.type === "videoconference" ? "videocam" : "location-on"}
                                                size={12}
                                                color={apt.type === "videoconference" ? COLORS.blue600 : COLORS.green600}
                                            />
                                            <Text style={[
                                                styles.upcomingPreviewType,
                                                { color: apt.type === "videoconference" ? COLORS.blue600 : COLORS.green600 }
                                            ]}>
                                                {apt.type === "videoconference" ? t('manageAppointmentsScreen.videoCall') : t('manageAppointmentsScreen.inPersonShort')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.upcomingPreviewAction}>
                                        <MaterialIcons name="chevron-right" size={24} color={COLORS.gray400} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* Reschedule Modal */}
            <Modal
                visible={rescheduleModal.visible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRescheduleModal(prev => ({ ...prev, visible: false }))}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manageAppointmentsScreen.rescheduleTitle')}</Text>
                            <TouchableOpacity
                                onPress={() => setRescheduleModal(prev => ({ ...prev, visible: false }))}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        {rescheduleModal.appointment && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalLabel}>
                                    {t('manageAppointmentsScreen.rescheduleWith', { name: `${rescheduleModal.appointment.client.firstname} ${rescheduleModal.appointment.client.lastname}` })}
                                </Text>
                                <Text style={styles.modalCurrentDate}>
                                    {t('manageAppointmentsScreen.rescheduleCurrently', { date: formatDateFull(rescheduleModal.appointment.date, LOCALE_MAP[i18n.language] || 'es-ES'), time: rescheduleModal.appointment.time })}
                                </Text>

                                {/* New Date */}
                                <Text style={styles.inputLabel}>{t('manageAppointmentsScreen.rescheduleNewDate')}</Text>
                                <View style={styles.datePickerButton}>
                                    <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.dateInputText}
                                        placeholder={t('manageAppointmentsScreen.rescheduleNewDatePlaceholder')}
                                        placeholderTextColor={COLORS.gray400}
                                        value={rescheduleModal.newDateStr}
                                        onChangeText={(text) =>
                                            setRescheduleModal(prev => ({ ...prev, newDateStr: text }))
                                        }
                                    />
                                </View>

                                {/* New Time */}
                                <Text style={styles.inputLabel}>{t('manageAppointmentsScreen.rescheduleNewTime')}</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder={t('manageAppointmentsScreen.rescheduleNewTimePlaceholder')}
                                    placeholderTextColor={COLORS.gray400}
                                    value={rescheduleModal.newTime}
                                    onChangeText={(text) =>
                                        setRescheduleModal(prev => ({ ...prev, newTime: text }))
                                    }
                                />

                                {/* Comments */}
                                <Text style={styles.inputLabel}>{t('manageAppointmentsScreen.rescheduleComments')}</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    placeholder={t('manageAppointmentsScreen.rescheduleCommentsPlaceholder')}
                                    placeholderTextColor={COLORS.gray400}
                                    value={rescheduleModal.comments}
                                    onChangeText={(text) =>
                                        setRescheduleModal(prev => ({ ...prev, comments: text }))
                                    }
                                    multiline
                                    numberOfLines={3}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelButton}
                                        onPress={() => setRescheduleModal(prev => ({ ...prev, visible: false }))}
                                    >
                                        <Text style={styles.modalCancelText}>{t('manageAppointmentsScreen.cancelAction')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalConfirmButton}
                                        onPress={handleReschedule}
                                    >
                                        <MaterialIcons name="edit-calendar" size={18} color="#fff" />
                                        <Text style={styles.modalConfirmText}>{t('manageAppointmentsScreen.reschedule')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Calendar Modal */}
            <Modal
                visible={showCalendarModal}
                animationType="slide"
                onRequestClose={() => setShowCalendarModal(false)}
            >
                <SafeAreaView style={styles.calendarModalContainer}>
                    <View style={styles.calendarModalHeader}>
                        <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                            <MaterialIcons name="close" size={24} color={COLORS.textMain} />
                        </TouchableOpacity>
                        <Text style={styles.calendarModalTitle}>
                            {calendarConnected ? t('manageAppointmentsScreen.calendarMyCalendar') : t('manageAppointmentsScreen.calendarSync')}
                        </Text>
                        {calendarConnected ? (
                            <TouchableOpacity onPress={handleDisconnectCalendar}>
                                <MaterialIcons name="link-off" size={22} color={COLORS.red600} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 24 }} />
                        )}
                    </View>

                    {calendarConnected ? (
                        <WebView
                            source={{
                                uri: calendarProvider === "outlook"
                                    ? "https://outlook.live.com/calendar/0/view/week"
                                    : "https://calendar.google.com/calendar/u/0/r"
                            }}
                            style={styles.calendarWebView}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            sharedCookiesEnabled={true}
                            thirdPartyCookiesEnabled={true}
                        />
                    ) : (
                        <View style={styles.calendarNotConnectedContainer}>
                            <View style={styles.calendarIconContainer}>
                                <MaterialIcons name="event" size={64} color={COLORS.gray300} />
                            </View>
                            <Text style={styles.calendarNotConnectedTitle}>
                                {t('manageAppointmentsScreen.calendarNotSynced')}
                            </Text>
                            <Text style={styles.calendarNotConnectedText}>
                                {t('manageAppointmentsScreen.calendarNotSyncedHint')}
                            </Text>

                            <View style={styles.calendarConnectButtons}>
                                <TouchableOpacity
                                    style={styles.calendarConnectButton}
                                    onPress={handleConnectGoogle}
                                    disabled={isConnectingCalendar}
                                >
                                    {isConnectingCalendar ? (
                                        <ActivityIndicator size="small" color="#4285F4" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="event" size={24} color="#4285F4" />
                                            <Text style={styles.calendarConnectButtonText}>
                                                Google Calendar
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.calendarConnectButton}
                                    onPress={handleConnectOutlook}
                                    disabled={isConnectingCalendar}
                                >
                                    <MaterialIcons name="calendar-today" size={24} color="#0078D4" />
                                    <Text style={styles.calendarConnectButtonText}>
                                        Outlook Calendar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.calendarHintText}>
                                {t('manageAppointmentsScreen.calendarAutoHint')}
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    calendarButton: {
        padding: 8,
        borderRadius: 20,
        position: "relative",
    },
    calendarDot: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green500,
        borderWidth: 1.5,
        borderColor: COLORS.surfaceLight,
    },
    // Search
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: COLORS.surfaceLight,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textMain,
    },
    // Tabs
    tabsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingHorizontal: 16,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 12,
        gap: 6,
        position: "relative",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray400,
    },
    tabTextActive: {
        fontWeight: "bold",
        color: COLORS.primary,
    },
    tabBadge: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tabBadgeActive: {
        backgroundColor: COLORS.primaryLight,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray500,
    },
    tabBadgeTextActive: {
        color: COLORS.primary,
    },
    tabIndicator: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    // Pending Banner
    pendingBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    pendingBannerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.orange50,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.orange100,
    },
    pendingBannerContent: {
        flex: 1,
        marginLeft: 12,
    },
    pendingBannerTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    pendingBannerSubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 2,
    },
    pendingBannerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        position: "relative",
    },
    pulseDotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.orange500,
    },
    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 8,
    },
    // Date Section
    dateSection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    dateHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    dateHeader: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray400,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // Appointment Card
    appointmentCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    appointmentCardHighlight: {
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    appointmentCardCancelled: {
        opacity: 0.6,
    },
    statusIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardContent: {
        padding: 12,
        paddingLeft: 16,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    timeText: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
        letterSpacing: -0.5,
    },
    durationText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    textCancelled: {
        textDecorationLine: "line-through",
        color: COLORS.gray400,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 4,
        marginRight: -4,
    },
    // Client Row
    clientRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray50,
        marginHorizontal: -4,
        padding: 8,
        borderRadius: 12,
        marginBottom: 12,
    },
    clientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    clientInitialsContainer: {
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    clientInitials: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    clientInfo: {
        flex: 1,
        marginLeft: 12,
    },
    clientName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    clientLinks: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    clientLink: {
        fontSize: 11,
        color: COLORS.gray500,
    },
    linkSeparator: {
        marginHorizontal: 4,
        color: COLORS.gray400,
    },
    typeBadgeContainer: {
        marginTop: 6,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        gap: 4,
    },
    typeBadgeVideo: {
        backgroundColor: COLORS.purple50,
    },
    typeBadgePresencial: {
        backgroundColor: COLORS.gray100,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: "500",
    },
    typeBadgeTextVideo: {
        color: COLORS.purple700,
    },
    typeBadgeTextPresencial: {
        color: COLORS.gray700,
    },
    priceContainer: {
        alignItems: "flex-end",
        gap: 4,
    },
    priceText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    paymentBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    paymentBadgeText: {
        fontSize: 9,
        fontWeight: "600",
    },
    // Video Call Button
    videoCallButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 8,
        gap: 6,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    videoCallButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    // Action Buttons
    loadingActions: {
        paddingVertical: 16,
        alignItems: "center",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
        paddingLeft: 4,
        paddingRight: 4,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.surfaceLight,
        alignItems: "center",
    },
    actionButtonDanger: {
        borderColor: COLORS.gray200,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.gray700,
    },
    actionButtonTextDanger: {
        color: COLORS.red600,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    modalCurrentDate: {
        fontSize: 13,
        color: COLORS.gray500,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.gray600,
        marginBottom: 8,
        marginTop: 12,
    },
    datePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
    datePickerText: {
        fontSize: 14,
        color: COLORS.textMain,
    },
    dateInputText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        paddingVertical: 0,
    },
    textInput: {
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.textMain,
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray600,
    },
    modalConfirmButton: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    // Calendar Modal
    calendarModalContainer: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    calendarModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    calendarModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    calendarWebView: {
        flex: 1,
    },
    // Calendar Not Connected UI
    calendarNotConnectedContainer: {
        flex: 1,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    calendarIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    calendarNotConnectedTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
        textAlign: "center",
    },
    calendarNotConnectedText: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    calendarConnectButtons: {
        width: "100%",
        gap: 12,
        marginBottom: 24,
    },
    calendarConnectButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.surfaceLight,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    calendarConnectButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    calendarHintText: {
        fontSize: 13,
        color: COLORS.gray500,
        textAlign: "center",
        paddingHorizontal: 24,
    },
    // Upcoming Preview Section (in Today tab)
    upcomingPreviewSection: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
    upcomingPreviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    upcomingPreviewTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    upcomingPreviewTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    viewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },
    upcomingPreviewCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    upcomingPreviewDate: {
        width: 44,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    upcomingPreviewDay: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.gray500,
        letterSpacing: 0.5,
    },
    upcomingPreviewDayNum: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    upcomingPreviewInfo: {
        flex: 1,
    },
    upcomingPreviewTime: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    upcomingPreviewClient: {
        fontSize: 13,
        color: COLORS.gray600,
        marginTop: 2,
    },
    upcomingPreviewBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    upcomingPreviewType: {
        fontSize: 11,
        fontWeight: "500",
    },
    upcomingPreviewAction: {
        padding: 4,
    },
});
