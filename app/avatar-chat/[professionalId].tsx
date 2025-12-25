import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context";
import { userApi, API_HOST, API_PORT } from "../../api";
import { User } from "../../api/user";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIDEO_MAX_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio
const PIP_WIDTH = 120; // Picture-in-picture width
const PIP_HEIGHT = 160; // Picture-in-picture height

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    backgroundDark: "#23220f",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#2c2c24",
    textMain: "#181811",
    textMuted: "#64748B",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray600: "#475569",
    gray800: "#1E293B",
    slate900: "#0F172A",
    green500: "#22C55E",
    indigo50: "#EEF2FF",
    indigo100: "#E0E7FF",
    indigo900: "#312E81",
    purple50: "#FAF5FF",
    purple900: "#581C87",
    white: "#FFFFFF",
    black: "#000000",
};

type InfoBubbleType = "profile" | "contact" | "location" | "share" | null;

interface Message {
    id: string;
    type: "text" | "audio" | "typing";
    content?: string;
    isUser: boolean;
    timestamp: string;
    duration?: string;
}

// Mock messages
const INITIAL_MESSAGES: Message[] = [
    {
        id: "1",
        type: "text",
        content: "Hola, ¿en qué puedo ayudarte hoy con tu salud? Estoy aquí para responder tus dudas.",
        isUser: false,
        timestamp: "10:23 AM",
    },
];

const QUICK_REPLIES = [
    "¿Cuál es mi diagnóstico?",
    "Agendar cita",
    "Efectos secundarios",
    "Renovar receta",
];

const INFO_BUBBLE_CONTENT: Record<Exclude<InfoBubbleType, null>, { title: string; content: string; icon: string }> = {
    profile: {
        title: "Sobre mí",
        content: "Especialista con más de 15 años de experiencia. Formación en las mejores instituciones. Comprometido con tu bienestar.",
        icon: "person",
    },
    contact: {
        title: "Contacto",
        content: "Disponible de lunes a viernes de 9:00 a 18:00. Respuesta garantizada en menos de 24 horas.",
        icon: "call",
    },
    location: {
        title: "Ubicación",
        content: "Consulta principal en Centro Médico. También disponible para consultas online desde cualquier lugar.",
        icon: "location-on",
    },
    share: {
        title: "Compartir",
        content: "Comparte este perfil con amigos o familiares que puedan beneficiarse de una consulta profesional.",
        icon: "share",
    },
};

export default function AvatarChatScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const { token } = useAuth();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [activeInfoBubble, setActiveInfoBubble] = useState<InfoBubbleType>(null);
    const [isVideoMinimized, setIsVideoMinimized] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Animation values
    const waveAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;
    const videoPositionAnim = useRef(new Animated.Value(0)).current; // 0 = full, 1 = PiP
    const infoBubbleAnim = useRef(new Animated.Value(0)).current;
    const infoBubbleScaleAnim = useRef(new Animated.Value(0)).current;

    // Toggle video size
    const toggleVideoSize = () => {
        if (isVideoMinimized) {
            maximizeVideo();
        } else {
            minimizeVideo();
        }
    };

    const minimizeVideo = () => {
        setIsVideoMinimized(true);
        setActiveInfoBubble(null); // Hide info bubble when minimizing
        Animated.spring(videoPositionAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    const maximizeVideo = () => {
        setIsVideoMinimized(false);
        Animated.spring(videoPositionAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        setIsLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, professionalId]);

    useEffect(() => {
        loadProfessional();
    }, [loadProfessional]);

    useEffect(() => {
        // Animate wave bars
        const animations = waveAnims.map((anim, index) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400 + index * 50,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 400 + index * 50,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
        });

        Animated.stagger(100, animations).start();

        return () => {
            waveAnims.forEach(anim => anim.stopAnimation());
        };
    }, []);

    // Animate info bubble
    useEffect(() => {
        if (activeInfoBubble) {
            Animated.parallel([
                Animated.spring(infoBubbleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(infoBubbleScaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(infoBubbleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(infoBubbleScaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [activeInfoBubble]);

    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return null;
        if (avatar.startsWith("http")) return avatar;
        return `http://${API_HOST}:${API_PORT}/${avatar}`;
    };

    const handleBack = () => {
        router.back();
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            type: "text",
            content: inputText.trim(),
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText("");
        setIsTyping(true);

        // Hide info bubble when user sends a message
        setActiveInfoBubble(null);

        // Scroll to bottom
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Simulate bot response
        setTimeout(() => {
            setIsTyping(false);
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: "Gracias por tu mensaje. Estoy analizando tu consulta y te responderé en breve con información personalizada.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, botResponse]);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }, 2000);
    };

    const handleQuickReply = (text: string) => {
        setInputText(text);
    };

    const handleViewProfile = () => {
        if (professionalId) {
            router.push(`/professional/${professionalId}`);
        }
    };

    const handleInfoBubblePress = (type: InfoBubbleType) => {
        if (activeInfoBubble === type) {
            setActiveInfoBubble(null);
        } else {
            setActiveInfoBubble(type);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(professional?.avatar);
    const displayName = professional?.publicName ||
        `${professional?.firstname || ""} ${professional?.lastname || ""}`.trim() ||
        professional?.email?.split("@")[0] || "Profesional";

    return (
        <View style={styles.container}>
            {/* Header Overlay */}
            <SafeAreaView edges={["top"]} style={styles.headerOverlay}>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity style={styles.menuButton} onPress={handleBack}>
                            <MaterialIcons name="arrow-back" size={20} color={COLORS.gray600} />
                        </TouchableOpacity>
                        <View style={styles.professionalChip}>
                            <View style={styles.avatarSmallContainer}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
                                ) : (
                                    <View style={styles.avatarSmallPlaceholder}>
                                        <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                                    </View>
                                )}
                                <View style={styles.onlineIndicatorSmall} />
                            </View>
                            <View style={styles.professionalChipText}>
                                <Text style={styles.professionalChipName}>{displayName}</Text>
                                <Text style={styles.professionalChipRole}>
                                    {professional?.profession || "Profesional"} AI
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.historyButton}>
                        <MaterialIcons name="history" size={20} color={COLORS.gray600} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Video Feed - Resizable */}
            <Animated.View
                style={[
                    styles.videoContainer,
                    {
                        position: isVideoMinimized ? "absolute" : "relative",
                        zIndex: isVideoMinimized ? 100 : 1,
                        width: videoPositionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [SCREEN_WIDTH - 32, PIP_WIDTH],
                        }),
                        height: videoPositionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [VIDEO_MAX_HEIGHT - 32, PIP_HEIGHT],
                        }),
                        marginTop: videoPositionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 110],
                        }),
                        marginLeft: videoPositionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, SCREEN_WIDTH - PIP_WIDTH - 16],
                        }),
                        borderRadius: videoPositionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 12],
                        }),
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.videoPlaceholder}
                    activeOpacity={isVideoMinimized ? 0.8 : 1}
                    onPress={isVideoMinimized ? maximizeVideo : undefined}
                >
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.videoImage} />
                    ) : (
                        <View style={styles.videoPlaceholderInner}>
                            <MaterialIcons name="person" size={80} color={COLORS.gray400} />
                        </View>
                    )}

                    {/* Reduced gradient - only at bottom near buttons */}
                    <View style={styles.videoGradient} />

                    {/* Mute Button */}
                    {!isVideoMinimized && (
                        <TouchableOpacity
                            style={styles.muteButton}
                            onPress={() => setIsMuted(!isMuted)}
                        >
                            <MaterialIcons
                                name={isMuted ? "volume-off" : "volume-up"}
                                size={20}
                                color={COLORS.white}
                            />
                        </TouchableOpacity>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.videoActions}>
                        <TouchableOpacity
                            style={[
                                styles.videoActionButton,
                                activeInfoBubble === "profile" && styles.videoActionPrimary
                            ]}
                            onPress={() => handleInfoBubblePress("profile")}
                        >
                            <MaterialIcons name="person" size={18} color={activeInfoBubble === "profile" ? COLORS.black : COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.videoActionButton,
                                activeInfoBubble === "contact" && styles.videoActionPrimary
                            ]}
                            onPress={() => handleInfoBubblePress("contact")}
                        >
                            <MaterialIcons name="call" size={18} color={activeInfoBubble === "contact" ? COLORS.black : COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.videoActionButton,
                                activeInfoBubble === "location" && styles.videoActionPrimary
                            ]}
                            onPress={() => handleInfoBubblePress("location")}
                        >
                            <MaterialIcons name="location-on" size={18} color={activeInfoBubble === "location" ? COLORS.black : COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.videoActionButton,
                                activeInfoBubble === "share" && styles.videoActionPrimary
                            ]}
                            onPress={() => handleInfoBubblePress("share")}
                        >
                            <MaterialIcons name="ios-share" size={18} color={activeInfoBubble === "share" ? COLORS.black : COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Toggle Size Button */}
                    <TouchableOpacity
                        style={styles.toggleSizeButton}
                        onPress={toggleVideoSize}
                    >
                        <MaterialIcons
                            name={isVideoMinimized ? "expand-less" : "expand-more"}
                            size={20}
                            color={COLORS.white}
                        />
                    </TouchableOpacity>

                    {/* Minimized indicator text */}
                    {isVideoMinimized && (
                        <View style={styles.minimizedOverlay}>
                            <Text style={styles.minimizedText}>Toca para expandir</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Dynamic Info Bubble */}
            {activeInfoBubble && (
                <Animated.View
                    style={[
                        styles.infoBubble,
                        {
                            opacity: infoBubbleAnim,
                            transform: [
                                { scale: infoBubbleScaleAnim },
                                {
                                    translateY: infoBubbleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <View style={styles.infoBubbleHeader}>
                        <View style={styles.infoBubbleIconContainer}>
                            <MaterialIcons
                                name={INFO_BUBBLE_CONTENT[activeInfoBubble].icon as any}
                                size={20}
                                color={COLORS.primary}
                            />
                        </View>
                        <Text style={styles.infoBubbleTitle}>
                            {INFO_BUBBLE_CONTENT[activeInfoBubble].title}
                        </Text>
                        <TouchableOpacity
                            style={styles.infoBubbleClose}
                            onPress={() => setActiveInfoBubble(null)}
                        >
                            <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.infoBubbleContent}>
                        {INFO_BUBBLE_CONTENT[activeInfoBubble].content}
                    </Text>
                    {activeInfoBubble === "profile" && (
                        <TouchableOpacity
                            style={styles.infoBubbleAction}
                            onPress={handleViewProfile}
                        >
                            <Text style={styles.infoBubbleActionText}>Ver perfil completo</Text>
                            <MaterialIcons name="arrow-forward" size={16} color={COLORS.textMain} />
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            {/* Chat Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Today Separator */}
                <View style={styles.daySeparator}>
                    <Text style={styles.daySeparatorText}>Hoy</Text>
                </View>

                {/* Messages */}
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageRow,
                            message.isUser && styles.messageRowUser
                        ]}
                    >
                        {!message.isUser && (
                            <View style={styles.messageAvatar}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                                ) : (
                                    <View style={styles.messageAvatarPlaceholder}>
                                        <MaterialIcons name="person" size={16} color={COLORS.gray400} />
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={[
                            styles.messageBubbleContainer,
                            message.isUser && styles.messageBubbleContainerUser
                        ]}>
                            {message.type === "text" && (
                                <View style={[
                                    styles.messageBubble,
                                    message.isUser ? styles.messageBubbleUser : styles.messageBubbleBot
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        message.isUser && styles.messageTextUser
                                    ]}>
                                        {message.content}
                                    </Text>
                                </View>
                            )}
                            {message.type === "audio" && (
                                <View style={styles.audioMessage}>
                                    <TouchableOpacity style={styles.playButton}>
                                        <MaterialIcons name="play-arrow" size={24} color={COLORS.black} />
                                    </TouchableOpacity>
                                    <View style={styles.audioWaveContainer}>
                                        <View style={styles.audioWaves}>
                                            {waveAnims.slice(0, 8).map((anim, i) => (
                                                <Animated.View
                                                    key={i}
                                                    style={[
                                                        styles.audioWaveBar,
                                                        i > 5 && styles.audioWaveBarInactive,
                                                        {
                                                            transform: [{
                                                                scaleY: i > 5 ? 1 : anim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0.3, 1],
                                                                })
                                                            }]
                                                        }
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={styles.audioDuration}>0:15 / {message.duration}</Text>
                                    </View>
                                </View>
                            )}
                            <Text style={styles.messageTime}>{message.timestamp}</Text>
                        </View>
                    </View>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <View style={styles.messageRow}>
                        <View style={styles.messageAvatar}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                            ) : (
                                <View style={styles.messageAvatarPlaceholder}>
                                    <MaterialIcons name="person" size={16} color={COLORS.gray400} />
                                </View>
                            )}
                        </View>
                        <View style={styles.typingIndicator}>
                            <View style={styles.typingDot} />
                            <View style={[styles.typingDot, styles.typingDotDelay1]} />
                            <View style={[styles.typingDot, styles.typingDotDelay2]} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputArea}>
                {/* Quick Replies */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.quickRepliesContainer}
                    contentContainerStyle={styles.quickRepliesContent}
                >
                    {QUICK_REPLIES.map((reply, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickReplyButton}
                            onPress={() => handleQuickReply(reply)}
                        >
                            <Text style={styles.quickReplyText}>{reply}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Input Row */}
                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.addButton}>
                        <MaterialIcons name="add" size={22} color={COLORS.gray600} />
                    </TouchableOpacity>

                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Escribe un mensaje..."
                            placeholderTextColor={COLORS.gray400}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity style={styles.micButton}>
                            <MaterialIcons name="mic" size={20} color={COLORS.gray500} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.voiceButton}
                        onPress={handleSendMessage}
                    >
                        <MaterialIcons
                            name={inputText.trim() ? "send" : "graphic-eq"}
                            size={28}
                            color={inputText.trim() ? COLORS.primary : COLORS.white}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
    headerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    professionalChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        paddingLeft: 8,
        paddingRight: 16,
        paddingVertical: 8,
        borderRadius: 28,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarSmallContainer: {
        position: "relative",
    },
    avatarSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarSmallPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    onlineIndicatorSmall: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.green500,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    professionalChipText: {
        paddingRight: 8,
    },
    professionalChipName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    professionalChipRole: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    historyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    videoContainer: {
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    videoPlaceholder: {
        flex: 1,
        backgroundColor: COLORS.textMain,
    },
    videoImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    videoPlaceholderInner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.gray800,
    },
    // Reduced gradient - only covers bottom 48px (just above buttons)
    videoGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    muteButton: {
        position: "absolute",
        top: 12,
        left: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    videoActions: {
        position: "absolute",
        bottom: 8,
        right: 8,
        flexDirection: "row",
        gap: 6,
    },
    videoActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    videoActionPrimary: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dragHandle: {
        position: "absolute",
        bottom: 0,
        left: "50%",
        marginLeft: -30,
        width: 60,
        height: 24,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 4,
    },
    dragHandleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.5)",
    },
    // Dynamic Info Bubble
    infoBubble: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    infoBubbleHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoBubbleIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${COLORS.primary}33`,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    infoBubbleTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    infoBubbleClose: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    infoBubbleContent: {
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.gray600,
    },
    infoBubbleAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 6,
    },
    infoBubbleActionText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingBottom: 16,
        paddingTop: 12,
    },
    daySeparator: {
        alignItems: "center",
        marginVertical: 12,
    },
    daySeparatorText: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
        gap: 10,
    },
    messageRowUser: {
        justifyContent: "flex-end",
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: "hidden",
    },
    messageAvatarImage: {
        width: "100%",
        height: "100%",
    },
    messageAvatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    messageBubbleContainer: {
        maxWidth: "75%",
        alignItems: "flex-start",
    },
    messageBubbleContainerUser: {
        alignItems: "flex-end",
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
    },
    messageBubbleBot: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    messageBubbleUser: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textMain,
    },
    messageTextUser: {
        color: COLORS.textMain,
    },
    messageTime: {
        fontSize: 10,
        color: COLORS.gray400,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    audioMessage: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        padding: 10,
        paddingRight: 16,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        gap: 10,
        minWidth: 180,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    audioWaveContainer: {
        flex: 1,
        gap: 4,
    },
    audioWaves: {
        flexDirection: "row",
        alignItems: "center",
        height: 20,
        gap: 2,
    },
    audioWaveBar: {
        width: 3,
        height: "100%",
        backgroundColor: COLORS.textMain,
        borderRadius: 2,
    },
    audioWaveBarInactive: {
        backgroundColor: COLORS.gray300,
        transform: [{ scaleY: 0.5 }],
    },
    audioDuration: {
        fontSize: 10,
        color: COLORS.gray500,
        fontWeight: "500",
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        gap: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.gray400,
    },
    typingDotDelay1: {
        opacity: 0.7,
    },
    typingDotDelay2: {
        opacity: 0.4,
    },
    inputArea: {
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        paddingTop: 8,
        paddingBottom: 24,
    },
    quickRepliesContainer: {
        marginBottom: 8,
    },
    quickRepliesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    quickReplyButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    quickReplyText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        gap: 10,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    textInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: COLORS.white,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        minHeight: 44,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
    },
    micButton: {
        padding: 10,
    },
    voiceButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.black,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    toggleSizeButton: {
        position: "absolute",
        bottom: 8,
        left: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    minimizedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    minimizedText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.white,
    },
});
