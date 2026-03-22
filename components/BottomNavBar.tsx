import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context";
import { useTranslation } from "react-i18next";

type TabId = "chats" | "directory" | "favorites" | "pro";

interface TabConfig {
    id: TabId;
    icon: string;
    labelKey: string;
    route: string;
    proRoute?: string;
}

const TABS: TabConfig[] = [
    { id: "chats", icon: "chat-bubble", labelKey: "nav.chats", route: "/(tabs)" },
    { id: "directory", icon: "diversity-2", labelKey: "nav.directory", route: "/(tabs)/category-results?category=todos" },
    { id: "favorites", icon: "favorite", labelKey: "nav.favorites", route: "/(tabs)/favorites" },
    { id: "pro", icon: "badge", labelKey: "nav.proPerfil", route: "/(tabs)/become-pro", proRoute: "/(tabs)/pro-dashboard" },
];

const COLORS = {
    white: "#FFFFFF",
    borderColor: "#e2e8f0",
    inactiveIcon: "#64748b",
    inactiveLabel: "#64748b",
    activeLabel: "#1e293b",
    activeBg: "rgba(249, 245, 6, 0.2)",
};

interface BottomNavBarProps {
    activeTab: TabId;
}

function NavItem({
    tab,
    isActive,
    label,
    onPress,
}: {
    tab: TabConfig;
    isActive: boolean;
    label: string;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            // Pulse animation: scale up then back
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.18,
                    friction: 3,
                    tension: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [isActive]);

    return (
        <TouchableOpacity
            style={styles.navItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Fixed-height icon container — same height for active and inactive */}
            <View style={styles.iconContainer}>
                {isActive ? (
                    <Animated.View
                        style={[
                            styles.activeIndicator,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <MaterialIcons
                            name={tab.icon as any}
                            size={24}
                            color={COLORS.activeLabel}
                        />
                    </Animated.View>
                ) : (
                    <MaterialIcons
                        name={tab.icon as any}
                        size={24}
                        color={COLORS.inactiveIcon}
                    />
                )}
            </View>
            <Text style={isActive ? styles.navLabelActive : styles.navLabel}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

export default function BottomNavBar({ activeTab }: BottomNavBarProps) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { t } = useTranslation("settings");

    const handlePress = (tab: TabConfig) => {
        if (tab.id === activeTab) return; // Already on this tab

        if (tab.id === "pro" && user?.userType === "userpro" && tab.proRoute) {
            router.push(tab.proRoute as any);
        } else {
            router.push(tab.route as any);
        }
    };

    return (
        <View
            style={[
                styles.bottomNav,
                { paddingBottom: Math.max(insets.bottom, 8) },
            ]}
        >
            {TABS.map((tab) => (
                <NavItem
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    label={t(tab.labelKey)}
                    onPress={() => handlePress(tab)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderColor,
        paddingTop: 10,
        paddingHorizontal: 24,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        gap: 3,
    },
    iconContainer: {
        width: 48,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    activeIndicator: {
        width: 48,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.activeBg,
        alignItems: "center",
        justifyContent: "center",
    },
    navLabel: {
        fontSize: 11,
        color: COLORS.inactiveLabel,
        fontWeight: "500",
    },
    navLabelActive: {
        fontSize: 11,
        color: COLORS.activeLabel,
        fontWeight: "bold",
    },
});
