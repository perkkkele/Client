import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity, Switch, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "./constants";
import { useSubscription } from "../../hooks/useSubscription";

interface User {
    _id?: string;
}

interface EscalationConfig {
    enabled: boolean;
    triggers: {
        clientRequest: boolean;
        twinUnable: boolean;
        keywords: boolean;
    };
    keywords: string[];
}

interface TwinBlockProps {
    user?: User;
    geminiActive: boolean;
    onGeminiChange: (value: boolean) => void;
    onConfigureGemini: () => void;
    escalation?: EscalationConfig;
    onEscalationChange?: (config: EscalationConfig) => void;
}

export default function TwinBlock({
    user,
    geminiActive,
    onGeminiChange,
    onConfigureGemini,
    escalation,
    onEscalationChange,
}: TwinBlockProps) {
    const { t } = useTranslation('settings');
    const [showEscalationConfig, setShowEscalationConfig] = useState(false);
    const [keywordInput, setKeywordInput] = useState("");
    const { minutesUsed, minutesIncluded, extraMinutesUsed } = useSubscription();

    const handleTestGemini = () => {
        if (user?._id) {
            router.push(`/avatar-chat/${user._id}` as any);
        }
    };

    const handleEscalationToggle = (enabled: boolean) => {
        if (onEscalationChange && escalation) {
            onEscalationChange({ ...escalation, enabled });
        }
    };

    const handleTriggerToggle = (trigger: 'clientRequest' | 'twinUnable' | 'keywords') => {
        if (onEscalationChange && escalation) {
            onEscalationChange({
                ...escalation,
                triggers: {
                    ...escalation.triggers,
                    [trigger]: !escalation.triggers[trigger]
                }
            });
        }
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && onEscalationChange && escalation) {
            const newKeywords = [...escalation.keywords, keywordInput.trim()];
            onEscalationChange({ ...escalation, keywords: newKeywords });
            setKeywordInput("");
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        if (onEscalationChange && escalation) {
            const newKeywords = escalation.keywords.filter(k => k !== keyword);
            onEscalationChange({ ...escalation, keywords: newKeywords });
        }
    };

    return (
        <View style={styles.twinCard}>
            <View style={styles.twinCardGlow1} />
            <View style={styles.twinCardGlow2} />
            <View style={styles.twinCardContent}>
                <View style={styles.twinHeader}>
                    {/* Icon column with caption - touchable to test */}
                    <TouchableOpacity
                        style={styles.twinIconColumn}
                        onPress={handleTestGemini}
                    >
                        <View style={styles.twinIconContainer}>
                            <MaterialIcons name="smart-toy" size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.testHintRow}>
                            <MaterialIcons name="touch-app" size={10} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.testHint}>{t('twinBlock.test')}</Text>
                        </View>
                    </TouchableOpacity>
                    {/* Info column */}
                    <View style={styles.twinInfo}>
                        <Text style={styles.twinTitle}>{t('twinBlock.digitalTwin')}</Text>
                        <View style={styles.twinStatus}>
                            <View style={[
                                styles.statusDot,
                                !geminiActive && styles.statusDotInactive
                            ]} />
                            <Text style={styles.statusText}>
                                {geminiActive ? t('twinBlock.activeAndPublic') : t('twinBlock.inactive')}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={geminiActive}
                        onValueChange={onGeminiChange}
                        trackColor={{ false: "rgba(0,0,0,0.3)", true: "#4ade80" }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(0,0,0,0.3)"
                    />
                </View>
                <TouchableOpacity style={styles.configureButton} onPress={onConfigureGemini}>
                    <View style={styles.configureButtonContent}>
                        <MaterialIcons name="tune" size={20} color={COLORS.primary} />
                        <Text style={styles.configureButtonText}>{t('twinBlock.configureTwin')}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Minutes Usage Bar */}
                <TouchableOpacity
                    style={styles.usageSection}
                    onPress={() => router.push("/(settings)/plans-credits" as any)}
                    activeOpacity={0.7}
                >
                    <View style={styles.usageRow}>
                        <MaterialIcons name="timer" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.usageText}>
                            {minutesUsed} / {minutesIncluded} min
                        </Text>
                        <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
                    </View>
                    <View style={styles.usageBarBg}>
                        <View
                            style={[
                                styles.usageBarFill,
                                {
                                    width: `${Math.min(100, (minutesUsed / Math.max(minutesIncluded, 1)) * 100)}%`,
                                },
                                minutesUsed > minutesIncluded && styles.usageBarOver,
                            ]}
                        />
                    </View>
                    {extraMinutesUsed > 0 && (
                        <View style={styles.usageWarningRow}>
                            <MaterialIcons name="info-outline" size={13} color="#fbbf24" />
                            <Text style={styles.usageWarningText}>
                                {t('twinBlock.extraMinutesUsed', { count: extraMinutesUsed })}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Escalation Section */}
                {onEscalationChange && escalation && (
                    <>
                        <View style={styles.escalationDivider} />
                        <View style={styles.escalationSection}>
                            <View style={styles.escalationHeader}>
                                <View style={styles.escalationHeaderLeft}>
                                    <MaterialIcons name="support-agent" size={20} color="#FFFFFF" />
                                    <Text style={styles.escalationTitle}>{t('twinBlock.escalationTitle')}</Text>
                                </View>
                                <Switch
                                    value={escalation.enabled}
                                    onValueChange={handleEscalationToggle}
                                    trackColor={{ false: "rgba(0,0,0,0.3)", true: "#60a5fa" }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="rgba(0,0,0,0.3)"
                                />
                            </View>
                            <Text style={styles.escalationHint}>
                                {t('twinBlock.escalationHint')}
                            </Text>

                            {escalation.enabled && (
                                <TouchableOpacity
                                    style={styles.escalationExpandButton}
                                    onPress={() => setShowEscalationConfig(!showEscalationConfig)}
                                >
                                    <Text style={styles.escalationExpandText}>
                                        {showEscalationConfig ? t('twinBlock.hideOptions') : t('twinBlock.configureTriggers')}
                                    </Text>
                                    <MaterialIcons
                                        name={showEscalationConfig ? "expand-less" : "expand-more"}
                                        size={18}
                                        color="rgba(255,255,255,0.7)"
                                    />
                                </TouchableOpacity>
                            )}

                            {escalation.enabled && showEscalationConfig && (
                                <View style={styles.escalationOptions}>
                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => handleTriggerToggle('clientRequest')}
                                    >
                                        <MaterialIcons
                                            name={escalation.triggers.clientRequest ? "check-box" : "check-box-outline-blank"}
                                            size={22}
                                            color={escalation.triggers.clientRequest ? "#60a5fa" : "rgba(255,255,255,0.5)"}
                                        />
                                        <Text style={styles.checkboxLabel}>{t('twinBlock.triggerClientRequest')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => handleTriggerToggle('twinUnable')}
                                    >
                                        <MaterialIcons
                                            name={escalation.triggers.twinUnable ? "check-box" : "check-box-outline-blank"}
                                            size={22}
                                            color={escalation.triggers.twinUnable ? "#60a5fa" : "rgba(255,255,255,0.5)"}
                                        />
                                        <Text style={styles.checkboxLabel}>{t('twinBlock.triggerTwinUnable')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => handleTriggerToggle('keywords')}
                                    >
                                        <MaterialIcons
                                            name={escalation.triggers.keywords ? "check-box" : "check-box-outline-blank"}
                                            size={22}
                                            color={escalation.triggers.keywords ? "#60a5fa" : "rgba(255,255,255,0.5)"}
                                        />
                                        <Text style={styles.checkboxLabel}>{t('twinBlock.triggerKeywords')}</Text>
                                    </TouchableOpacity>

                                    {escalation.triggers.keywords && (
                                        <View style={styles.keywordsSection}>
                                            <View style={styles.keywordInputRow}>
                                                <TextInput
                                                    style={styles.keywordInput}
                                                    placeholder={t('twinBlock.newKeywordPlaceholder')}
                                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                                    value={keywordInput}
                                                    onChangeText={setKeywordInput}
                                                    onSubmitEditing={handleAddKeyword}
                                                />
                                                <TouchableOpacity
                                                    style={styles.addKeywordButton}
                                                    onPress={handleAddKeyword}
                                                >
                                                    <MaterialIcons name="add" size={20} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.keywordTags}>
                                                {escalation.keywords.map((keyword, index) => (
                                                    <View key={index} style={styles.keywordTag}>
                                                        <Text style={styles.keywordTagText}>{keyword}</Text>
                                                        <TouchableOpacity onPress={() => handleRemoveKeyword(keyword)}>
                                                            <MaterialIcons name="close" size={14} color="rgba(255,255,255,0.7)" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </>
                )}


            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    twinCard: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: "#1a1a2e",
        overflow: "hidden",
        position: "relative",
    },
    twinCardGlow1: {
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(19, 127, 236, 0.3)",
    },
    twinCardGlow2: {
        position: "absolute",
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(147, 51, 234, 0.2)",
    },
    twinCardContent: {
        padding: 20,
    },
    twinHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    twinHeaderTouchable: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
    },
    twinIconColumn: {
        alignItems: "center",
        marginRight: 14,
    },
    twinIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    twinInfo: {
        flex: 1,
    },
    twinTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 6,
    },
    twinStatus: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#4ade80",
        marginRight: 6,
    },
    statusDotInactive: {
        backgroundColor: "#9ca3af",
    },
    statusText: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
    },
    testHintRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    testHint: {
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.5)",
        fontStyle: "italic",
        marginLeft: 4,
    },
    configureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    configureButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    configureButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.primary,
    },
    appointmentsDivider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 16,
    },
    appointmentsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    appointmentsIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    appointmentsInfo: {
        flex: 1,
    },
    appointmentsLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    appointmentsHint: {
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: 2,
    },
    // Escalation styles
    escalationDivider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: 16,
    },
    escalationSection: {
        marginBottom: 8,
    },
    escalationHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    escalationHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    escalationTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    escalationHint: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.5)",
        marginBottom: 8,
    },
    escalationExpandButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
    },
    escalationExpandText: {
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.7)",
    },
    escalationOptions: {
        marginTop: 8,
        paddingLeft: 4,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
    },
    checkboxLabel: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
    },
    keywordsSection: {
        marginTop: 12,
        paddingLeft: 32,
    },
    keywordInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    keywordInput: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: "#FFFFFF",
    },
    addKeywordButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#60a5fa",
        alignItems: "center",
        justifyContent: "center",
    },
    keywordTags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    keywordTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(96, 165, 250, 0.3)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    keywordTagText: {
        fontSize: 12,
        color: "#FFFFFF",
    },
    // Session Limit Styles
    sessionLimitRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 10,
    },
    sessionLimitInput: {
        width: 60,
        height: 40,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    sessionLimitLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.7)",
    },
    // Minutes Usage Bar
    usageSection: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    usageRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    usageText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255,255,255,0.85)",
    },
    usageBarBg: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 3,
        overflow: "hidden",
    },
    usageBarFill: {
        height: "100%",
        backgroundColor: "#d4af37",
        borderRadius: 3,
    },
    usageBarOver: {
        backgroundColor: "#ef4444",
    },
    usageWarningRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 8,
    },
    usageWarningText: {
        fontSize: 12,
        color: "#fbbf24",
    },
});
