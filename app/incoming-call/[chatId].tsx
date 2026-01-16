import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { getAssetUrl } from "../../api";

const COLORS = {
    backgroundDark: "#0a0f14",
    green400: "#4ADE80",
    green500: "#22C55E",
    red400: "#F87171",
    red500: "#EF4444",
    textMain: "#FFFFFF",
    textSecondary: "#9CA3AF",
};

export default function IncomingCallScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const params = useLocalSearchParams();
    const callerName = (params.callerName as string) || "Profesional";
    const callerAvatar = params.callerAvatar as string | undefined;
    const callerId = params.callerId as string | undefined;

    const { token } = useAuth();
    const [isAnswering, setIsAnswering] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Animation for pulsing effect
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start vibration pattern
        const vibrationPattern = [0, 500, 200, 500, 200, 500];
        Vibration.vibrate(vibrationPattern, true);

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Phone icon shake animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: -1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            Vibration.cancel();
        };
    }, []);

    const handleAccept = async () => {
        if (isAnswering) return;
        setIsAnswering(true);
        Vibration.cancel();

        // Navigate to dedicated client video call screen
        router.replace({
            pathname: `/client-video-call/${chatId}`,
            params: {
                professionalId: callerId,
                professionalName: callerName,
                professionalAvatar: callerAvatar,
            },
        } as any);
    };

    const handleReject = async () => {
        if (isRejecting) return;
        setIsRejecting(true);
        Vibration.cancel();

        // Go back
        router.back();
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Caller info */}
                <Text style={styles.incomingText}>Videollamada entrante</Text>

                {/* Avatar with pulse effect */}
                <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.avatarRing}>
                        {callerAvatar ? (
                            <Image source={{ uri: getAssetUrl(callerAvatar) || undefined }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {callerName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                <Text style={styles.callerName}>{callerName}</Text>
                <Text style={styles.callerSubtitle}>te está llamando...</Text>

                {/* Animated phone icon */}
                <Animated.View style={[styles.phoneIconContainer, { transform: [{ rotate: rotation }] }]}>
                    <MaterialIcons name="phone-in-talk" size={32} color={COLORS.green400} />
                </Animated.View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsContainer}>
                {/* Reject button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={handleReject}
                    disabled={isRejecting || isAnswering}
                >
                    <MaterialIcons name="call-end" size={32} color={COLORS.textMain} />
                    <Text style={styles.actionText}>Rechazar</Text>
                </TouchableOpacity>

                {/* Accept button */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={handleAccept}
                    disabled={isRejecting || isAnswering}
                >
                    <MaterialIcons name="videocam" size={32} color={COLORS.textMain} />
                    <Text style={styles.actionText}>Aceptar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    incomingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 32,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    avatarContainer: {
        marginBottom: 24,
    },
    avatarRing: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 4,
        borderColor: COLORS.green400,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    avatarPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#2a3642",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        fontSize: 56,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    callerName: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
        textAlign: "center",
    },
    callerSubtitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    phoneIconContainer: {
        marginTop: 16,
    },
    actionsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 48,
        paddingBottom: 48,
    },
    actionButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    rejectButton: {
        backgroundColor: COLORS.red500,
    },
    acceptButton: {
        backgroundColor: COLORS.green500,
    },
    actionText: {
        color: COLORS.textMain,
        fontSize: 12,
        marginTop: 4,
    },
});
