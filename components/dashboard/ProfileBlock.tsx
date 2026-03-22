import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";

interface ProfileBlockProps {
    userId?: string;
}

export default function ProfileBlock({ userId }: ProfileBlockProps) {
    const { t } = useTranslation('settings');
    const handlePress = () => {
        if (userId) {
            router.push(`/professional/${userId}` as any);
        }
    };

    return (
        <TouchableOpacity
            style={styles.profilePreviewCard}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.profilePreviewGlow} />
            <View style={styles.profilePreviewContent}>
                <View style={styles.profilePreviewLeft}>
                    <View style={styles.profilePreviewIcon}>
                        <MaterialIcons name="visibility" size={22} color="#137fec" />
                    </View>
                    <View style={styles.profilePreviewText}>
                        <Text style={styles.profilePreviewTitle}>{t('profileBlock.viewPublicProfile')}</Text>
                        <Text style={styles.profilePreviewSubtitle}>{t('profileBlock.howClientsSeeYou')}</Text>
                    </View>
                </View>
                <View style={styles.profilePreviewArrow}>
                    <MaterialIcons name="arrow-forward-ios" size={16} color="#9ca3af" />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    profilePreviewCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        position: "relative",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    profilePreviewGlow: {
        position: "absolute",
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(19, 127, 236, 0.05)",
    },
    profilePreviewContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    profilePreviewLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    profilePreviewIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(19, 127, 236, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    profilePreviewText: {
        flex: 1,
    },
    profilePreviewTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111418",
        marginBottom: 2,
    },
    profilePreviewSubtitle: {
        fontSize: 13,
        color: "#6b7280",
    },
    profilePreviewArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },
});
