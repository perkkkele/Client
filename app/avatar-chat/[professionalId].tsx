import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Animated,
    Easing,
    Dimensions,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAuth, useIncomingCall } from "../../context";
import { userApi, liveAvatarApi, chatApi, chatMessageApi, appointmentApi, getAssetUrl, analyticsApi, digitalTwinContextApi } from "../../api";
import { TimeSlot } from "../../api/appointment";
import { User } from "../../api/user";
import LiveAvatarVideo, { isLiveKitAvailable } from "../../components/LiveAvatarVideo";
import HumanVideoCall from "../../components/HumanVideoCall";
import { WebView } from "react-native-webview";
import { getVideoCallToken } from "../../api/videoCall";

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
    gray50: "#F9FAFB",
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
    indigo200: "#C7D2FE",
    indigo300: "#A5B4FC",
    indigo400: "#818CF8",
    indigo500: "#6366F1",
    indigo600: "#4F46E5",
    indigo700: "#4338CA",
    indigo800: "#3730A3",
    indigo900: "#312E81",
    purple50: "#FAF5FF",
    purple900: "#581C87",
    white: "#FFFFFF",
    black: "#000000",
};

type InfoBubbleType = "profile" | "contact" | "location" | "share" | "private" | "appointments" | "escalation" | "escalation_keyword" | null;

interface Message {
    id: string;
    type: "text" | "audio" | "typing";
    content?: string;
    isUser: boolean;
    isFromProfessional?: boolean; // Added for real professional messages
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

// Conversation interface for drawer
interface Conversation {
    id: string;
    title: string;
    preview: string;
    date: string;
    isActive?: boolean;
}

// Mock conversations for drawer
const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        title: "Consulta actual",
        preview: "Hola, ¿en qué puedo ayudarte hoy con tu salud?",
        date: "Hoy",
        isActive: true,
    },
    {
        id: "2",
        title: "Seguimiento Tratamiento",
        preview: "Muchas gracias, he notado mejoría con el nuevo tratamiento.",
        date: "Ayer",
    },
    {
        id: "3",
        title: "Análisis de Laboratorio",
        preview: "Aquí adjunto los resultados del perfil lipídico.",
        date: "12 Oct",
    },
    {
        id: "4",
        title: "Consulta Inicial",
        preview: "Hola, me gustaría agendar una revisión general.",
        date: "28 Sep",
    },
    {
        id: "5",
        title: "Dudas Generales",
        preview: "¿Es normal tener pulsaciones altas después de comer?",
        date: "15 Sep",
    },
];

const INFO_BUBBLE_CONTENT: Record<Exclude<InfoBubbleType, null>, { title: string; content: string; icon: string; subtitle?: string }> = {
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
    private: {
        title: "Conversación Privada",
        subtitle: "Modo incógnito",
        content: "Al activar esta opción, los mensajes de esta sesión no aparecerán en el historial, proporcionando máxima seguridad y privacidad.",
        icon: "lock",
    },
    appointments: {
        title: "Agendar Cita",
        content: "Agenda una cita con el profesional para una consulta presencial o virtual.",
        icon: "event",
    },
    escalation: {
        title: "Atención personalizada",
        subtitle: "con el profesional",
        content: "El gemelo ofrece ayuda inmediata. Al escalar, la sesión se pausará y la respuesta puede no ser inmediata.",
        icon: "support-agent",
    },
    escalation_keyword: {
        title: "Para asegurarme de ayudarte de la mejor forma posible…",
        subtitle: "",
        content: "¿Quieres hablar directamente con el profesional?\n\nPor lo que comentas, puede que este tema requiera atención humana.\n\nPuedes seguir hablando con el gemelo digital o, si lo deseas, escalar la conversación. Ten en cuenta que al hacerlo la respuesta del profesional puede no ser inmediata.\n\nPara una atención directa, también puedes reservar una cita.",
        icon: "priority-high",
    },
};

export default function AvatarChatScreen() {
    const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
    const params = useLocalSearchParams();

    // Video call params (when navigating from incoming-call)
    const isVideoCallMode = params.videoCall === "true";
    const videoCallChatId = params.chatId as string | undefined;

    const { token, user: currentUser } = useAuth();
    const { subscribeToMessages } = useIncomingCall();
    const [professional, setProfessional] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [activeInfoBubble, setActiveInfoBubble] = useState<InfoBubbleType>(null);
    const [isVideoMinimized, setIsVideoMinimized] = useState(false);
    const [isPrivateMode, setIsPrivateMode] = useState(false);
    const [hasShownPrivateBubble, setHasShownPrivateBubble] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerSearchText, setDrawerSearchText] = useState("");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Appointment Booking State
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingAppointment, setBookingAppointment] = useState(false);

    // Pause/Resume Avatar State
    const [isPaused, setIsPaused] = useState(false);
    const [showMuteReminder, setShowMuteReminder] = useState(false);

    // LiveAvatar Session State
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    // Human Video Call State (when in live call with real professional)
    const [isHumanSession, setIsHumanSession] = useState(isVideoCallMode);
    const [humanCallLivekitUrl, setHumanCallLivekitUrl] = useState<string | null>(null);
    const [humanCallToken, setHumanCallToken] = useState<string | null>(null);
    const [humanCallConnected, setHumanCallConnected] = useState(false);

    // Escalation state
    const [escalationStatus, setEscalationStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none');
    const [isEscalating, setIsEscalating] = useState(false);

    // Animation values
    const waveAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;
    const videoPositionAnim = useRef(new Animated.Value(0)).current; // 0 = full, 1 = PiP
    const infoBubbleAnim = useRef(new Animated.Value(0)).current;
    const infoBubbleScaleAnim = useRef(new Animated.Value(0)).current;
    const drawerAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.85)).current;

    // Ref to store send text function from LiveAvatarVideo
    const sendTextToAvatarRef = useRef<((text: string) => void) | null>(null);

    // Ref to track last typed message to prevent duplicates from user.transcription events
    const lastTypedMessageRef = useRef<string | null>(null);

    // Ref to track conversation start time for analytics
    const conversationStartTimeRef = useRef<number | null>(null);

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

    // Drawer functions
    const openDrawer = () => {
        setIsDrawerOpen(true);
        // Reload conversations when drawer opens to show latest
        loadConversations();
        Animated.spring(drawerAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const closeDrawer = () => {
        Animated.spring(drawerAnim, {
            toValue: -SCREEN_WIDTH * 0.85,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start(() => {
            setIsDrawerOpen(false);
        });
    };

    // Delete a specific conversation
    const handleDeleteConversation = async (id: string) => {
        if (!token) return;
        try {
            await chatApi.deleteChat(token, id);
            setConversations(prev => prev.filter(c => c.id !== id));
            // If we deleted the current chat, clear it
            if (currentChatId === id) {
                setCurrentChatId(null);
                setMessages(INITIAL_MESSAGES);
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    // Clear all conversation history
    const handleClearAllHistory = async () => {
        if (!token) return;
        try {
            for (const conv of conversations) {
                await chatApi.deleteChat(token, conv.id);
            }
            setConversations([]);
            setCurrentChatId(null);
            setMessages(INITIAL_MESSAGES);
        } catch (error) {
            console.error("Error clearing history:", error);
        }
    };

    // Select an existing conversation and load its messages
    const handleSelectConversation = async (conversationId: string) => {
        if (!token) return;
        setCurrentChatId(conversationId);
        closeDrawer();

        try {
            const chatMessages = await chatMessageApi.getMessages(token, conversationId);

            // Convert backend messages to local Message format
            const formattedMessages: Message[] = chatMessages.map((msg: any) => ({
                id: msg._id,
                type: 'text' as const, // Local Message type only supports text/audio/typing
                content: msg.message || '',
                isUser: !msg.isFromBot && !msg.isFromProfessional, // User is neither bot nor pro
                isFromProfessional: msg.isFromProfessional || false,
                timestamp: new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }));

            // Add initial message if no messages exist
            if (formattedMessages.length === 0) {
                setMessages(INITIAL_MESSAGES);
            } else {
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("Error loading conversation messages:", error);
            setMessages(INITIAL_MESSAGES);
        }
    };

    const loadProfessional = useCallback(async () => {
        if (!token || !professionalId) return;
        setIsLoading(true);
        try {
            const data = await userApi.getUser(token, professionalId);
            console.log('[DEBUG] Professional data loaded:', { appointmentsEnabled: data.appointmentsEnabled, appointmentHours: data.appointmentHours });
            setProfessional(data);
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, professionalId]);

    // Load existing conversations with this professional
    const loadConversations = useCallback(async () => {
        if (!token || !professionalId) {
            console.log('[loadConversations] Missing token or professionalId');
            return;
        }
        setLoadingConversations(true);
        console.log('[loadConversations] Loading conversations for professional:', professionalId);
        try {
            const chats = await chatApi.getChats(token);
            console.log('[loadConversations] All chats from API:', chats.length);

            // Filter avatar chats that involve this professional
            const professionalChats = chats.filter((chat: any) => {
                const p1Id = typeof chat.participant_one === 'string' ? chat.participant_one : chat.participant_one?._id;
                const p2Id = typeof chat.participant_two === 'string' ? chat.participant_two : chat.participant_two?._id;
                const matchesProfessional = p1Id === professionalId || p2Id === professionalId;
                const isAvatarChat = chat.isAvatarChat === true;
                console.log('[loadConversations] Chat:', chat._id, 'isAvatarChat:', isAvatarChat, 'matchesPro:', matchesProfessional);
                return matchesProfessional && isAvatarChat;
            });

            console.log('[loadConversations] Filtered professional chats:', professionalChats.length);

            // Format for drawer display (use setCurrentChatId state to get latest value)
            setConversations([]); // Clear first
            const formattedConversations: Conversation[] = await Promise.all(
                professionalChats.map(async (chat: any, index: number) => {
                    try {
                        const lastMsg = await chatMessageApi.getLastMessage(token, chat._id);
                        const date = new Date(chat.updatedAt || chat.createdAt);
                        const today = new Date();
                        const isToday = date.toDateString() === today.toDateString();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const isYesterday = date.toDateString() === yesterday.toDateString();

                        return {
                            id: chat._id,
                            title: `Conversación ${professionalChats.length - index}`,
                            preview: lastMsg?.message || 'Sin mensajes',
                            date: isToday ? 'Hoy' : isYesterday ? 'Ayer' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                            isActive: false, // Will be updated when rendering based on current state
                        };
                    } catch {
                        return {
                            id: chat._id,
                            title: `Conversación ${professionalChats.length - index}`,
                            preview: 'Sin mensajes',
                            date: new Date(chat.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                            isActive: false,
                        };
                    }
                })
            );

            console.log('[loadConversations] Formatted conversations:', formattedConversations.length);
            setConversations(formattedConversations);
        } catch (error) {
            console.error("[loadConversations] Error loading conversations:", error);
        } finally {
            setLoadingConversations(false);
        }
    }, [token, professionalId]); // Removed currentChatId to prevent recreation

    // Save current conversation to backend (called when pressing "New Conversation")
    const saveCurrentConversation = useCallback(async () => {
        // Filter out initial messages and only save actual conversation messages
        const conversationMessages = messages.filter(msg =>
            !INITIAL_MESSAGES.some(initial => initial.id === msg.id)
        );

        if (conversationMessages.length === 0 || isPrivateMode || !token || !professionalId || !currentUser?._id) {
            console.log('[saveCurrentConversation] No messages to save or in private mode');
            return null;
        }

        console.log('[saveCurrentConversation] Saving', conversationMessages.length, 'messages');

        try {
            // Create a new chat for this conversation
            const newChat = await chatApi.createAvatarChat(token, currentUser._id, professionalId);
            console.log('[saveCurrentConversation] Created chat:', newChat._id);

            // Save all messages to the chat
            for (const msg of conversationMessages) {
                const isFromBot = !msg.isUser;
                await chatMessageApi.sendTextMessage(token, newChat._id, msg.content || '', isFromBot);
            }

            console.log('[saveCurrentConversation] All messages saved successfully');
            return newChat._id;
        } catch (error) {
            console.error('[saveCurrentConversation] Error saving conversation:', error);
            return null;
        }
    }, [messages, isPrivateMode, token, professionalId, currentUser]);

    // Handle New Conversation button press
    const handleNewConversation = useCallback(async () => {
        console.log('[handleNewConversation] Starting new conversation');

        // Save current conversation to backend first
        await saveCurrentConversation();

        // Clear current chat ID and messages
        setCurrentChatId(null);
        setMessages(INITIAL_MESSAGES);

        // Close drawer
        closeDrawer();

        // Reload conversations list to show the saved one
        await loadConversations();

        console.log('[handleNewConversation] New conversation started');
    }, [saveCurrentConversation, loadConversations, closeDrawer]);

    useEffect(() => {
        loadProfessional();
        loadConversations();
    }, [loadProfessional, loadConversations]);

    // Initialize human video call when in video call mode
    useEffect(() => {
        const initHumanVideoCall = async () => {
            if (!isVideoCallMode || !videoCallChatId || !token) return;

            console.log('[AvatarChat] Initializing human video call for chat:', videoCallChatId);

            try {
                const callData = await getVideoCallToken(token, videoCallChatId);
                console.log('[AvatarChat] Got video call token, connecting to:', callData.livekitUrl);

                setHumanCallLivekitUrl(callData.livekitUrl);
                setHumanCallToken(callData.token ?? null);
                setIsHumanSession(true);
            } catch (error) {
                console.error('[AvatarChat] Error getting video call token:', error);
                setIsHumanSession(false);
            }
        };

        initHumanVideoCall();
    }, [isVideoCallMode, videoCallChatId, token]);

    // Initialize LiveAvatar session when professional is loaded (skip if in human session)
    const initializeLiveAvatarSession = useCallback(async () => {
        if (!professional?.digitalTwin?.isActive) {
            console.log("Digital twin not active, skipping session initialization");
            return;
        }

        let digitalTwin = professional.digitalTwin;
        const avatarId = digitalTwin.appearance?.liveAvatarId;
        const voiceId = digitalTwin.appearance?.liveVoiceId;
        let contextId = digitalTwin.liveAvatarContextId;

        if (!avatarId) {
            console.log("No avatar ID configured, skipping session");
            setSessionError("El profesional no tiene un avatar configurado");
            setSessionStatus('error');
            return;
        }

        // Check if context needs regeneration (settings changed since last sync)
        if (digitalTwin.contextNeedsSync || !contextId) {
            if (token && professional._id) {
                console.log("[AvatarChat] Context needs sync, regenerating...");
                setSessionStatus('connecting');
                setSessionError(null);
                try {
                    // Get fresh professional data and regenerate context
                    const freshProfessional = await userApi.getUser(token, professional._id);
                    const newContextId = await digitalTwinContextApi.regenerateDigitalTwinContext(token, freshProfessional);
                    if (newContextId) {
                        contextId = newContextId;
                        console.log("[AvatarChat] Context regenerated:", contextId);
                    }
                } catch (syncError: any) {
                    console.error("[AvatarChat] Error regenerating context:", syncError);
                    // Continue with existing context if available
                    if (!contextId) {
                        setSessionError("Error al sincronizar el gemelo digital");
                        setSessionStatus('error');
                        return;
                    }
                }
            }
        }

        if (!contextId) {
            console.log("No context ID configured, skipping session");
            setSessionError("El gemelo digital no está completamente configurado. Falta el contexto.");
            setSessionStatus('error');
            return;
        }

        console.log("Initializing LiveAvatar session with:", { avatarId, voiceId, contextId });
        setSessionStatus('connecting');
        setSessionError(null);

        try {
            // Step 1: Create session token
            // Use the professional's profile language (set during onboarding) as primary,
            // then fall back to voice language, then to Spanish
            const configuredLanguage = professional?.language
                || digitalTwin.appearance?.liveVoiceLanguage
                || "es";

            const config = {
                avatarId,
                voiceId: voiceId || undefined,
                contextId: contextId || undefined,
                language: configuredLanguage,
            };

            console.log("Creating session token with config:", config);
            const tokenResponse = await liveAvatarApi.createSessionToken(config);
            console.log("Session token created:", tokenResponse.session_id);

            // Step 2: Start the session
            console.log("Starting session...");
            const startResponse = await liveAvatarApi.startSession(tokenResponse.session_token);
            console.log("Session started:", startResponse);

            // Step 3: Store LiveKit credentials and session token
            setLivekitUrl(startResponse.livekit_url);
            setLivekitToken(startResponse.livekit_client_token);
            setSessionId(startResponse.session_id);
            setSessionToken(tokenResponse.session_token); // Store for sendTextToAvatar
            setSessionStatus('active');

            // Start tracking conversation duration
            conversationStartTimeRef.current = Date.now();

            console.log("LiveAvatar session active!");
            console.log("LiveKit URL:", startResponse.livekit_url);

        } catch (error: any) {
            console.error("Error initializing LiveAvatar session:", error);
            setSessionError(error.message || "Error al conectar con el avatar");
            setSessionStatus('error');
        }
    }, [professional]);

    // Start session when professional is loaded
    useEffect(() => {
        if (professional && !isLoading && sessionStatus === 'idle') {
            initializeLiveAvatarSession();
        }
    }, [professional, isLoading, sessionStatus, initializeLiveAvatarSession]);

    // Track processed transcript entries to avoid duplicates
    const processedTranscriptCountRef = useRef(0);

    // NOTE: Transcript API polling disabled - endpoint returns 500 error
    // Transcription is now handled via LiveKit hooks in LiveAvatarVideo component
    // If you need to enable API polling in the future, the sessionId is available
    // and liveAvatarApi.getSessionTranscript(sessionId) can be called

    // Subscribe to real-time messages from professional
    useEffect(() => {
        if (!currentChatId || !subscribeToMessages) return;

        const unsubscribe = subscribeToMessages(currentChatId, (data) => {
            // Add the new message to the UI
            if (data.message.isFromProfessional) {
                const newMessage: Message = {
                    id: data.message._id,
                    type: 'text',
                    content: data.message.message,
                    isUser: false,
                    isFromProfessional: true,
                    timestamp: new Date(data.message.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                };
                setMessages(prev => [...prev, newMessage]);
                console.log('[AvatarChat] Added professional message via socket');

                // Scroll to bottom
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        });

        return unsubscribe;
    }, [currentChatId, subscribeToMessages]);

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
        return getAssetUrl(avatar);
    };

    const handleBack = () => {
        // Record conversation end event with duration
        if (token && professionalId && conversationStartTimeRef.current) {
            const durationSeconds = Math.floor((Date.now() - conversationStartTimeRef.current) / 1000);
            if (durationSeconds > 10) { // Only record if conversation lasted more than 10 seconds
                analyticsApi.recordEvent(token, professionalId, "conversationEnd", {
                    durationSeconds,
                    source: "app"
                }).catch(() => { });
            }
            conversationStartTimeRef.current = null;
        }
        router.back();
    };

    const handleSendMessage = async () => {
        console.log('handleSendMessage called, inputText:', inputText);
        if (!inputText.trim()) return;

        // Block sending when communication is paused
        if (isPaused) {
            const pausedMessage: Message = {
                id: `paused-${Date.now()}`,
                type: "text",
                content: "⏸️ La comunicación está en pausa. Toca el video para reanudar.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, pausedMessage]);
            return;
        }

        const messageText = inputText.trim();

        const newMessage: Message = {
            id: Date.now().toString(),
            type: "text",
            content: messageText,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        console.log('Adding new user message:', newMessage);
        setMessages(prev => {
            console.log('Current messages count:', prev.length);
            return [...prev, newMessage];
        });
        setInputText("");

        // Keyword detection for automatic escalation
        if (professional?.escalation?.enabled &&
            professional?.escalation?.triggers?.keywords &&
            professional?.escalation?.keywords?.length > 0 &&
            escalationStatus === 'none' &&
            !isHumanSession) {
            const lowerMessage = messageText.toLowerCase();
            const matchedKeyword = professional.escalation.keywords.find(
                (keyword: string) => lowerMessage.includes(keyword.toLowerCase())
            );
            if (matchedKeyword) {
                console.log('[Escalation] Keyword detected:', matchedKeyword);
                // Show keyword-specific escalation dialog
                setActiveInfoBubble('escalation_keyword');
                // Don't proceed to hide the info bubble - we just showed escalation dialog
            } else {
                // Hide info bubble when user sends a message (no keyword triggered)
                setActiveInfoBubble(null);
            }
        } else {
            // Hide info bubble when user sends a message (escalation not available)
            setActiveInfoBubble(null);
        }

        // Show mute reminder if avatar is muted
        if (isMuted && sessionStatus === 'active') {
            setShowMuteReminder(true);
            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowMuteReminder(false);
            }, 3000);
        }

        // Scroll to bottom
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // FIRST: Send text to LiveAvatar via data channel if available (don't block on DB)
        if (sessionStatus === 'active' && sendTextToAvatarRef.current) {
            try {
                // Store the typed message to prevent duplicate from user.transcription event
                lastTypedMessageRef.current = messageText;

                console.log('Sending text to LiveAvatar via data channel:', messageText);
                sendTextToAvatarRef.current(messageText);
                console.log('Text sent to LiveAvatar successfully');
                // The avatar's response will come through the onTranscription callback
            } catch (error: any) {
                console.error('Error sending text to LiveAvatar:', error);
                // Show error as a system message
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: "text",
                    content: "Error al enviar el mensaje al avatar. Por favor intenta de nuevo.",
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } else {
            console.log('Session not active or data channel not ready, cannot send message to avatar');
            // If session is not active, show a message
            const infoMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: "El avatar no está conectado. Espera a que se establezca la conexión.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, infoMessage]);
        }

        // SECOND: Save to database in background (don't await - non-blocking)
        if (!isPrivateMode && token && professionalId && currentUser?._id) {
            // Use an IIFE to handle the async DB operations in background
            (async () => {
                try {
                    let chatIdToUse = currentChatId;

                    // Auto-create chat if this is a new conversation
                    if (!chatIdToUse) {
                        console.log('[handleSendMessage] Auto-creating chat for new conversation');
                        const newChat = await chatApi.createAvatarChat(token, currentUser._id, professionalId);
                        chatIdToUse = newChat._id;
                        setCurrentChatId(newChat._id);
                        console.log('[handleSendMessage] Chat created:', newChat._id);
                    }

                    // Save the message to the chat
                    await chatMessageApi.sendTextMessage(token, chatIdToUse, messageText, false);
                    console.log('[handleSendMessage] Message saved to chat');
                } catch (error) {
                    console.error('[handleSendMessage] Error saving to DB:', error);
                }
            })();
        }
    };

    const handleQuickReply = (text: string) => {
        setInputText(text);
    };

    const handleViewProfile = () => {
        if (professionalId) {
            router.push(`/professional/${professionalId}`);
        }
    };

    // Handle escalation request - client wants to talk to human professional
    const handleEscalation = async () => {
        if (!token || !currentChatId || isEscalating) return;

        // Check if escalation is enabled for this professional
        if (!professional?.escalation?.enabled) {
            return;
        }

        setIsEscalating(true);
        try {
            await chatApi.escalateChat(token, currentChatId, 'client_request');
            setEscalationStatus('pending');

            // Record escalation event for analytics
            if (professionalId) {
                analyticsApi.recordEvent(token, professionalId, 'escalation', {
                    source: 'app',
                    chatId: currentChatId,
                });
            }

            // Pause the digital twin session while waiting for professional
            setIsPaused(true);

            // Add system message about escalation
            const escalationMessage: Message = {
                id: `escalation-${Date.now()}`,
                type: "text",
                content: "📞 Conversación escalada. El gemelo está en pausa mientras esperas al profesional.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, escalationMessage]);
        } catch (error) {
            console.error('Error escalating chat:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                type: "text",
                content: "⚠️ No se pudo contactar al profesional. Inténtalo de nuevo.",
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsEscalating(false);
        }
    };

    // Cancel escalation and resume digital twin conversation
    const handleCancelEscalation = () => {
        setEscalationStatus('none');
        setIsPaused(false);

        // Add system message
        const cancelMessage: Message = {
            id: `cancel-escalation-${Date.now()}`,
            type: "text",
            content: "✓ Has retomado la conversación con el gemelo digital.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, cancelMessage]);
    };

    const handleInfoBubblePress = async (type: InfoBubbleType) => {
        if (activeInfoBubble === type) {
            setActiveInfoBubble(null);
        } else {
            setActiveInfoBubble(type);
            // Load available slots when opening appointments bubble
            if (type === "appointments" && professionalId && token) {
                const today = new Date().toISOString().split("T")[0];
                setSelectedDate(today);
                await loadAvailableSlots(today);
            }
        }
    };

    // Generate next 7 days for date selection
    const generateNextDays = () => {
        const days = [];
        const today = new Date();
        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                date: date.toISOString().split("T")[0],
                dayName: i === 0 ? "Hoy" : dayNames[date.getDay()],
                dayNum: date.getDate().toString(),
            });
        }
        return days;
    };

    // Load available time slots for a date
    const loadAvailableSlots = async (date: string) => {
        if (!token || !professionalId) return;

        setLoadingSlots(true);
        setSelectedTime(null);
        try {
            const response = await appointmentApi.getAvailableSlots(token, professionalId, date);
            setAvailableSlots(response.slots);
        } catch (error) {
            console.error("Error loading slots:", error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    // Handle date selection
    const handleDateSelect = async (date: string) => {
        setSelectedDate(date);
        await loadAvailableSlots(date);
    };

    // Navigate to appointment booking screen with pre-filled date and time
    const handleConfirmAppointment = () => {
        if (!professionalId || !selectedDate || !selectedTime) return;

        // Close the bubble and reset state
        setActiveInfoBubble(null);

        // Navigate to book-appointment with pre-filled data
        router.push({
            pathname: `/book-appointment/${professionalId}`,
            params: {
                prefilledDate: selectedDate,
                prefilledTime: selectedTime,
            }
        } as any);

        // Reset local state
        setSelectedDate("");
        setSelectedTime(null);
        setAvailableSlots([]);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const avatarUrl = getAvatarUrl(professional?.avatar);
    // URL for the digital twin avatar (from LiveAvatar preview)
    const twinAvatarUrl = professional?.digitalTwin?.appearance?.liveAvatarPreview || null;
    const displayName = professional?.publicName ||
        `${professional?.firstname || ""} ${professional?.lastname || ""}`.trim() ||
        professional?.email?.split("@")[0] || "Profesional";

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            {/* Header Overlay */}
            <SafeAreaView edges={["top"]} style={styles.headerOverlay}>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                            <MaterialIcons name="menu" size={20} color={COLORS.gray600} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.professionalChip,
                                isHumanSession && { borderColor: '#F59E0B', borderWidth: 2 },
                                // Subtle highlight when escalation is available
                                (professional?.escalation?.enabled &&
                                    professional?.escalation?.triggers?.clientRequest &&
                                    escalationStatus === 'none' &&
                                    currentChatId &&
                                    !isHumanSession) && styles.professionalChipEscalationAvailable
                            ]}
                            onPress={() => {
                                // When escalation is available, show confirmation dialog
                                if (professional?.escalation?.enabled &&
                                    professional?.escalation?.triggers?.clientRequest &&
                                    escalationStatus === 'none' &&
                                    currentChatId &&
                                    !isHumanSession) {
                                    setActiveInfoBubble('escalation');
                                }
                            }}
                            disabled={isEscalating}
                        >
                            <View style={styles.avatarSmallContainer}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
                                ) : (
                                    <View style={styles.avatarSmallPlaceholder}>
                                        <MaterialIcons name="person" size={20} color={COLORS.gray400} />
                                    </View>
                                )}
                                <View style={[
                                    styles.onlineIndicatorSmall,
                                    isHumanSession && { backgroundColor: '#F59E0B' }
                                ]} />
                            </View>
                            <View style={styles.professionalChipText}>
                                <Text style={styles.professionalChipName}>{displayName}</Text>
                                <Text style={[
                                    styles.professionalChipRole,
                                    isHumanSession && { color: '#F59E0B', fontWeight: '600' }
                                ]}>
                                    {isHumanSession
                                        ? "👤 EN VIVO"
                                        : isEscalating
                                            ? "Contactando..."
                                            : (professional?.escalation?.enabled &&
                                                professional?.escalation?.triggers?.clientRequest &&
                                                escalationStatus === 'none' &&
                                                currentChatId)
                                                ? "Contactar con profesional"
                                                : `${professional?.profession || "Profesional"} AI`
                                    }
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.historyButton,
                            isPrivateMode && styles.historyButtonActive
                        ]}
                        onPress={() => {
                            const newPrivateMode = !isPrivateMode;
                            setIsPrivateMode(newPrivateMode);

                            if (newPrivateMode && !hasShownPrivateBubble) {
                                // Only show bubble the first time
                                setActiveInfoBubble("private");
                                setHasShownPrivateBubble(true);
                            } else {
                                // Close any open bubble when toggling
                                setActiveInfoBubble(null);
                            }
                        }}
                    >
                        <MaterialIcons
                            name={isPrivateMode ? "lock" : "history"}
                            size={20}
                            color={isPrivateMode ? COLORS.textMain : COLORS.gray600}
                        />
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
                    activeOpacity={isVideoMinimized ? 0.8 : 0.9}
                    onPress={() => {
                        if (isVideoMinimized) {
                            maximizeVideo();
                        } else {
                            // Toggle pause state when tapping center of video
                            setIsPaused(!isPaused);
                        }
                    }}
                >
                    {/* Pause Overlay */}
                    {isPaused && !isVideoMinimized && (
                        <View style={styles.pauseOverlay}>
                            <View style={styles.pauseIconContainer}>
                                <MaterialIcons name="play-arrow" size={48} color={COLORS.white} />
                            </View>
                            <Text style={styles.pauseText}>EN PAUSA</Text>
                            <Text style={styles.pauseHint}>Toca para reanudar</Text>
                        </View>
                    )}

                    {/* Human Video Call when in live session with professional */}
                    {isHumanSession && humanCallLivekitUrl && humanCallToken ? (
                        <HumanVideoCall
                            livekitUrl={humanCallLivekitUrl}
                            token={humanCallToken}
                            style={styles.videoImage}
                            onConnectionChange={(connected) => {
                                console.log('[HumanCall] Connection:', connected);
                                setHumanCallConnected(connected);
                            }}
                            onDisconnect={() => {
                                console.log('[HumanCall] Disconnected, returning to AI mode');
                                setIsHumanSession(false);
                                setHumanCallLivekitUrl(null);
                                setHumanCallToken(null);
                                setHumanCallConnected(false);
                            }}
                        />
                    ) : sessionStatus === 'active' && livekitUrl && livekitToken ? (
                        /* LiveKit AI Avatar when session is active */
                        <LiveAvatarVideo
                            livekitUrl={livekitUrl}
                            livekitToken={livekitToken}
                            style={styles.videoImage}
                            muted={isMuted}
                            onConnectionChange={(connected) => {
                                console.log('LiveKit connection:', connected);
                            }}
                            onError={(error) => {
                                console.error('LiveKit error:', error);
                            }}
                            onTranscription={(text, isFinal) => {
                                // Ignore avatar responses when communication is paused
                                if (isPaused) {
                                    console.log('[Paused] Ignoring avatar transcription:', text);
                                    return;
                                }

                                // Only add final transcriptions as messages (avatar's response)
                                if (isFinal && text.trim()) {
                                    const trimmedText = text.trim();
                                    const newMessage: Message = {
                                        id: `avatar-${Date.now()}`,
                                        type: 'text',
                                        content: trimmedText,
                                        isUser: false,
                                        timestamp: new Date().toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }),
                                    };
                                    setMessages(prev => [...prev, newMessage]);
                                    console.log('Avatar says:', trimmedText);

                                    // Save avatar response to chat (if chat exists and not in private mode)
                                    if (currentChatId && token && !isPrivateMode) {
                                        chatMessageApi.sendTextMessage(token, currentChatId, trimmedText, true)
                                            .then(() => console.log('[Avatar] Response saved to chat'))
                                            .catch(err => console.error('[Avatar] Error saving response:', err));
                                    }

                                    // Scroll to bottom
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }
                            }}
                            onUserTranscription={(text, isFinal) => {
                                // Ignore user voice input when communication is paused
                                if (isPaused) {
                                    console.log('[Paused] Ignoring user transcription:', text);
                                    return;
                                }

                                // Add user's spoken words as messages (but not typed messages that echo back)
                                if (isFinal && text.trim()) {
                                    const trimmedText = text.trim();

                                    // Check if this is a duplicate of a typed message
                                    if (lastTypedMessageRef.current &&
                                        trimmedText.toLowerCase() === lastTypedMessageRef.current.toLowerCase()) {
                                        console.log('Skipping duplicate user.transcription for typed message:', trimmedText);
                                        lastTypedMessageRef.current = null; // Clear after checking
                                        return;
                                    }

                                    const newMessage: Message = {
                                        id: `user-voice-${Date.now()}`,
                                        type: 'text',
                                        content: trimmedText,
                                        isUser: true,
                                        timestamp: new Date().toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }),
                                    };
                                    setMessages(prev => [...prev, newMessage]);
                                    console.log('User said:', trimmedText);

                                    // Scroll to bottom
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }
                            }}
                            onSendTextReady={(sendText) => {
                                console.log('Text sender ready');
                                sendTextToAvatarRef.current = sendText;
                            }}
                        />
                    ) : avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.videoImage} />
                    ) : (
                        <View style={styles.videoPlaceholderInner}>
                            <MaterialIcons name="person" size={80} color={COLORS.gray400} />
                        </View>
                    )}

                    {/* Session Status Overlay */}
                    {sessionStatus === 'connecting' && !isVideoMinimized && (
                        <View style={styles.sessionOverlay}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.sessionOverlayText}>Conectando con el avatar...</Text>
                        </View>
                    )}

                    {sessionStatus === 'active' && !isVideoMinimized && (
                        <View style={styles.sessionBadge}>
                            <View style={styles.sessionBadgeDot} />
                            <Text style={styles.sessionBadgeText}>EN VIVO</Text>
                        </View>
                    )}

                    {sessionStatus === 'error' && !isVideoMinimized && (
                        <View style={styles.sessionOverlay}>
                            <MaterialIcons name="error-outline" size={48} color={COLORS.gray400} />
                            <Text style={styles.sessionOverlayText}>{sessionError || 'Error de conexión'}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setSessionStatus('idle');
                                    setSessionError(null);
                                }}
                            >
                                <Text style={styles.retryButtonText}>Reintentar</Text>
                            </TouchableOpacity>
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

                    {/* Mute Reminder Toast */}
                    {showMuteReminder && (
                        <TouchableOpacity
                            style={styles.muteReminderToast}
                            onPress={() => {
                                setIsMuted(false);
                                setShowMuteReminder(false);
                            }}
                            activeOpacity={0.9}
                        >
                            <MaterialIcons name="volume-off" size={14} color={COLORS.white} />
                            <Text style={styles.muteReminderText}>Audio silenciado</Text>
                            <Text style={styles.muteReminderAction}>Tocar para activar</Text>
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
                        {/* Calendar icon for appointments - only visible if professional accepts appointments */}
                        {professional?.appointmentsEnabled && (
                            <TouchableOpacity
                                style={[
                                    styles.videoActionButton,
                                    activeInfoBubble === "appointments" && styles.videoActionPrimary
                                ]}
                                onPress={() => handleInfoBubblePress("appointments")}
                            >
                                <MaterialIcons name="event" size={18} color={activeInfoBubble === "appointments" ? COLORS.black : COLORS.white} />
                            </TouchableOpacity>
                        )}
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

            {/* Dynamic Info Bubble with overlay to close on tap outside */}
            {activeInfoBubble && (
                <>
                    {/* Invisible overlay to capture taps outside the bubble */}
                    <TouchableOpacity
                        style={styles.bubbleOverlay}
                        activeOpacity={1}
                        onPress={() => setActiveInfoBubble(null)}
                    />
                    <Animated.View
                        onStartShouldSetResponder={() => true}
                        onResponderTerminationRequest={() => false}
                        style={[
                            styles.infoBubble,
                            activeInfoBubble === "private" && styles.infoBubbleDark,
                            activeInfoBubble === "contact" && styles.infoBubbleContact,
                            activeInfoBubble === "location" && styles.infoBubbleLocation,
                            activeInfoBubble === "share" && styles.infoBubbleShare,
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
                        {activeInfoBubble === "private" && (
                            <View style={styles.privateBubbleGlow} />
                        )}

                        {/* Header (not shown for location bubble) */}
                        {activeInfoBubble !== "location" && (
                            <View style={styles.infoBubbleHeader}>
                                <View style={[
                                    styles.infoBubbleIconContainer,
                                    activeInfoBubble === "private" && styles.infoBubbleIconContainerDark
                                ]}>
                                    <MaterialIcons
                                        name={INFO_BUBBLE_CONTENT[activeInfoBubble].icon as any}
                                        size={20}
                                        color={COLORS.primary}
                                    />
                                </View>
                                <View style={styles.infoBubbleTitleContainer}>
                                    <Text style={[
                                        styles.infoBubbleTitle,
                                        activeInfoBubble === "private" && styles.infoBubbleTitleDark
                                    ]}>
                                        {INFO_BUBBLE_CONTENT[activeInfoBubble].title}
                                    </Text>
                                    {INFO_BUBBLE_CONTENT[activeInfoBubble].subtitle && (
                                        <Text style={styles.infoBubbleSubtitle}>
                                            {INFO_BUBBLE_CONTENT[activeInfoBubble].subtitle}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.infoBubbleClose,
                                        activeInfoBubble === "private" && styles.infoBubbleCloseDark
                                    ]}
                                    onPress={() => setActiveInfoBubble(null)}
                                >
                                    <MaterialIcons name="close" size={18} color={activeInfoBubble === "contact" ? COLORS.indigo300 : COLORS.gray400} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Location bubble has its own close button */}
                        {activeInfoBubble === "location" && (
                            <TouchableOpacity
                                style={styles.locationCloseButton}
                                onPress={() => setActiveInfoBubble(null)}
                            >
                                <MaterialIcons name="close" size={20} color={COLORS.gray600} />
                            </TouchableOpacity>
                        )}

                        {/* Special Contact Content */}
                        {activeInfoBubble === "contact" && professional ? (
                            <View style={styles.contactContent}>
                                {/* Phone - Primary CTA (only if visible) */}
                                {professional.phone && (professional.contactVisibility?.phone !== false) && (
                                    <TouchableOpacity
                                        style={styles.contactItemPrimary}
                                        onPress={() => Linking.openURL(`tel:${professional.phone}`)}
                                    >
                                        <View style={styles.contactIconPrimary}>
                                            <MaterialIcons name="call" size={20} color={COLORS.white} />
                                        </View>
                                        <View style={styles.contactItemInfo}>
                                            <View style={styles.contactLabelRow}>
                                                <Text style={styles.contactLabel}>Móvil</Text>
                                                <View style={styles.callNowBadge}>
                                                    <Text style={styles.callNowText}>LLAMAR AHORA</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.contactValue}>{professional.phone}</Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.indigo400} />
                                    </TouchableOpacity>
                                )}

                                {/* Email (only if visible) */}
                                {professional.professionalEmail && (professional.contactVisibility?.email !== false) && (
                                    <TouchableOpacity
                                        style={styles.contactItem}
                                        onPress={() => Linking.openURL(`mailto:${professional.professionalEmail}`)}
                                    >
                                        <View style={styles.contactIcon}>
                                            <MaterialIcons name="mail" size={20} color={COLORS.indigo600} />
                                        </View>
                                        <View style={styles.contactItemInfo}>
                                            <Text style={styles.contactLabel}>Email</Text>
                                            <Text style={styles.contactValue}>{professional.professionalEmail}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {/* Website (only if visible) */}
                                {professional.website && (professional.contactVisibility?.website !== false) && (
                                    <TouchableOpacity
                                        style={styles.contactItem}
                                        onPress={() => {
                                            const url = professional.website!.startsWith('http')
                                                ? professional.website!
                                                : `https://${professional.website}`;
                                            Linking.openURL(url);
                                        }}
                                    >
                                        <View style={styles.contactIcon}>
                                            <MaterialIcons name="language" size={20} color={COLORS.indigo600} />
                                        </View>
                                        <View style={styles.contactItemInfo}>
                                            <Text style={styles.contactLabel}>Sitio Web</Text>
                                            <Text style={styles.contactValue}>{professional.website}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {/* Social Links */}
                                {professional.socialLinks && (
                                    <View style={styles.socialSection}>
                                        <Text style={styles.socialTitle}>Redes Sociales</Text>
                                        <View style={styles.socialLinks}>
                                            {professional.socialLinks.instagram && (
                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: "#FCE7F3" }]}
                                                    onPress={() => Linking.openURL(professional.socialLinks!.instagram!)}
                                                >
                                                    <FontAwesome5 name="instagram" size={18} color="#E4405F" />
                                                </TouchableOpacity>
                                            )}
                                            {professional.socialLinks.facebook && (
                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: "#DBEAFE" }]}
                                                    onPress={() => Linking.openURL(professional.socialLinks!.facebook!)}
                                                >
                                                    <FontAwesome5 name="facebook-f" size={18} color="#1877F2" />
                                                </TouchableOpacity>
                                            )}
                                            {professional.socialLinks.twitter && (
                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: "#F3F4F6" }]}
                                                    onPress={() => Linking.openURL(professional.socialLinks!.twitter!)}
                                                >
                                                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#000000" }}>𝕏</Text>
                                                </TouchableOpacity>
                                            )}
                                            {professional.socialLinks.linkedin && (
                                                <TouchableOpacity
                                                    style={[styles.socialButton, { backgroundColor: "#E0F2FE" }]}
                                                    onPress={() => Linking.openURL(professional.socialLinks!.linkedin!)}
                                                >
                                                    <FontAwesome5 name="linkedin-in" size={18} color="#0A66C2" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : activeInfoBubble === "location" && professional?.location ? (
                            <View style={styles.locationContent}>
                                {/* Map Container with embedded Google Maps */}
                                <View style={styles.mapContainer}>
                                    <View style={styles.mapVisual}>
                                        <WebView
                                            style={styles.mapWebView}
                                            source={{
                                                html: `
                                                    <!DOCTYPE html>
                                                    <html>
                                                    <head>
                                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                                        <style>
                                                            * { margin: 0; padding: 0; box-sizing: border-box; }
                                                            html, body, iframe { width: 100%; height: 100%; border: 0; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <iframe
                                                            src="https://www.google.com/maps?q=${professional.location?.lat || 40.4168},${professional.location?.lng || -3.7038}&z=15&output=embed"
                                                            width="100%"
                                                            height="100%"
                                                            style="border:0;"
                                                            allowfullscreen=""
                                                            loading="lazy">
                                                        </iframe>
                                                    </body>
                                                    </html>
                                                `
                                            }}
                                            scrollEnabled={false}
                                            onLoad={() => setMapLoaded(true)}
                                        />
                                        {!mapLoaded && (
                                            <View style={styles.mapLoading}>
                                                <ActivityIndicator size="large" color={COLORS.primary} />
                                                <Text style={styles.mapLoadingText}>Cargando mapa...</Text>
                                            </View>
                                        )}
                                        {/* Overlay button to open in external maps */}
                                        <TouchableOpacity
                                            style={styles.mapTapOverlay}
                                            onPress={() => {
                                                const lat = professional.location?.lat || 40.4168;
                                                const lng = professional.location?.lng || -3.7038;
                                                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                                            }}
                                        >
                                            <View style={styles.mapTapHint}>
                                                <MaterialIcons name="open-in-new" size={14} color={COLORS.white} />
                                                <Text style={styles.mapTapText}>Abrir en Maps</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    {/* Open indicator */}
                                    <View style={styles.openIndicator}>
                                        <View style={styles.openDot} />
                                        <Text style={styles.openText}>Abierto</Text>
                                    </View>
                                </View>

                                {/* Location Info */}
                                <View style={styles.locationInfo}>
                                    <View style={styles.locationHeader}>
                                        <View style={styles.locationIconContainer}>
                                            <MaterialIcons name="local-hospital" size={24} color={COLORS.indigo600} />
                                        </View>
                                        <View style={styles.locationDetails}>
                                            <Text style={styles.locationName}>
                                                {professional.publicName || `${professional.firstname} ${professional.lastname}`}
                                            </Text>
                                            <Text style={styles.locationAddress}>
                                                {professional.location.address || "Dirección no disponible"}
                                                {professional.location.city && `, ${professional.location.city}`}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.locationButtons}>
                                        <TouchableOpacity
                                            style={styles.directionsButton}
                                            onPress={() => {
                                                const lat = professional.location?.lat || 40.4168;
                                                const lng = professional.location?.lng || -3.7038;
                                                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                                            }}
                                        >
                                            <MaterialIcons name="directions" size={20} color={COLORS.textMain} />
                                            <Text style={styles.directionsButtonText}>Cómo llegar</Text>
                                        </TouchableOpacity>

                                        {professional.phone && (professional.contactVisibility?.phone !== false) && (
                                            <TouchableOpacity
                                                style={styles.callLocationButton}
                                                onPress={() => Linking.openURL(`tel:${professional.phone}`)}
                                            >
                                                <MaterialIcons name="call" size={20} color={COLORS.textMain} />
                                                <Text style={styles.callLocationButtonText}>Llamar</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ) : activeInfoBubble === "share" && professional ? (
                            <View style={styles.shareContent}>
                                {/* Share Grid */}
                                <View style={styles.shareGrid}>
                                    {/* WhatsApp */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            const message = `¡Mira este profesional! ${professional.publicName || professional.firstname}`;
                                            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, { backgroundColor: "#25D366" }]}>
                                            <FontAwesome5 name="whatsapp" size={24} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.shareLabel}>WhatsApp</Text>
                                    </TouchableOpacity>

                                    {/* Facebook */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            Linking.openURL(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(`¡Mira este profesional! ${professional.publicName || professional.firstname}`)}`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, { backgroundColor: "#1877F2" }]}>
                                            <FontAwesome5 name="facebook-f" size={24} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.shareLabel}>Facebook</Text>
                                    </TouchableOpacity>

                                    {/* Instagram */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            Linking.openURL(`instagram://`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, styles.shareIconInstagram]}>
                                            <FontAwesome5 name="instagram" size={24} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.shareLabel}>Instagram</Text>
                                    </TouchableOpacity>

                                    {/* X (Twitter) */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            const text = `¡Mira este profesional! ${professional.publicName || professional.firstname}`;
                                            Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, { backgroundColor: COLORS.black }]}>
                                            <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.white }}>𝕏</Text>
                                        </View>
                                        <Text style={styles.shareLabel}>X</Text>
                                    </TouchableOpacity>

                                    {/* LinkedIn */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, { backgroundColor: "#0A66C2" }]}>
                                            <FontAwesome5 name="linkedin-in" size={22} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.shareLabel}>LinkedIn</Text>
                                    </TouchableOpacity>

                                    {/* Telegram */}
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => {
                                            const text = `¡Mira este profesional! ${professional.publicName || professional.firstname}`;
                                            Linking.openURL(`https://t.me/share/url?text=${encodeURIComponent(text)}`);
                                        }}
                                    >
                                        <View style={[styles.shareIconContainer, { backgroundColor: "#229ED9" }]}>
                                            <FontAwesome5 name="telegram-plane" size={22} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.shareLabel}>Telegram</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : activeInfoBubble === "appointments" && professional ? (
                            <View style={styles.appointmentBubbleContent}>
                                {/* Header */}
                                <View style={styles.appointmentHeader}>
                                    <View>
                                        <Text style={styles.appointmentTitle}>Agendar Cita</Text>
                                        <View style={styles.appointmentScheduleRow}>
                                            <MaterialIcons name="schedule" size={14} color={COLORS.gray400} />
                                            <Text style={styles.appointmentScheduleText}>
                                                Horario: {professional.appointmentHours?.start || "09:00"} - {professional.appointmentHours?.end || "18:00"}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.appointmentCloseButton}
                                        onPress={() => setActiveInfoBubble(null)}
                                    >
                                        <MaterialIcons name="close" size={18} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>

                                {/* Date Selector */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.appointmentDateScroll}
                                    contentContainerStyle={styles.appointmentDateContainer}
                                >
                                    {generateNextDays().map((day) => (
                                        <TouchableOpacity
                                            key={day.date}
                                            style={[
                                                styles.appointmentDateButton,
                                                selectedDate === day.date && styles.appointmentDateButtonActive
                                            ]}
                                            onPress={() => handleDateSelect(day.date)}
                                        >
                                            <Text style={[
                                                styles.appointmentDateDayName,
                                                selectedDate === day.date && styles.appointmentDateTextActive
                                            ]}>
                                                {day.dayName}
                                            </Text>
                                            <Text style={[
                                                styles.appointmentDateDayNum,
                                                selectedDate === day.date && styles.appointmentDateTextActive
                                            ]}>
                                                {day.dayNum}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Time Slots Grid */}
                                <View style={styles.appointmentSlotsContainer}>
                                    {loadingSlots ? (
                                        <View style={styles.appointmentSlotsLoading}>
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                            <Text style={styles.appointmentSlotsLoadingText}>Cargando horarios...</Text>
                                        </View>
                                    ) : availableSlots.length === 0 ? (
                                        <Text style={styles.appointmentNoSlots}>No hay horarios disponibles</Text>
                                    ) : (
                                        <View style={styles.appointmentSlotsGrid}>
                                            {availableSlots.map((slot) => (
                                                <TouchableOpacity
                                                    key={slot.time}
                                                    style={[
                                                        styles.appointmentSlotButton,
                                                        !slot.available && styles.appointmentSlotDisabled,
                                                        selectedTime === slot.time && styles.appointmentSlotSelected
                                                    ]}
                                                    disabled={!slot.available}
                                                    onPress={() => setSelectedTime(slot.time)}
                                                >
                                                    <Text style={[
                                                        styles.appointmentSlotText,
                                                        !slot.available && styles.appointmentSlotTextDisabled,
                                                        selectedTime === slot.time && styles.appointmentSlotTextSelected
                                                    ]}>
                                                        {slot.time}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Continue to Booking Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.appointmentConfirmButton,
                                        (!selectedDate || !selectedTime) && styles.appointmentConfirmButtonDisabled
                                    ]}
                                    disabled={!selectedDate || !selectedTime}
                                    onPress={handleConfirmAppointment}
                                >
                                    <Text style={styles.appointmentConfirmText}>CONTINUAR</Text>
                                    <MaterialIcons name="arrow-forward" size={16} color={COLORS.black} />
                                </TouchableOpacity>

                                {/* Info */}
                                <Text style={styles.appointmentTerms}>
                                    Selecciona el tipo de cita y duración en la siguiente pantalla.
                                </Text>
                            </View>
                        ) : activeInfoBubble === "escalation" ? (
                            /* Escalation Confirmation Dialog */
                            <View style={styles.escalationDialogContent}>
                                <Text style={styles.escalationDialogText}>
                                    {INFO_BUBBLE_CONTENT.escalation.content}
                                </Text>

                                <Text style={styles.escalationDialogQuestion}>
                                    ¿Qué quieres hacer?
                                </Text>

                                {/* Book Appointment - Primary action (only if professional has appointments enabled) */}
                                {professional?.appointmentsEnabled && (
                                    <TouchableOpacity
                                        style={styles.escalationDialogButtonPrimary}
                                        onPress={() => {
                                            setActiveInfoBubble(null);
                                            if (professionalId) {
                                                router.push(`/book-appointment/${professionalId}` as any);
                                            }
                                        }}
                                    >
                                        <MaterialIcons name="event" size={18} color={COLORS.textMain} />
                                        <Text style={styles.escalationDialogButtonPrimaryText}>
                                            Reservar una cita
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Escalate - Secondary action */}
                                <TouchableOpacity
                                    style={styles.escalationDialogButtonSecondary}
                                    onPress={() => {
                                        setActiveInfoBubble(null);
                                        handleEscalation();
                                    }}
                                    disabled={isEscalating}
                                >
                                    <MaterialIcons name="support-agent" size={18} color={COLORS.gray600} />
                                    <Text style={styles.escalationDialogButtonSecondaryText}>
                                        {isEscalating ? 'Contactando...' : 'Escalar y esperar respuesta'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Continue with Twin - Tertiary action */}
                                <TouchableOpacity
                                    style={styles.escalationDialogButtonTertiary}
                                    onPress={() => setActiveInfoBubble(null)}
                                >
                                    <Text style={styles.escalationDialogButtonTertiaryText}>
                                        Seguir con el gemelo digital
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : activeInfoBubble === "escalation_keyword" ? (
                            /* Keyword-Triggered Escalation Dialog */
                            <View style={styles.escalationDialogContent}>
                                <Text style={styles.escalationDialogText}>
                                    {INFO_BUBBLE_CONTENT.escalation_keyword.content}
                                </Text>

                                {/* Book Appointment - Primary action (only if professional has appointments enabled) */}
                                {professional?.appointmentsEnabled && (
                                    <TouchableOpacity
                                        style={styles.escalationDialogButtonPrimary}
                                        onPress={() => {
                                            setActiveInfoBubble(null);
                                            if (professionalId) {
                                                router.push(`/book-appointment/${professionalId}` as any);
                                            }
                                        }}
                                    >
                                        <MaterialIcons name="event" size={18} color={COLORS.textMain} />
                                        <Text style={styles.escalationDialogButtonPrimaryText}>
                                            Reservar cita con el profesional
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Escalate - Secondary action */}
                                <TouchableOpacity
                                    style={styles.escalationDialogButtonSecondary}
                                    onPress={() => {
                                        setActiveInfoBubble(null);
                                        handleEscalation();
                                    }}
                                    disabled={isEscalating}
                                >
                                    <MaterialIcons name="support-agent" size={18} color={COLORS.gray600} />
                                    <Text style={styles.escalationDialogButtonSecondaryText}>
                                        {isEscalating ? 'Contactando...' : 'Escalar conversación y esperar respuesta'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Continue with Twin - Tertiary action */}
                                <TouchableOpacity
                                    style={styles.escalationDialogButtonTertiary}
                                    onPress={() => setActiveInfoBubble(null)}
                                >
                                    <Text style={styles.escalationDialogButtonTertiaryText}>
                                        Seguir con el gemelo digital
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={[
                                    styles.infoBubbleContent,
                                    activeInfoBubble === "private" && styles.infoBubbleContentDark
                                ]}>
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
                            </>
                        )}
                    </Animated.View>
                </>
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
                            <View style={[
                                styles.messageAvatar,
                                message.isFromProfessional && styles.messageAvatarPro
                            ]}>
                                {message.isFromProfessional ? (
                                    /* Professional human message - show profile photo */
                                    <>
                                        {avatarUrl ? (
                                            <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                                        ) : (
                                            <View style={[styles.messageAvatarPlaceholder, styles.messageAvatarPlaceholderPro]}>
                                                <MaterialIcons name="person" size={16} color={COLORS.white} />
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    /* Digital twin message - show digital avatar with robot badge */
                                    <>
                                        {twinAvatarUrl ? (
                                            <Image source={{ uri: twinAvatarUrl }} style={styles.messageAvatarImage} />
                                        ) : avatarUrl ? (
                                            /* Fallback to profile photo if no twin avatar */
                                            <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                                        ) : (
                                            <View style={styles.messageAvatarPlaceholder}>
                                                <MaterialIcons name="smart-toy" size={16} color={COLORS.gray400} />
                                            </View>
                                        )}
                                        {/* Robot badge for digital twin */}
                                        <View style={styles.twinBadge}>
                                            <MaterialIcons name="smart-toy" size={10} color={COLORS.white} />
                                        </View>
                                    </>
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
                                    message.isUser
                                        ? styles.messageBubbleUser
                                        : message.isFromProfessional
                                            ? styles.messageBubblePro
                                            : styles.messageBubbleBot
                                ]}>
                                    {/* Professional label for human messages */}
                                    {message.isFromProfessional && (
                                        <View style={styles.proBadgeInMessage}>
                                            <View style={styles.proBadgeDot} />
                                            <Text style={styles.proBadgeText}>EN VIVO</Text>
                                        </View>
                                    )}
                                    <Text style={[
                                        styles.messageText,
                                        message.isUser && styles.messageTextUser,
                                        message.isFromProfessional && styles.messageTextPro
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
                            {twinAvatarUrl ? (
                                <Image source={{ uri: twinAvatarUrl }} style={styles.messageAvatarImage} />
                            ) : avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                            ) : (
                                <View style={styles.messageAvatarPlaceholder}>
                                    <MaterialIcons name="smart-toy" size={16} color={COLORS.gray400} />
                                </View>
                            )}
                            {/* Robot badge for digital twin */}
                            <View style={styles.twinBadge}>
                                <MaterialIcons name="smart-toy" size={10} color={COLORS.white} />
                            </View>
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

                {/* Escalation Status Banner - with cancel option */}
                {escalationStatus === 'pending' && (
                    <View style={styles.escalationBanner}>
                        <View style={styles.escalationBannerContent}>
                            <MaterialIcons name="hourglass-top" size={14} color="#F59E0B" />
                            <Text style={styles.escalationBannerText}>
                                Esperando al profesional...
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.escalationBannerCancelButton}
                            onPress={handleCancelEscalation}
                        >
                            <Text style={styles.escalationBannerCancelText}>
                                Volver al gemelo
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {escalationStatus === 'accepted' && (
                    <View style={[styles.escalationBanner, styles.escalationBannerAccepted]}>
                        <MaterialIcons name="check-circle" size={14} color="#22C55E" />
                        <Text style={[styles.escalationBannerText, { color: '#22C55E' }]}>
                            El profesional se unirá pronto
                        </Text>
                    </View>
                )}

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

            {/* Conversations Drawer */}
            {isDrawerOpen && (
                <>
                    {/* Drawer Overlay */}
                    <TouchableOpacity
                        style={styles.drawerOverlay}
                        activeOpacity={1}
                        onPress={closeDrawer}
                    />
                    {/* Drawer Panel */}
                    <Animated.View
                        style={[
                            styles.drawer,
                            { transform: [{ translateX: drawerAnim }] }
                        ]}
                    >
                        {/* Drawer Header */}
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Conversaciones</Text>
                            <TouchableOpacity
                                style={styles.drawerCloseButton}
                                onPress={closeDrawer}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray400} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.drawerSearchContainer}>
                            <View style={styles.drawerSearchInputWrapper}>
                                <MaterialIcons name="search" size={20} color={COLORS.gray400} />
                                <TextInput
                                    style={styles.drawerSearchInput}
                                    placeholder="Buscar conversaciones..."
                                    placeholderTextColor={COLORS.gray400}
                                    value={drawerSearchText}
                                    onChangeText={setDrawerSearchText}
                                />
                            </View>
                            <TouchableOpacity style={styles.newConversationButton} onPress={handleNewConversation}>
                                <MaterialIcons name="add-comment" size={20} color={COLORS.white} />
                                <Text style={styles.newConversationText}>Nueva Conversación</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Conversations List */}
                        <ScrollView style={styles.drawerConversationsList} showsVerticalScrollIndicator={false}>
                            {/* Debug info - remove later */}
                            <Text style={{ color: COLORS.gray400, fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
                                {loadingConversations ? 'Cargando...' : `${conversations.length} conversaciones encontradas`}
                            </Text>

                            {loadingConversations ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                    <Text style={{ color: COLORS.gray400, marginTop: 8, fontSize: 12 }}>Cargando historial...</Text>
                                </View>
                            ) : conversations.length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.gray300} />
                                    <Text style={{ color: COLORS.gray500, marginTop: 12, fontSize: 14, fontWeight: '600' }}>Sin conversaciones</Text>
                                    <Text style={{ color: COLORS.gray400, marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                                        Tus conversaciones con este profesional aparecerán aquí
                                    </Text>
                                </View>
                            ) : (
                                conversations.filter(c =>
                                    c.title.toLowerCase().includes(drawerSearchText.toLowerCase()) ||
                                    c.preview.toLowerCase().includes(drawerSearchText.toLowerCase())
                                ).map((conversation) => {
                                    const isConvActive = conversation.id === currentChatId;
                                    return (
                                        <TouchableOpacity
                                            key={conversation.id}
                                            style={[
                                                styles.drawerConversationItem,
                                                isConvActive && styles.drawerConversationItemActive
                                            ]}
                                            onPress={() => handleSelectConversation(conversation.id)}
                                        >
                                            <View style={styles.drawerConversationHeader}>
                                                <Text style={[
                                                    styles.drawerConversationDate,
                                                    isConvActive && styles.drawerConversationDateActive
                                                ]}>
                                                    {conversation.date}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.drawerConversationTitle,
                                                isConvActive && styles.drawerConversationTitleActive
                                            ]} numberOfLines={1}>
                                                {conversation.title}
                                            </Text>
                                            <Text style={styles.drawerConversationPreview} numberOfLines={2}>
                                                {conversation.preview}
                                            </Text>
                                            {isConvActive && (
                                                <View style={styles.drawerConversationArrow}>
                                                    <MaterialIcons name="arrow-forward-ios" size={16} color={COLORS.primary} />
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                style={styles.drawerDeleteButton}
                                                onPress={() => handleDeleteConversation(conversation.id)}
                                            >
                                                <MaterialIcons name="delete" size={18} color={COLORS.gray400} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>

                        {/* Drawer Footer */}
                        <View style={styles.drawerFooter}>
                            <TouchableOpacity style={styles.drawerFooterOption}>
                                <MaterialIcons name="flag" size={20} color={COLORS.gray400} />
                                <Text style={styles.drawerFooterOptionText}>Reportar un problema</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.drawerFooterOption}>
                                <MaterialIcons name="notifications-off" size={20} color={COLORS.gray400} />
                                <Text style={styles.drawerFooterOptionText}>Silenciar notificaciones</Text>
                            </TouchableOpacity>
                            <View style={styles.drawerDivider} />
                            <TouchableOpacity style={styles.drawerHistoryToggle}>
                                <View style={styles.drawerHistoryToggleLeft}>
                                    <View style={styles.drawerHistoryIcon}>
                                        <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.drawerHistoryTitle}>Historial</Text>
                                        <Text style={styles.drawerHistorySubtitle}>Visible y guardado</Text>
                                    </View>
                                </View>
                                <View style={styles.drawerHistoryToggleSwitch}>
                                    <View style={styles.drawerHistoryToggleDot} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.drawerDeleteAllButton}
                                onPress={handleClearAllHistory}
                            >
                                <MaterialIcons name="delete-sweep" size={18} color="#EF4444" />
                                <Text style={styles.drawerDeleteAllText}>Borrar todo el historial</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </>
            )}
        </KeyboardAvoidingView>
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
    professionalChipEscalationAvailable: {
        // Very subtle - no visual change to chip itself, the text handles the indication
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
    // Pause Overlay Styles
    pauseOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    pauseIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    pauseText: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
        letterSpacing: 2,
    },
    pauseHint: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 4,
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
    muteReminderToast: {
        position: "absolute",
        top: 12,
        left: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(0,0,0,0.75)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    muteReminderText: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.white,
    },
    muteReminderAction: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.primary,
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
        zIndex: 1000,
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
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        lineHeight: 20,
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
        overflow: "visible", // Allow badge to overflow
        position: "relative",
    },
    messageAvatarPro: {
        borderWidth: 2,
        borderColor: "#F59E0B", // Gold border for professional
        overflow: "hidden",
    },
    messageAvatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 14,
    },
    messageAvatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
    },
    messageAvatarPlaceholderPro: {
        backgroundColor: "#F59E0B", // Gold background for pro placeholder
    },
    twinBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#8B5CF6", // Purple for AI
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: COLORS.white,
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
    // Professional message styles (real human pro, not AI twin)
    messageBubblePro: {
        backgroundColor: "#FFFBEB", // Amber-50
        borderBottomLeftRadius: 4,
        borderWidth: 2,
        borderColor: "#F59E0B", // Amber-500 (gold)
    },
    messageTextPro: {
        color: COLORS.textMain,
    },
    proBadgeInMessage: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 4,
    },
    proBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#EF4444", // Red for "live"
    },
    proBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#F59E0B",
        letterSpacing: 0.5,
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
    // Private mode styles
    historyButtonActive: {
        backgroundColor: COLORS.primary,
    },
    infoBubbleDark: {
        backgroundColor: "#2c2c24",
    },
    privateBubbleGlow: {
        position: "absolute",
        top: -16,
        right: -16,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${COLORS.primary}15`,
    },
    infoBubbleIconContainerDark: {
        backgroundColor: "#414136",
    },
    infoBubbleTitleContainer: {
        flex: 1,
    },
    infoBubbleTitleDark: {
        color: COLORS.white,
    },
    infoBubbleSubtitle: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.gray400,
        marginTop: 2,
    },
    infoBubbleCloseDark: {
        backgroundColor: "transparent",
    },
    infoBubbleContentDark: {
        color: "#d1d5db",
    },
    bubbleOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
    },
    // Contact Bubble Styles
    infoBubbleContact: {
        backgroundColor: COLORS.indigo50,
    },
    contactContent: {
        marginTop: 4,
    },
    contactItemPrimary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.6)",
        padding: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.indigo200,
        marginBottom: 8,
        shadowColor: COLORS.indigo600,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.4)",
        padding: 10,
        borderRadius: 16,
        marginBottom: 8,
    },
    contactIconPrimary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.indigo600,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    contactItemInfo: {
        flex: 1,
    },
    contactLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    contactLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: COLORS.indigo700,
        opacity: 0.7,
    },
    callNowBadge: {
        backgroundColor: COLORS.indigo100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    callNowText: {
        fontSize: 8,
        fontWeight: "700",
        color: COLORS.indigo700,
        letterSpacing: 0.5,
    },
    contactValue: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.indigo900,
        marginTop: 2,
    },
    socialSection: {
        marginTop: 12,
    },
    socialTitle: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.indigo800,
        opacity: 0.6,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 10,
        marginLeft: 4,
    },
    socialLinks: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 4,
    },
    socialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    socialIcon: {
        fontSize: 20,
    },
    // Location Bubble Styles
    infoBubbleLocation: {
        padding: 0,
        overflow: "hidden",
    },
    locationContent: {
        width: "100%",
    },
    mapContainer: {
        height: 160,
        backgroundColor: "#E8F4E8",
        position: "relative",
        overflow: "hidden",
    },
    mapVisual: {
        flex: 1,
    },
    mapBackground: {
        flex: 1,
        backgroundColor: "#D4E4D4",
        position: "relative",
    },
    mapGrid: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "space-evenly",
    },
    mapGridLine: {
        width: 1,
        height: "100%",
        backgroundColor: "rgba(100, 150, 100, 0.2)",
    },
    mapMarkerContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -24,
        marginLeft: -16,
        alignItems: "center",
    },
    mapMarkerPin: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    mapMarkerShadow: {
        width: 16,
        height: 6,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 8,
        marginTop: -4,
    },
    mapTapOverlay: {
        position: "absolute",
        bottom: 12,
        left: 12,
        right: 12,
        alignItems: "center",
    },
    mapTapHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    mapTapText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.white,
    },
    mapImage: {
        width: "100%",
        height: "100%",
        position: "absolute",
        zIndex: 2,
    },
    mapImageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: 3,
    },
    mapPlaceholder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.gray100,
        zIndex: 1,
    },
    mapPlaceholderText: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 8,
    },
    openIndicator: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    openDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.green500,
    },
    openText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.green500,
    },
    locationInfo: {
        padding: 16,
    },
    locationHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.indigo50,
        alignItems: "center",
        justifyContent: "center",
    },
    locationDetails: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 13,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    locationButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
    },
    directionsButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    directionsButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textMain,
    },
    callLocationButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.gray100,
        paddingVertical: 12,
        borderRadius: 12,
    },
    callLocationButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textMain,
    },
    locationCloseButton: {
        position: "absolute",
        top: 12,
        left: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 10,
    },
    // Share Bubble Styles
    infoBubbleShare: {
        backgroundColor: COLORS.indigo50,
    },
    shareContent: {
        marginTop: 4,
    },
    shareGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    shareButton: {
        width: "30%",
        alignItems: "center",
        marginBottom: 20,
    },
    shareIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    shareIconInstagram: {
        backgroundColor: "#E4405F",
    },
    shareEmoji: {
        fontSize: 22,
    },
    shareLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    // LiveAvatar Session Styles
    sessionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
    },
    sessionOverlayText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "500",
        marginTop: 12,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    sessionBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.9)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    sessionBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.white,
    },
    sessionBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: "600",
    },
    debugInfo: {
        position: "absolute",
        bottom: 60,
        left: 12,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    debugText: {
        color: COLORS.white,
        fontSize: 9,
        fontFamily: "monospace",
    },
    // WebView Map styles
    mapWebView: {
        width: "100%" as any,
        height: "100%" as any,
        borderRadius: 12,
    },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    mapLoadingText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.gray600,
    },
    // Drawer styles
    drawerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 100,
    },
    drawer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 320,
        height: "100%",
        backgroundColor: COLORS.backgroundLight,
        zIndex: 101,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 20,
    },
    drawerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 8,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    drawerCloseButton: {
        padding: 8,
        marginRight: -8,
    },
    drawerSearchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    drawerSearchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        gap: 8,
    },
    drawerSearchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMain,
        padding: 0,
    },
    newConversationButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.textMain,
        borderRadius: 16,
        paddingVertical: 14,
        gap: 8,
    },
    newConversationText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    drawerConversationsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    drawerConversationItem: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        position: "relative",
    },
    drawerConversationItemActive: {
        backgroundColor: COLORS.white,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    drawerConversationHeader: {
        marginBottom: 4,
    },
    drawerConversationDate: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray400,
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: "flex-start",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    drawerConversationDateActive: {
        backgroundColor: `${COLORS.primary}20`,
        color: COLORS.primary,
        fontWeight: "bold",
    },
    drawerConversationTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.gray600,
        marginBottom: 4,
    },
    drawerConversationTitleActive: {
        color: COLORS.textMain,
        fontWeight: "bold",
    },
    drawerConversationPreview: {
        fontSize: 12,
        color: COLORS.gray500,
        lineHeight: 18,
    },
    drawerConversationArrow: {
        position: "absolute",
        right: 16,
        top: 16,
    },
    drawerDeleteButton: {
        position: "absolute",
        right: 8,
        bottom: 8,
        padding: 6,
    },
    drawerFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        backgroundColor: `${COLORS.gray100}80`,
    },
    drawerFooterOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 12,
    },
    drawerFooterOptionText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    drawerDivider: {
        height: 1,
        backgroundColor: COLORS.gray200,
        marginVertical: 8,
    },
    drawerHistoryToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: 8,
    },
    drawerHistoryToggleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    drawerHistoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${COLORS.primary}20`,
        alignItems: "center",
        justifyContent: "center",
    },
    drawerHistoryTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    drawerHistorySubtitle: {
        fontSize: 10,
        fontWeight: "500",
        color: COLORS.gray500,
    },
    drawerHistoryToggleSwitch: {
        width: 36,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#22C55E",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingHorizontal: 2,
    },
    drawerHistoryToggleDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.white,
    },
    drawerDeleteAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        gap: 8,
    },
    drawerDeleteAllText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#EF4444",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // =========================================
    // APPOINTMENT BUBBLE STYLES
    // =========================================
    appointmentBubbleContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    appointmentTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    appointmentScheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    appointmentScheduleText: {
        fontSize: 10,
        color: COLORS.gray500,
        fontWeight: "500",
    },
    appointmentCloseButton: {
        padding: 4,
    },
    appointmentDateScroll: {
        marginBottom: 12,
        marginHorizontal: -20,
    },
    appointmentDateContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    appointmentDateButton: {
        width: 42,
        height: 52,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    appointmentDateButtonActive: {
        backgroundColor: COLORS.textMain,
        borderColor: COLORS.textMain,
    },
    appointmentDateDayName: {
        fontSize: 8,
        fontWeight: "500",
        textTransform: "uppercase",
        color: COLORS.gray400,
        marginBottom: 2,
    },
    appointmentDateDayNum: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.gray600,
    },
    appointmentDateTextActive: {
        color: COLORS.white,
    },
    appointmentSlotsContainer: {
        marginBottom: 16,
    },
    appointmentSlotsLoading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 20,
    },
    appointmentSlotsLoadingText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    appointmentNoSlots: {
        fontSize: 12,
        color: COLORS.gray500,
        textAlign: "center",
        paddingVertical: 20,
    },
    appointmentSlotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    appointmentSlotButton: {
        width: "22%",
        paddingVertical: 8,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        alignItems: "center",
    },
    appointmentSlotDisabled: {
        backgroundColor: COLORS.gray50,
        borderColor: "transparent",
    },
    appointmentSlotSelected: {
        backgroundColor: COLORS.indigo50,
        borderColor: COLORS.indigo500,
    },
    appointmentSlotText: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    appointmentSlotTextDisabled: {
        color: COLORS.gray300,
        textDecorationLine: "line-through",
    },
    appointmentSlotTextSelected: {
        color: COLORS.indigo700,
        fontWeight: "bold",
    },
    appointmentConfirmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.textMain,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    appointmentConfirmButtonDisabled: {
        backgroundColor: COLORS.gray300,
    },
    appointmentConfirmText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.white,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    appointmentTerms: {
        fontSize: 10,
        color: COLORS.gray400,
        textAlign: "center",
        lineHeight: 14,
    },
    // Escalation styles
    escalationButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#4F46E5",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    escalationButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.white,
    },
    escalationBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(245, 158, 11, 0.3)",
    },
    escalationBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    escalationBannerAccepted: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgba(34, 197, 94, 0.3)",
    },
    escalationBannerText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#F59E0B",
    },
    escalationBannerCancelButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    escalationBannerCancelText: {
        fontSize: 11,
        fontWeight: "500",
        color: COLORS.indigo500,
        textDecorationLine: "underline",
    },
    // Escalation Dialog Styles
    escalationDialogContent: {
        paddingTop: 4,
    },
    escalationDialogText: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.gray600,
        marginBottom: 16,
    },
    escalationDialogQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 12,
    },
    escalationDialogButtonPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    escalationDialogButtonPrimaryText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
    },
    escalationDialogButtonSecondary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: 10,
    },
    escalationDialogButtonSecondaryText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.gray600,
    },
    escalationDialogButtonTertiary: {
        alignItems: "center",
        paddingVertical: 8,
    },
    escalationDialogButtonTertiaryText: {
        fontSize: 13,
        color: COLORS.gray500,
        textDecorationLine: "underline",
    },
});
