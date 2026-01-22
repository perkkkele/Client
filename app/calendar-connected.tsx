import { useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../context";

/**
 * Deep link handler for calendar connection callback
 * Route: twinpro://calendar-connected?provider=google&success=true
 */
export default function CalendarConnectedScreen() {
    const { provider, success } = useLocalSearchParams<{ provider: string; success: string }>();
    const { refreshUser } = useAuth();
    const hasRun = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (hasRun.current) return;
        hasRun.current = true;

        const handleCallback = async () => {
            console.log("[CalendarConnected] Callback received:", { provider, success });

            if (success === "true") {
                console.log("[CalendarConnected] Refreshing user data...");
                try {
                    await refreshUser();
                    console.log("[CalendarConnected] User data refreshed successfully");
                } catch (error) {
                    console.error("[CalendarConnected] Error refreshing user:", error);
                }
            }

            // Navigate back to work schedule after a brief delay
            setTimeout(() => {
                console.log("[CalendarConnected] Navigating to work-schedule...");
                router.replace("/(settings)/work-schedule");
            }, 2000);
        };

        handleCallback();
    }, []); // Empty dependency array - run only once

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#137fec" />
            <Text style={styles.text}>
                {success === "true"
                    ? `✓ ${provider === "google" ? "Google Calendar" : "Outlook"} conectado`
                    : "Error al conectar calendario"
                }
            </Text>
            <Text style={styles.hint}>Redirigiendo...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
    },
    text: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
        marginTop: 20,
    },
    hint: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 8,
    },
});
