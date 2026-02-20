/**
 * TwinProAlert - Custom branded alert system for TwinPro
 *
 * Replaces native Alert.alert() with a styled modal that matches
 * the TwinPro design language. Uses Context + Provider pattern
 * so any screen can trigger an alert via the useAlert() hook.
 *
 * Usage:
 *   const { showAlert } = useAlert();
 *   showAlert({ type: 'error', title: 'Error', message: 'Something went wrong' });
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
} from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// ─── Types ───────────────────────────────────────────────────────────────────

type AlertType = "error" | "success" | "warning" | "info";

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
    type?: AlertType;
    title: string;
    message: string;
    buttons?: AlertButton[];
}

interface AlertContextValue {
    showAlert: (options: AlertOptions) => void;
}

// ─── Design Tokens ───────────────────────────────────────────────────────────

const COLORS = {
    overlay: "rgba(0, 0, 0, 0.5)",
    surface: "#FFFFFF",
    textMain: "#111418",
    textMuted: "#64748B",
    border: "#E2E8F0",
};

const TYPE_CONFIG: Record<
    AlertType,
    { icon: keyof typeof MaterialIcons.glyphMap; color: string }
> = {
    error: { icon: "error-outline", color: "#EF4444" },
    success: { icon: "check-circle", color: "#22C55E" },
    warning: { icon: "warning", color: "#F59E0B" },
    info: { icon: "info-outline", color: "#3B82F6" },
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

/**
 * Hook to show a TwinPro-styled alert from any component.
 */
export function useAlert(): AlertContextValue {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<AlertOptions | null>(null);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const showAlert = useCallback((opts: AlertOptions) => {
        setOptions(opts);
        setVisible(true);
    }, []);

    const dismissAlert = useCallback(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            setOptions(null);
        });
    }, [scaleAnim, opacityAnim]);

    // Animate in when visible changes to true
    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, scaleAnim, opacityAnim]);

    const handleButtonPress = useCallback(
        (button?: AlertButton) => {
            dismissAlert();
            // Call onPress after a small delay so the dismiss animation runs first
            if (button?.onPress) {
                setTimeout(button.onPress, 180);
            }
        },
        [dismissAlert]
    );

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {visible && options && (
                <TwinProAlertModal
                    options={options}
                    scaleAnim={scaleAnim}
                    opacityAnim={opacityAnim}
                    onButtonPress={handleButtonPress}
                />
            )}
        </AlertContext.Provider>
    );
}

// ─── Modal Component ─────────────────────────────────────────────────────────

interface TwinProAlertModalProps {
    options: AlertOptions;
    scaleAnim: Animated.Value;
    opacityAnim: Animated.Value;
    onButtonPress: (button?: AlertButton) => void;
}

function TwinProAlertModal({
    options,
    scaleAnim,
    opacityAnim,
    onButtonPress,
}: TwinProAlertModalProps) {
    const alertType = options.type || "info";
    const config = TYPE_CONFIG[alertType];

    // Default button if none provided
    const buttons: AlertButton[] =
        options.buttons && options.buttons.length > 0
            ? options.buttons
            : [{ text: "OK", style: "default" }];

    // Separate cancel from action buttons
    const cancelButton = buttons.find((b) => b.style === "cancel");
    const actionButtons = buttons.filter((b) => b.style !== "cancel");

    return (
        <Modal visible transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View
                    style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
                >
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: config.color + "15" },
                        ]}
                    >
                        <MaterialIcons name={config.icon} size={32} color={config.color} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{options.title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{options.message}</Text>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        {actionButtons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.actionButton,
                                    button.style === "destructive"
                                        ? { backgroundColor: "#EF4444" }
                                        : { backgroundColor: config.color },
                                ]}
                                onPress={() => onButtonPress(button)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        // Use dark text for light colors (warning yellow)
                                        alertType === "warning" && button.style !== "destructive"
                                            ? { color: "#111418" }
                                            : { color: "#FFFFFF" },
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Cancel / secondary button */}
                        {cancelButton && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => onButtonPress(cancelButton)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {cancelButton.text}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 28,
        width: "100%",
        maxWidth: Math.min(SCREEN_WIDTH - 48, 340),
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
        paddingHorizontal: 4,
    },
    buttonContainer: {
        width: "100%",
        gap: 10,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    cancelButton: {
        alignItems: "center",
        paddingVertical: 12,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMuted,
    },
});
