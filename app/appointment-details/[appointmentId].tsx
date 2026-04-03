import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";
import {
    getAppointmentById,
    cancelAppointment,
    Appointment,
} from "../../api/appointment";
import { createCheckoutSession } from "../../api/payment";
import { useAlert } from "../../components/TwinProAlert";

const COLORS = {
    primary: "#137fec",
    backgroundLight: "#f6f7f8",
    backgroundDark: "#101922",
    surfaceLight: "#ffffff",
    surfaceDark: "#1a2632",
    textMain: "#111418",
    textMuted: "#617589",
    gray100: "#e5e7eb",
    gray200: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray800: "#1f2937",
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green400: "#4ade80",
    green500: "#22c55e",
    green700: "#15803d",
    red50: "#fef2f2",
    red100: "#fee2e2",
    red600: "#dc2626",
    yellow50: "#fefce8",
    yellow600: "#ca8a04",
    white: "#FFFFFF",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    return getAssetUrl(avatarPath);
}



export default function AppointmentDetailsScreen() {
    const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const { t } = useTranslation('settings');
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    const months = t('appointmentDetailsScreen.months', { returnObjects: true }) as string[];

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return t('appointmentDetailsScreen.dateFormat', { day, month, year });
    }

    function formatDuration(minutes: number): string {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (mins === 0) return `${hours} ${hours > 1 ? t('appointmentDetailsScreen.hoursPlural') : t('appointmentDetailsScreen.hours')}`;
            return `${hours}h ${mins}m`;
        }
        return `${minutes} ${t('appointmentDetailsScreen.minutes')}`;
    }

    function getStatusConfig(status: string) {
        switch (status) {
            case "confirmed":
                return {
                    label: t('appointmentDetailsScreen.statusConfirmed'),
                    icon: "check-circle",
                    bgColor: COLORS.green50,
                    textColor: COLORS.green700,
                    borderColor: COLORS.green100,
                };
            case "pending":
                return {
                    label: t('appointmentDetailsScreen.statusPending'),
                    icon: "schedule",
                    bgColor: COLORS.yellow50,
                    textColor: COLORS.yellow600,
                    borderColor: "#fef08a",
                };
            case "cancelled":
                return {
                    label: t('appointmentDetailsScreen.statusCancelled'),
                    icon: "cancel",
                    bgColor: COLORS.red50,
                    textColor: COLORS.red600,
                    borderColor: COLORS.red100,
                };
            case "completed":
                return {
                    label: t('appointmentDetailsScreen.statusCompleted'),
                    icon: "task-alt",
                    bgColor: COLORS.green50,
                    textColor: COLORS.green700,
                    borderColor: COLORS.green100,
                };
            default:
                return {
                    label: status,
                    icon: "info",
                    bgColor: COLORS.gray100,
                    textColor: COLORS.gray500,
                    borderColor: COLORS.gray200,
                };
        }
    }

    const loadAppointment = useCallback(async () => {
        console.log("[AppointmentDetails] appointmentId:", appointmentId, "token:", token ? "present" : "missing");
        if (!token || !appointmentId) return;
        setIsLoading(true);
        try {
            const data = await getAppointmentById(token, appointmentId);
            setAppointment(data);
        } catch (error) {
            console.error("Error loading appointment:", error);
            showAlert({ type: 'error', title: 'Error', message: t('appointmentDetailsScreen.loadError') });
        } finally {
            setIsLoading(false);
        }
    }, [token, appointmentId]);

    useEffect(() => {
        loadAppointment();
    }, [loadAppointment]);

    const handleBack = () => {
        router.back();
    };

    const handleMessage = () => {
        if (!appointment) return;
        router.push(`/avatar-chat/${appointment.professional._id}` as any);
    };

    const handleCall = () => {
        if (!appointment?.professional.phone) {
            showAlert({ type: 'info', title: t('appointmentDetailsScreen.noPhone'), message: t('appointmentDetailsScreen.noPhoneMessage') });
            return;
        }
        Linking.openURL(`tel:${appointment.professional.phone}`);
    };

    const handleJoinMeeting = () => {
        if (!appointment?.meetingLink) {
            showAlert({ type: 'warning', title: t('appointmentDetailsScreen.noMeetingLink'), message: t('appointmentDetailsScreen.noMeetingLinkMessage') });
            return;
        }
        Linking.openURL(appointment.meetingLink);
    };

    const handlePayNow = async () => {
        if (!token || !appointmentId) return;

        try {
            const session = await createCheckoutSession(token, appointmentId);
            const canOpen = await Linking.canOpenURL(session.url);
            if (canOpen) {
                await Linking.openURL(session.url);
            } else {
                showAlert({ type: 'error', title: 'Error', message: t('appointmentDetailsScreen.paymentLinkError') });
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            showAlert({ type: 'error', title: 'Error', message: error.message || t('appointmentDetailsScreen.paymentStartError') });
        }
    };

    const handleReschedule = () => {
        if (!appointment) return;
        // Navigate back to booking screen
        router.push(`/book-appointment/${appointment.professional._id}` as any);
    };

    const handleCancel = () => {
        showAlert({
            type: 'warning',
            title: t('appointmentDetailsScreen.cancelTitle'),
            message: t('appointmentDetailsScreen.cancelMessage'),
            buttons: [
                { text: t('appointmentDetailsScreen.cancelNo'), style: "cancel" },
                {
                    text: t('appointmentDetailsScreen.cancelYes'),
                    style: "destructive",
                    onPress: async () => {
                        if (!token || !appointmentId) return;
                        setIsCancelling(true);
                        try {
                            await cancelAppointment(token, appointmentId);
                            await loadAppointment();
                            showAlert({ type: 'info', title: t('appointmentDetailsScreen.cancelSuccess'), message: t('appointmentDetailsScreen.cancelSuccessMessage') });
                        } catch (error: any) {
                            showAlert({ type: 'error', title: 'Error', message: error.message || t('appointmentDetailsScreen.cancelError') });
                        } finally {
                            setIsCancelling(false);
                        }
                    },
                },
            ]
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!appointment) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{t('appointmentDetailsScreen.notFound')}</Text>
                <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
                    <Text style={styles.backButtonErrorText}>{t('appointmentDetailsScreen.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(appointment.professional.avatar);
    const displayName = appointment.professional.publicName ||
        `${appointment.professional.firstname} ${appointment.professional.lastname}`.trim();
    const statusConfig = getStatusConfig(appointment.status);
    const isActive = appointment.status === "pending" || appointment.status === "confirmed";

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('appointmentDetailsScreen.headerTitle')}</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header & Status */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <MaterialIcons name="person" size={40} color={COLORS.gray400} />
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>
                    <Text style={styles.professionalName}>{displayName}</Text>
                    <Text style={styles.professionalInfo}>
                        {appointment.professional.profession || t('appointmentDetailsScreen.professional')}
                        {appointment.professional.category && ` - ${appointment.professional.category}`}
                    </Text>
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor: statusConfig.bgColor,
                            borderColor: statusConfig.borderColor,
                        }
                    ]}>
                        <MaterialIcons
                            name={statusConfig.icon as any}
                            size={18}
                            color={statusConfig.textColor}
                        />
                        <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Details Section */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>{t('appointmentDetailsScreen.appointmentInfo')}</Text>
                    <View style={styles.detailsList}>
                        {/* Date & Time */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>{t('appointmentDetailsScreen.dateAndTime')}</Text>
                                <Text style={styles.detailValue}>{formatDate(appointment.date)}</Text>
                                <Text style={styles.detailSubValue}>{appointment.time}</Text>
                            </View>
                        </View>

                        {/* Duration */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>{t('appointmentDetailsScreen.duration')}</Text>
                                <Text style={styles.detailValue}>{formatDuration(appointment.duration)}</Text>
                            </View>
                        </View>

                        {/* Location/Meeting */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <MaterialIcons
                                    name={appointment.type === "videoconference" ? "videocam" : "location-on"}
                                    size={20}
                                    color={COLORS.primary}
                                />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>{t('appointmentDetailsScreen.location')}</Text>
                                {appointment.type === "videoconference" ? (
                                    <>
                                        <Text style={styles.detailValue}>{t('appointmentDetailsScreen.videoAppointment')}</Text>
                                        <Text style={styles.detailSubValue}>
                                            {t('appointmentDetailsScreen.videoCallHint')}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.detailValue}>{t('appointmentDetailsScreen.inPerson')}</Text>
                                        {appointment.location?.address && (
                                            <Text style={styles.detailSubValue}>
                                                {appointment.location.address}
                                                {appointment.location.city && `, ${appointment.location.city}`}
                                            </Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Price */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <MaterialIcons name="euro" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>{t('appointmentDetailsScreen.price')}</Text>
                                <Text style={styles.detailValue}>
                                    {(appointment.price / 100).toFixed(0)}€
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Notes Section */}
                {appointment.notes && (
                    <>
                        <View style={styles.notesSection}>
                            <View style={styles.notesHeader}>
                                <Text style={styles.sectionTitle}>{t('appointmentDetailsScreen.notes')}</Text>
                            </View>
                            <View style={styles.notesBox}>
                                <Text style={styles.notesText}>{appointment.notes}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                    </>
                )}

                {/* Pay Now Button - Show if payment is pending AND requires online payment */}
                {isActive && appointment.paymentStatus === 'pending' && (
                    (() => {
                        // Determine if this appointment requires online payment
                        // Videoconference: ALWAYS requires online payment
                        // Presencial: Only if professional has requirePaymentOnBooking === true (default)
                        const requiresOnlinePayment =
                            appointment.type === 'videoconference' ||
                            appointment.professional.requirePaymentOnBooking !== false;

                        if (requiresOnlinePayment) {
                            return (
                                <View style={styles.paymentSection}>
                                    <View style={styles.paymentCard}>
                                        <View style={styles.paymentCardContent}>
                                            <MaterialIcons name="payment" size={32} color={COLORS.primary} />
                                            <View style={styles.paymentCardText}>
                                                <Text style={styles.paymentCardTitle}>{t('appointmentDetailsScreen.paymentPending')}</Text>
                                                <Text style={styles.paymentCardSubtitle}>
                                                    {t('appointmentDetailsScreen.paymentPendingHint')}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
                                            <MaterialIcons name="lock" size={18} color={COLORS.white} />
                                            <Text style={styles.payNowButtonText}>
                                                {t('appointmentDetailsScreen.payButton', { amount: (appointment.price / 100).toFixed(0) })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        } else {
                            // In-situ payment - show informative message with optional early pay
                            return (
                                <View style={styles.paymentSection}>
                                    <View style={[styles.paymentCard, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
                                        <View style={styles.paymentCardContent}>
                                            <MaterialIcons name="storefront" size={32} color="#0284c7" />
                                            <View style={styles.paymentCardText}>
                                                <Text style={[styles.paymentCardTitle, { color: '#0369a1' }]}>{t('appointmentDetailsScreen.inSituPayment')}</Text>
                                                <Text style={[styles.paymentCardSubtitle, { color: '#0369a1' }]}>
                                                    {t('appointmentDetailsScreen.inSituPaymentHint', { amount: (appointment.price / 100).toFixed(0) })}
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Optional early payment button */}
                                        <TouchableOpacity
                                            style={styles.optionalPayButton}
                                            onPress={handlePayNow}
                                        >
                                            <MaterialIcons name="payment" size={18} color={COLORS.primary} />
                                            <Text style={styles.optionalPayButtonText}>
                                                {t('appointmentDetailsScreen.preferPayNow')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }
                    })()
                )}

                {/* Payment Status Badge - Show if authorized (pre-auth) */}
                {(appointment?.paymentStatus as any) === 'authorized' && (
                    <View style={styles.paidBadgeContainer}>
                        <View style={[styles.paidBadge, styles.authorizedBadge]}>
                            <MaterialIcons name="hourglass-top" size={20} color="#0369a1" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.paidBadgeText, { color: '#0369a1' }]}>{t('appointmentDetailsScreen.paymentReserved')}</Text>
                                <Text style={styles.authorizedSubtext}>
                                    {t('appointmentDetailsScreen.paymentReservedHint')}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Status Badge - Show if paid */}
                {appointment.paymentStatus === 'paid' && (
                    <View style={styles.paidBadgeContainer}>
                        <View style={styles.paidBadge}>
                            <MaterialIcons name="check-circle" size={20} color={COLORS.green700} />
                            <Text style={styles.paidBadgeText}>{t('appointmentDetailsScreen.paymentCompleted')}</Text>
                        </View>
                    </View>
                )}

                {/* Fiscal notice - shown when payment has been made */}
                {(appointment.paymentStatus === 'paid' || (appointment?.paymentStatus as any) === 'authorized') && (
                    <View style={styles.fiscalNotice}>
                        <MaterialIcons name="info-outline" size={14} color={COLORS.gray400} />
                        <Text style={styles.fiscalNoticeText}>
                            {t('appointmentDetailsScreen.fiscalNotice', { name: displayName })}
                        </Text>
                    </View>
                )}

                {/* Info Card - Redirect to Settings for management */}
                {isActive && (
                    <View style={styles.actionsSection}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardContent}>
                                <MaterialIcons name="info" size={24} color={COLORS.primary} />
                                <View style={styles.infoCardText}>
                                    <Text style={styles.infoCardTitle}>{t('appointmentDetailsScreen.managementTitle')}</Text>
                                    <Text style={styles.infoCardSubtitle}>
                                        {t('appointmentDetailsScreen.managementHint')}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.goToSettingsButton}
                                onPress={() => router.push("/(settings)/my-appointments")}
                            >
                                <Text style={styles.goToSettingsButtonText}>{t('appointmentDetailsScreen.goToMyAppointments')}</Text>
                                <MaterialIcons name="arrow-forward" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Bottom Padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)")}>
                    <MaterialIcons name="chat-bubble" size={24} color={COLORS.primary} />
                    <Text style={[styles.navLabel, { color: COLORS.primary }]}>{t('appointmentDetailsScreen.navChats')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/category-results?category=todos" as any)}>
                    <MaterialIcons name="diversity-2" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>{t('appointmentDetailsScreen.navDirectory')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/favorites")}>
                    <MaterialIcons name="favorite" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>{t('appointmentDetailsScreen.navFavorites')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/pro-dashboard")}>
                    <MaterialIcons name="person" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>{t('appointmentDetailsScreen.navProProfile')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.backgroundLight,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginBottom: 16,
    },
    backButtonError: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    backButtonErrorText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    headerPlaceholder: {
        width: 48,
    },
    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    // Profile Section
    profileSection: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surfaceLight,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 112,
        height: 112,
        borderRadius: 56,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.green500,
        borderWidth: 3,
        borderColor: COLORS.surfaceLight,
    },
    professionalName: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    professionalInfo: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    // Divider
    divider: {
        height: 8,
        backgroundColor: COLORS.backgroundLight,
    },
    // Details Section
    detailsSection: {
        backgroundColor: COLORS.surfaceLight,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 16,
    },
    detailsList: {
        gap: 24,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: "center",
        justifyContent: "center",
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    detailSubValue: {
        fontSize: 14,
        color: COLORS.textMain,
        marginTop: 2,
    },
    joinButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    joinButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    // Notes Section
    notesSection: {
        backgroundColor: COLORS.surfaceLight,
        padding: 20,
    },
    notesHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    notesBox: {
        backgroundColor: COLORS.backgroundLight,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    notesText: {
        fontSize: 14,
        color: COLORS.textMain,
        lineHeight: 22,
    },
    // Actions Section
    actionsSection: {
        backgroundColor: COLORS.surfaceLight,
        padding: 20,
    },
    actionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    actionButtonPrimary: {
        width: "48%",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonPrimaryText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.white,
    },
    actionButtonSecondary: {
        width: "48%",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.backgroundLight,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    actionButtonSecondaryText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    actionButtonDanger: {
        width: "48%",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.red50,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.red100,
    },
    actionButtonDangerText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.red600,
    },
    // Bottom Navigation
    bottomNav: {
        flexDirection: "row",
        backgroundColor: COLORS.surfaceLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 8,
        paddingBottom: 24,
        paddingHorizontal: 8,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
    },
    navLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
    // Payment Styles
    paymentSection: {
        paddingVertical: 8,
    },
    paymentCard: {
        backgroundColor: "#fffbeb",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#fef08a",
    },
    paymentCardContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    paymentCardText: {
        flex: 1,
    },
    paymentCardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    paymentCardSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    payNowButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    payNowButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    paidBadgeContainer: {
        paddingVertical: 8,
    },
    paidBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.green100,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    paidBadgeText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.green700,
    },
    // Pre-authorization badge (blue)
    authorizedBadge: {
        backgroundColor: "#e0f2fe",
        borderWidth: 1,
        borderColor: "#7dd3fc",
    },
    authorizedSubtext: {
        fontSize: 12,
        color: "#0284c7",
        marginTop: 2,
    },
    // Info Card Styles
    infoCard: {
        backgroundColor: "#f0f9ff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#bae6fd",
    },
    infoCardContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    infoCardText: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0369a1",
    },
    infoCardSubtitle: {
        fontSize: 13,
        color: "#0369a1",
        marginTop: 4,
        lineHeight: 18,
    },
    goToSettingsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    goToSettingsButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    optionalPayButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        marginTop: 12,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    optionalPayButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    fiscalNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    fiscalNoticeText: {
        flex: 1,
        fontSize: 11,
        color: COLORS.gray400,
        lineHeight: 16,
    },
});
