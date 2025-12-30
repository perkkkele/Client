import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context";
import { userApi, liveAvatarApi, API_HOST, API_PORT } from "../../api";
import { PublicAvatar, PublicVoice, CreateAvatarResponse } from "../../api/liveAvatar";

// Video requirements constants
const VIDEO_REQUIREMENTS = {
    minDurationSeconds: 120, // 2 minutes
    structure: {
        listeningSeconds: 15,
        speaking1Seconds: 90,
        speaking2Seconds: 90,
        waitingSeconds: 15,
    },
};

// Dynamic import for expo-av (may not be available in Expo Go)
let Audio: any = null;
try {
    Audio = require("expo-av").Audio;
} catch (e) {
    console.log("expo-av not available, voice preview disabled");
}

// Dynamic import for expo-speech (TTS fallback)
let Speech: any = null;
try {
    Speech = require("expo-speech");
} catch (e) {
    console.log("expo-speech not available, TTS preview disabled");
}

// Sample text for voice preview when no audio sample is available
const VOICE_PREVIEW_TEXT = "Hola, soy tu asistente virtual. Estoy aquí para ayudarte con cualquier consulta profesional.";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    primary: "#FDE047",
    primaryDark: "#EAB308",
    backgroundLight: "#F3F4F6",
    backgroundDark: "#0B1121",
    surfaceLight: "#FFFFFF",
    surfaceDark: "#1F2937",
    textMain: "#111827",
    textMuted: "#6B7280",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    accentBlue: "#3B82F6",
    accentPurple: "#6366F1",
    accentGreen: "#10B981",
    headerStart: "#0f172a",
    headerMiddle: "#1e3a8a",
};

function getAvatarUrl(avatarPath: string | undefined): string | null {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://${API_HOST}:${API_PORT}/${avatarPath}`;
}

export default function TwinAppearanceScreen() {
    const { user, token, refreshUser } = useAuth();
    // Inicializar con valores guardados del usuario o defaults sensatos
    const [videoType, setVideoType] = useState<"predefined" | "trained">(
        user?.digitalTwin?.appearance?.videoType || "predefined"
    );
    const [voiceType, setVoiceType] = useState<"standard" | "cloned">(
        user?.digitalTwin?.appearance?.voiceType || "standard"
    );
    const [isLoading, setIsLoading] = useState(false);

    // Avatar catalog state
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [publicAvatars, setPublicAvatars] = useState<PublicAvatar[]>([]);
    const [loadingAvatars, setLoadingAvatars] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<PublicAvatar | null>(null);

    // Voice catalog state
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [publicVoices, setPublicVoices] = useState<PublicVoice[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<PublicVoice | null>(null);
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const soundRef = useRef<any>(null);
    const previewSoundRef = useRef<any>(null);

    // Video upload modal state
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [customAvatarStatus, setCustomAvatarStatus] = useState<CreateAvatarResponse | null>(null);

    // Help modal state
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Priorizar: avatar seleccionado en sesión > avatar guardado previamente > foto de usuario
    const avatarUrl = selectedAvatar?.preview_url
        || user?.digitalTwin?.appearance?.liveAvatarPreview
        || getAvatarUrl(user?.avatar);

    // Load previous selections from user data on mount
    useEffect(() => {
        const appearance = user?.digitalTwin?.appearance;
        if (appearance) {
            // Restore video type
            if (appearance.videoType) {
                setVideoType(appearance.videoType);
            }
            // Restore voice type  
            if (appearance.voiceType) {
                setVoiceType(appearance.voiceType);
            }
            // Restore selected avatar
            if (appearance.liveAvatarId && !selectedAvatar) {
                setSelectedAvatar({
                    id: appearance.liveAvatarId,
                    name: appearance.liveAvatarName || "Avatar",
                    preview_url: appearance.liveAvatarPreview || "",
                });
            }
            // Restore selected voice
            if (appearance.liveVoiceId && !selectedVoice) {
                setSelectedVoice({
                    id: appearance.liveVoiceId,
                    name: appearance.liveVoiceName || "Voz",
                    gender: appearance.liveVoiceGender || undefined,
                    language: appearance.liveVoiceLanguage || "es",
                });
            }
        }
    }, [user]);

    // Load public avatars when modal opens
    useEffect(() => {
        if (showAvatarModal && publicAvatars.length === 0) {
            loadPublicAvatars();
        }
    }, [showAvatarModal]);

    // Load public voices when modal opens
    useEffect(() => {
        if (showVoiceModal && publicVoices.length === 0) {
            loadPublicVoices();
        }
    }, [showVoiceModal]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            if (previewSoundRef.current) {
                previewSoundRef.current.unloadAsync();
            }
        };
    }, []);

    async function loadPublicAvatars() {
        setLoadingAvatars(true);
        try {
            const avatars = await liveAvatarApi.getPublicAvatars();
            setPublicAvatars(avatars);
        } catch (error) {
            console.error("Error loading avatars:", error);
            Alert.alert("Error", "No se pudieron cargar los avatares");
        } finally {
            setLoadingAvatars(false);
        }
    }

    async function loadPublicVoices() {
        setLoadingVoices(true);
        try {
            const voices = await liveAvatarApi.getPublicVoices();
            setPublicVoices(voices);
        } catch (error) {
            console.error("Error loading voices:", error);
            Alert.alert("Error", "No se pudieron cargar las voces");
        } finally {
            setLoadingVoices(false);
        }
    }

    async function playVoicePreview(voice: PublicVoice) {
        if (!Audio) {
            Alert.alert("No disponible", "La reproducción de audio requiere un build de desarrollo");
            return;
        }

        let previewUrl = voice.preview_url || voice.sample_url;

        // If no preview URL, try to fetch voice details from API
        if (!previewUrl) {
            try {
                setPlayingVoiceId(voice.id); // Show loading state
                const voiceDetails = await liveAvatarApi.getVoiceById(voice.id);
                if (voiceDetails) {
                    previewUrl = voiceDetails.preview_url || voiceDetails.sample_url;
                }
            } catch (error) {
                console.error("Error fetching voice details:", error);
            }
        }

        if (!previewUrl) {
            setPlayingVoiceId(null);
            Alert.alert("Sin muestra", "Esta voz no tiene una muestra de audio disponible");
            return;
        }

        try {
            // Stop any currently playing audio
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            if (playingVoiceId === voice.id) {
                // If same voice, just stop
                setPlayingVoiceId(null);
                return;
            }

            setPlayingVoiceId(voice.id);

            const { sound } = await Audio.Sound.createAsync(
                { uri: previewUrl },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            // Listen for playback completion
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingVoiceId(null);
                }
            });
        } catch (error) {
            console.error("Error playing voice preview:", error);
            setPlayingVoiceId(null);
            Alert.alert("Error", "No se pudo reproducir la muestra de voz");
        }
    }

    // Play preview in the main card (selected voice sample)
    async function playPreview() {
        if (!Audio) {
            Alert.alert("No disponible", "La reproducción de audio requiere un build de desarrollo");
            return;
        }

        if (!selectedVoice) {
            Alert.alert("Selecciona una voz", "Primero elige una voz del catálogo para escuchar la vista previa");
            return;
        }

        let previewUrl = selectedVoice.preview_url || selectedVoice.sample_url;

        // If no preview URL, try to fetch voice details from API
        if (!previewUrl) {
            try {
                setIsPreviewPlaying(true); // Show loading state
                const voiceDetails = await liveAvatarApi.getVoiceById(selectedVoice.id);
                if (voiceDetails) {
                    previewUrl = voiceDetails.preview_url || voiceDetails.sample_url;
                    // Update selectedVoice with the new preview URL for future plays
                    if (previewUrl) {
                        setSelectedVoice({ ...selectedVoice, preview_url: previewUrl });
                    }
                }
            } catch (error) {
                console.error("Error fetching voice details:", error);
            }
        }

        // If still no preview URL, use TTS fallback
        if (!previewUrl) {
            if (Speech) {
                setIsPreviewPlaying(true);
                const language = selectedVoice.language?.toLowerCase().includes('en') ? 'en' : 'es';
                const voiceGender = selectedVoice.gender?.toLowerCase();

                Speech.speak(VOICE_PREVIEW_TEXT, {
                    language: language === 'en' ? 'en-US' : 'es-ES',
                    pitch: voiceGender === 'female' ? 1.1 : 0.9,
                    rate: 0.9,
                    onDone: () => setIsPreviewPlaying(false),
                    onError: () => setIsPreviewPlaying(false),
                });
                return;
            } else {
                setIsPreviewPlaying(false);
                Alert.alert(
                    "Vista previa no disponible",
                    "La muestra de voz no está disponible. Podrás escuchar la voz cuando actives tu gemelo digital."
                );
                return;
            }
        }

        try {
            // Stop if already playing
            if (previewSoundRef.current) {
                await previewSoundRef.current.unloadAsync();
                previewSoundRef.current = null;
            }

            if (isPreviewPlaying) {
                setIsPreviewPlaying(false);
                return;
            }

            setIsPreviewPlaying(true);

            const { sound } = await Audio.Sound.createAsync(
                { uri: previewUrl },
                { shouldPlay: true }
            );
            previewSoundRef.current = sound;

            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPreviewPlaying(false);
                }
            });
        } catch (error) {
            console.error("Error playing preview:", error);
            setIsPreviewPlaying(false);
            Alert.alert("Error", "No se pudo reproducir la vista previa");
        }
    }

    function handleBack() {
        router.back();
    }

    function handleSelectPredefined() {
        setVideoType("predefined");
        setShowAvatarModal(true);
    }

    function handleSelectStandardVoice() {
        setVoiceType("standard");
        setShowVoiceModal(true);
    }

    // Handler for "Entrenar con Video" button - opens video upload modal
    function handleSelectTrainedVideo() {
        setVideoType("trained");
        setShowVideoModal(true);
    }

    // Handler for voice cloning - show out of service message
    function handleVoiceCloning() {
        Alert.alert(
            "Función No Disponible",
            "La clonación de voz está temporalmente fuera de servicio. Por favor, utiliza una voz estándar del catálogo.",
            [{ text: "Entendido", style: "default" }]
        );
    }

    // Record video from camera
    async function handleRecordFromCamera() {
        try {
            // Request camera permissions
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            const microphonePermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (cameraPermission.status !== 'granted') {
                Alert.alert(
                    "Permiso Requerido",
                    "Necesitamos acceso a la cámara para grabar tu video de entrenamiento."
                );
                return;
            }

            // Launch camera to record video
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'videos',
                allowsEditing: true,
                quality: 1,
                videoMaxDuration: 300, // 5 minutes max
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const videoAsset = result.assets[0];
            const durationSeconds = (videoAsset.duration || 0) / 1000;

            // Validate minimum duration
            if (durationSeconds < VIDEO_REQUIREMENTS.minDurationSeconds) {
                Alert.alert(
                    "Video Demasiado Corto",
                    `El video debe tener al menos ${VIDEO_REQUIREMENTS.minDurationSeconds / 60} minutos de duración. Tu video tiene ${Math.floor(durationSeconds / 60)} minutos y ${Math.floor(durationSeconds % 60)} segundos.`,
                    [{ text: "Reintentar", onPress: handleRecordFromCamera }]
                );
                return;
            }

            // Start upload process
            await uploadVideoForAvatar(videoAsset.uri);
        } catch (error: any) {
            console.error("Error recording video:", error);
            Alert.alert("Error", error.message || "No se pudo grabar el video");
        }
    }

    // Upload video and create custom avatar
    async function uploadVideoForAvatar(videoUri: string) {
        setUploadingVideo(true);
        setUploadProgress("Subiendo video...");
        setShowVideoModal(false);

        try {
            // Upload the video
            setUploadProgress("Subiendo video a la nube...");
            const videoUrl = await liveAvatarApi.uploadTrainingVideo(videoUri);

            // Create the custom avatar
            setUploadProgress("Creando avatar personalizado...");
            const userName = user?.firstname || "Usuario";
            const avatarResponse = await liveAvatarApi.createCustomAvatar(
                videoUrl,
                `Avatar de ${userName}`
            );

            setCustomAvatarStatus(avatarResponse);
            setUploadProgress("");

            if (avatarResponse.status === 'processing' || avatarResponse.status === 'pending') {
                Alert.alert(
                    "¡Avatar en Proceso!",
                    "Tu avatar personalizado está siendo creado. Este proceso puede tomar unos minutos. Te notificaremos cuando esté listo.\n\nPor ahora, puedes continuar con un avatar predefinido o esperar.",
                    [
                        { text: "Continuar con Predefinido", onPress: () => setShowAvatarModal(true) },
                        { text: "Esperar", style: "cancel" }
                    ]
                );
            } else if (avatarResponse.status === 'ready') {
                // Avatar is ready, update selection
                setSelectedAvatar({
                    id: avatarResponse.id,
                    name: avatarResponse.name || `Avatar Personalizado`,
                    preview_url: avatarResponse.preview_url || "",
                });
                Alert.alert("¡Éxito!", "Tu avatar personalizado ha sido creado correctamente.");
            }
        } catch (error: any) {
            console.error("Error uploading video for avatar:", error);
            Alert.alert(
                "Error al Crear Avatar",
                error.message || "No se pudo crear el avatar. Por favor, inténtalo de nuevo.",
                [{ text: "Reintentar", onPress: () => setShowVideoModal(true) }]
            );
        } finally {
            setUploadingVideo(false);
            setUploadProgress("");
        }
    }

    // Handle Google Drive (coming soon)
    function handleGoogleDrive() {
        Alert.alert(
            "Próximamente",
            "La integración con Google Drive estará disponible pronto.",
            [{ text: "Entendido" }]
        );
    }

    // Handle AWS S3 (coming soon)
    function handleAwsS3() {
        Alert.alert(
            "Próximamente",
            "La integración con AWS S3 estará disponible pronto.",
            [{ text: "Entendido" }]
        );
    }

    function handleAvatarSelect(avatar: PublicAvatar) {
        setSelectedAvatar(avatar);
        setVideoType("predefined"); // Auto-set to predefined when avatar is selected
        // Auto-set voice to standard since predefined avatars come with standard voices
        setVoiceType("standard");
        setShowAvatarModal(false);
    }

    async function handleVoiceSelect(voice: PublicVoice) {
        // Stop any playing audio
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
        setPlayingVoiceId(null);
        setSelectedVoice(voice);
        setVoiceType("standard"); // Auto-set to standard when voice is selected
        setShowVoiceModal(false);
    }

    async function handleContinue() {
        setIsLoading(true);
        try {
            if (token) {
                const updateData: any = {
                    digitalTwin: {
                        appearance: {
                            videoType,
                            videoId: selectedAvatar?.id || null,
                            voiceType,
                            voiceId: selectedVoice?.id || null,
                        }
                    }
                };

                // If a predefined avatar is selected, save its data
                if (selectedAvatar && videoType === "predefined") {
                    updateData.digitalTwin.appearance.liveAvatarId = selectedAvatar.id;
                    updateData.digitalTwin.appearance.liveAvatarName = selectedAvatar.name;
                    updateData.digitalTwin.appearance.liveAvatarPreview = selectedAvatar.preview_url;
                }

                // If a standard voice is selected, save its data
                if (selectedVoice && voiceType === "standard") {
                    updateData.digitalTwin.appearance.liveVoiceId = selectedVoice.id;
                    updateData.digitalTwin.appearance.liveVoiceName = selectedVoice.name;
                    updateData.digitalTwin.appearance.liveVoiceGender = selectedVoice.gender;
                    updateData.digitalTwin.appearance.liveVoiceLanguage = selectedVoice.language;
                }

                await userApi.updateUser(token, updateData);

                if (refreshUser) {
                    await refreshUser();
                }
            }

            router.push("/onboarding/twin-behavior");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar");
        } finally {
            setIsLoading(false);
        }
    }

    function renderAvatarItem({ item }: { item: PublicAvatar }) {
        const isSelected = selectedAvatar?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.avatarItem, isSelected && styles.avatarItemSelected]}
                onPress={() => handleAvatarSelect(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.avatarImageContainer, isSelected && styles.avatarImageContainerSelected]}>
                    {item.preview_url ? (
                        <Image
                            source={{ uri: item.preview_url }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialIcons name="person" size={40} color={COLORS.gray400} />
                        </View>
                    )}
                    {isSelected && (
                        <View style={styles.selectedBadge}>
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        </View>
                    )}
                </View>
                <Text style={[styles.avatarName, isSelected && styles.avatarNameSelected]} numberOfLines={2}>
                    {item.name || "Avatar"}
                </Text>
                {item.gender && (
                    <Text style={styles.avatarGender}>{item.gender}</Text>
                )}
            </TouchableOpacity>
        );
    }

    function renderVoiceItem({ item }: { item: PublicVoice }) {
        const isSelected = selectedVoice?.id === item.id;
        const isPlaying = playingVoiceId === item.id;

        return (
            <TouchableOpacity
                style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                onPress={() => handleVoiceSelect(item)}
                activeOpacity={0.8}
            >
                <View style={styles.voiceItemContent}>
                    <View style={[styles.voiceIcon, isSelected && styles.voiceIconSelected]}>
                        <MaterialIcons
                            name={item.gender?.toLowerCase() === 'female' ? 'person-2' : 'person'}
                            size={24}
                            color={isSelected ? COLORS.primaryDark : COLORS.gray500}
                        />
                    </View>
                    <View style={styles.voiceItemInfo}>
                        <Text style={[styles.voiceItemName, isSelected && styles.voiceItemNameSelected]} numberOfLines={1}>
                            {item.name || "Voz"}
                        </Text>
                        <Text style={styles.voiceItemMeta}>
                            {item.gender || "Neutral"} • {item.language || "ES"}
                        </Text>
                    </View>
                </View>
                <View style={styles.voiceItemActions}>
                    {(item.preview_url || item.sample_url) && (
                        <TouchableOpacity
                            style={[styles.voicePlayButton, isPlaying && styles.voicePlayButtonActive]}
                            onPress={(e) => {
                                e.stopPropagation();
                                playVoicePreview(item);
                            }}
                        >
                            <MaterialIcons
                                name={isPlaying ? "stop" : "play-arrow"}
                                size={20}
                                color={isPlaying ? "#FFFFFF" : COLORS.gray700}
                            />
                        </TouchableOpacity>
                    )}
                    {isSelected && (
                        <View style={styles.voiceSelectedCheck}>
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <Text style={styles.stepText}>PASO 1 DE 3</Text>
                        <View style={styles.stepDots}>
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View style={styles.stepDot} />
                            <View style={styles.stepDot} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelpModal(true)}>
                        <Text style={styles.helpText}>Ayuda</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Apariencia y Voz</Text>
                    <Text style={styles.headerSubtitle}>Configura la presencia de tu Gemelo Digital.</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Preview Card */}
                <View style={styles.previewCard}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.previewImage} />
                    ) : (
                        <View style={[styles.previewImage, styles.previewPlaceholder]}>
                            <MaterialIcons name="person" size={80} color={COLORS.gray400} />
                        </View>
                    )}

                    {/* Preview Badge */}
                    <View style={styles.previewBadge}>
                        <View style={styles.previewDot} />
                        <Text style={styles.previewBadgeText}>VISTA PREVIA</Text>
                    </View>

                    {/* Bottom controls */}
                    <View style={styles.previewBottom}>
                        <TouchableOpacity
                            style={[styles.playButton, isPreviewPlaying && styles.playButtonActive]}
                            onPress={playPreview}
                        >
                            <MaterialIcons
                                name={isPreviewPlaying ? "stop" : "play-arrow"}
                                size={28}
                                color={isPreviewPlaying ? "#FFFFFF" : "#000000"}
                            />
                        </TouchableOpacity>
                        <View style={styles.voiceInfo}>
                            <View style={styles.waveform}>
                                {[2, 4, 3, 5, 3, 2, 2, 2].map((h, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.waveBar,
                                            { height: h * 4, opacity: i < 6 ? 1 : 0.3 + (0.2 * (6 - i)) },
                                            isPreviewPlaying && styles.waveBarActive
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.voiceLabel}>
                                Voz: <Text style={styles.voiceName}>{selectedVoice ? selectedVoice.name : "Elige una voz"}</Text>
                            </Text>
                            {!selectedVoice && (
                                <Text style={styles.voiceHint}>Pulsa "Voz Estándar" para elegir</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Settings Card */}
                <View style={styles.settingsCard}>
                    {/* Appearance Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>APARIENCIA</Text>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedText}>RECOMENDADO</Text>
                            </View>
                        </View>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    videoType === "predefined" && styles.optionCardSelected
                                ]}
                                onPress={handleSelectPredefined}
                            >
                                {videoType === "predefined" && selectedAvatar && (
                                    <View style={styles.activeDot} />
                                )}
                                <View style={[styles.optionIcon, videoType === "predefined" && styles.optionIconSelected]}>
                                    <MaterialIcons name="face" size={18} color={videoType === "predefined" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, videoType === "predefined" && styles.optionTitleSelected]}>Avatar Predefinido</Text>
                                <Text style={styles.optionSubtitle}>
                                    {selectedAvatar ? selectedAvatar.name : "Elegir del catálogo"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    videoType === "trained" && styles.optionCardSelected
                                ]}
                                onPress={handleSelectTrainedVideo}
                            >
                                {videoType === "trained" && <View style={styles.activeDot} />}
                                <View style={[styles.optionIcon, videoType === "trained" && styles.optionIconSelected]}>
                                    <MaterialIcons name="videocam" size={18} color={videoType === "trained" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, videoType === "trained" && styles.optionTitleSelected]}>Entrenar con Video</Text>
                                <Text style={styles.optionSubtitle}>Máxima autenticidad</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Voice Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>VOZ DEL PROFESIONAL</Text>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    voiceType === "standard" && styles.optionCardSelected
                                ]}
                                onPress={handleSelectStandardVoice}
                            >
                                {voiceType === "standard" && selectedVoice && (
                                    <View style={styles.activeDot} />
                                )}
                                <View style={[styles.optionIcon, voiceType === "standard" && styles.optionIconSelected]}>
                                    <MaterialIcons name="graphic-eq" size={18} color={voiceType === "standard" ? COLORS.primaryDark : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, voiceType === "standard" && styles.optionTitleSelected]}>Voz Estándar</Text>
                                <Text style={styles.optionSubtitle}>
                                    {selectedVoice ? selectedVoice.name : "Elegir del catálogo"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    voiceType === "cloned" && styles.optionCardSelectedPurple
                                ]}
                                onPress={handleVoiceCloning}
                            >
                                {voiceType === "cloned" && (
                                    <View style={styles.engagementBadge}>
                                        <Text style={styles.engagementText}>+ Engagement</Text>
                                    </View>
                                )}
                                <View style={[styles.optionIcon, voiceType === "cloned" && styles.optionIconPurple]}>
                                    <MaterialIcons name="mic" size={18} color={voiceType === "cloned" ? COLORS.accentPurple : COLORS.gray500} />
                                </View>
                                <Text style={[styles.optionTitle, voiceType === "cloned" && styles.optionTitleSelected]}>Clonar mi Voz</Text>
                                <Text style={styles.optionSubtitle}>Sube audio 2 min</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Guardar y Continuar</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#000000" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Avatar Catalog Modal */}
            <Modal
                visible={showAvatarModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAvatarModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Catálogo de Avatares</Text>
                                <Text style={styles.modalSubtitle}>Elige la apariencia de tu gemelo digital</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowAvatarModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        {/* Avatar Grid */}
                        {loadingAvatars ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Cargando avatares...</Text>
                            </View>
                        ) : publicAvatars.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="face" size={64} color={COLORS.gray400} />
                                <Text style={styles.emptyText}>No hay avatares disponibles</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={loadPublicAvatars}>
                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={publicAvatars}
                                renderItem={renderAvatarItem}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                contentContainerStyle={styles.avatarGrid}
                                columnWrapperStyle={styles.avatarRow}
                                showsVerticalScrollIndicator={false}
                            />
                        )}

                        {/* Modal Footer */}
                        {selectedAvatar && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => setShowAvatarModal(false)}
                                >
                                    <Text style={styles.confirmButtonText}>Confirmar Selección</Text>
                                    <MaterialIcons name="check" size={20} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Voice Catalog Modal */}
            <Modal
                visible={showVoiceModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowVoiceModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Catálogo de Voces</Text>
                                <Text style={styles.modalSubtitle}>Elige la voz de tu gemelo digital</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowVoiceModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        {/* Voice List */}
                        {loadingVoices ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Cargando voces...</Text>
                            </View>
                        ) : publicVoices.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="mic-off" size={64} color={COLORS.gray400} />
                                <Text style={styles.emptyText}>No hay voces disponibles</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={loadPublicVoices}>
                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={publicVoices}
                                renderItem={renderVoiceItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.voiceList}
                                showsVerticalScrollIndicator={false}
                            />
                        )}

                        {/* Modal Footer */}
                        {selectedVoice && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => setShowVoiceModal(false)}
                                >
                                    <Text style={styles.confirmButtonText}>Confirmar Selección</Text>
                                    <MaterialIcons name="check" size={20} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Video Upload Modal */}
            <Modal
                visible={showVideoModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowVideoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Crear Avatar Personalizado</Text>
                                <Text style={styles.modalSubtitle}>Sube un video para entrenar tu avatar</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowVideoModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        {/* Video Requirements */}
                        <View style={styles.videoRequirements}>
                            <View style={styles.requirementHeader}>
                                <MaterialIcons name="info" size={20} color={COLORS.accentBlue} />
                                <Text style={styles.requirementTitle}>Requisitos del Video</Text>
                            </View>
                            <Text style={styles.requirementDuration}>⏱️ Duración mínima: 2 minutos</Text>
                            <View style={styles.requirementList}>
                                <Text style={styles.requirementItem}>• 15 segundos en estado de escucha</Text>
                                <Text style={styles.requirementItem}>• 90 segundos hablando naturalmente</Text>
                                <Text style={styles.requirementItem}>• 90 segundos hablando naturalmente</Text>
                                <Text style={styles.requirementItem}>• 15 segundos en espera activa</Text>
                            </View>
                            <View style={styles.tipBox}>
                                <MaterialIcons name="lightbulb" size={16} color={COLORS.primaryDark} />
                                <Text style={styles.tipText}>Habla con posturas naturales, gestos suaves y ritmo pausado.</Text>
                            </View>
                        </View>

                        {/* Upload Options */}
                        <View style={styles.uploadOptions}>
                            <Text style={styles.uploadOptionsTitle}>Selecciona una opción:</Text>

                            {/* Camera Option */}
                            <TouchableOpacity
                                style={styles.uploadOption}
                                onPress={handleRecordFromCamera}
                            >
                                <View style={[styles.uploadOptionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <MaterialIcons name="videocam" size={28} color={COLORS.accentBlue} />
                                </View>
                                <View style={styles.uploadOptionContent}>
                                    <Text style={styles.uploadOptionTitle}>Grabar Video</Text>
                                    <Text style={styles.uploadOptionSubtitle}>Usa la cámara de tu dispositivo</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color={COLORS.gray400} />
                            </TouchableOpacity>

                            {/* Google Drive Option */}
                            <TouchableOpacity
                                style={[styles.uploadOption, styles.uploadOptionDisabled]}
                                onPress={handleGoogleDrive}
                            >
                                <View style={[styles.uploadOptionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <MaterialIcons name="cloud" size={28} color={COLORS.accentGreen} />
                                </View>
                                <View style={styles.uploadOptionContent}>
                                    <Text style={styles.uploadOptionTitle}>Google Drive</Text>
                                    <Text style={styles.uploadOptionSubtitle}>Próximamente</Text>
                                </View>
                                <View style={styles.comingSoonBadge}>
                                    <Text style={styles.comingSoonText}>PRONTO</Text>
                                </View>
                            </TouchableOpacity>

                            {/* AWS S3 Option */}
                            <TouchableOpacity
                                style={[styles.uploadOption, styles.uploadOptionDisabled]}
                                onPress={handleAwsS3}
                            >
                                <View style={[styles.uploadOptionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                    <MaterialIcons name="storage" size={28} color={COLORS.accentPurple} />
                                </View>
                                <View style={styles.uploadOptionContent}>
                                    <Text style={styles.uploadOptionTitle}>AWS S3</Text>
                                    <Text style={styles.uploadOptionSubtitle}>Próximamente</Text>
                                </View>
                                <View style={styles.comingSoonBadge}>
                                    <Text style={styles.comingSoonText}>PRONTO</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Help Modal */}
            <Modal
                visible={showHelpModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Ayuda</Text>
                                <Text style={styles.modalSubtitle}>Cómo configurar tu Gemelo Digital</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowHelpModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color={COLORS.gray500} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            {/* Apariencia Section */}
                            <View style={styles.helpSection}>
                                <View style={styles.helpSectionHeader}>
                                    <MaterialIcons name="face" size={24} color={COLORS.accentBlue} />
                                    <Text style={styles.helpSectionTitle}>Apariencia del Avatar</Text>
                                </View>
                                <Text style={styles.helpModalText}>
                                    Elige cómo se verá tu gemelo digital cuando hable con tus clientes:
                                </Text>
                                <View style={styles.helpBullet}>
                                    <MaterialIcons name="check-circle" size={16} color={COLORS.accentGreen} />
                                    <Text style={styles.helpBulletText}>
                                        <Text style={{ fontWeight: '700' }}>Avatar Predefinido:</Text> Selecciona uno de nuestros avatares profesionales del catálogo. Recomendado para comenzar rápidamente.
                                    </Text>
                                </View>
                                <View style={styles.helpBullet}>
                                    <MaterialIcons name="check-circle" size={16} color={COLORS.accentGreen} />
                                    <Text style={styles.helpBulletText}>
                                        <Text style={{ fontWeight: '700' }}>Entrenar con Video:</Text> Sube un video de ti mismo de al menos 2 minutos para crear un avatar personalizado que se parezca a ti.
                                    </Text>
                                </View>
                            </View>

                            {/* Voz Section */}
                            <View style={styles.helpSection}>
                                <View style={styles.helpSectionHeader}>
                                    <MaterialIcons name="graphic-eq" size={24} color={COLORS.accentPurple} />
                                    <Text style={styles.helpSectionTitle}>Voz del Profesional</Text>
                                </View>
                                <Text style={styles.helpModalText}>
                                    Define cómo sonará tu gemelo digital:
                                </Text>
                                <View style={styles.helpBullet}>
                                    <MaterialIcons name="check-circle" size={16} color={COLORS.accentGreen} />
                                    <Text style={styles.helpBulletText}>
                                        <Text style={{ fontWeight: '700' }}>Voz Estándar:</Text> Elige una voz profesional de nuestro catálogo. Hay opciones masculinas y femeninas en varios idiomas.
                                    </Text>
                                </View>
                                <View style={styles.helpBullet}>
                                    <MaterialIcons name="info" size={16} color={COLORS.gray400} />
                                    <Text style={styles.helpBulletText}>
                                        <Text style={{ fontWeight: '700' }}>Clonar mi Voz:</Text> Función próximamente disponible para crear una voz idéntica a la tuya.
                                    </Text>
                                </View>
                            </View>

                            {/* Tips Section */}
                            <View style={[styles.helpSection, { backgroundColor: COLORS.primary + '20', borderRadius: 12, padding: 16 }]}>
                                <View style={styles.helpSectionHeader}>
                                    <MaterialIcons name="lightbulb" size={24} color={COLORS.primaryDark} />
                                    <Text style={[styles.helpSectionTitle, { color: COLORS.primaryDark }]}>Consejos</Text>
                                </View>
                                <Text style={styles.helpModalText}>
                                    • Los avatares predefinidos funcionan perfecto con voces estándar.{'\n'}
                                    • Puedes cambiar la configuración en cualquier momento.{'\n'}
                                    • Prueba el botón de play para escuchar la voz seleccionada.
                                </Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.continueButton, { marginTop: 16 }]}
                            onPress={() => setShowHelpModal(false)}
                        >
                            <Text style={styles.continueButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Upload Progress Overlay */}
            {uploadingVideo && (
                <View style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
                        <Text style={styles.uploadHintText}>Por favor, no cierres la aplicación</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        backgroundColor: COLORS.headerStart,
        paddingTop: 48,
        paddingBottom: 48,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepIndicator: {
        alignItems: "center",
    },
    stepText: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(147, 197, 253, 0.8)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    stepDots: {
        flexDirection: "row",
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(30, 58, 138, 0.5)",
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
        borderRadius: 4,
    },
    helpButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    helpText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.primary,
    },
    headerContent: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(147, 197, 253, 0.8)",
    },
    scrollView: {
        flex: 1,
        marginTop: -16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    // Preview Card
    previewCard: {
        backgroundColor: COLORS.gray900,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 4,
        borderColor: "#FFFFFF",
        aspectRatio: 4 / 3,
        position: "relative",
        marginBottom: 24,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    previewPlaceholder: {
        backgroundColor: COLORS.gray800,
        alignItems: "center",
        justifyContent: "center",
    },
    previewBadge: {
        position: "absolute",
        top: 16,
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6,
    },
    previewDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accentGreen,
    },
    previewBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    selectedAvatarBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(253, 224, 71, 0.9)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6,
    },
    selectedAvatarText: {
        fontSize: 11,
        fontWeight: "bold",
        color: COLORS.gray900,
    },
    previewBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingTop: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: "transparent",
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    voiceInfo: {
        flex: 1,
    },
    waveform: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 24,
        gap: 3,
        marginBottom: 4,
    },
    waveBar: {
        width: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    voiceLabel: {
        fontSize: 11,
        color: COLORS.gray400,
    },
    voiceName: {
        color: "#FFFFFF",
    },
    // Settings Card
    settingsCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    recommendedBadge: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    recommendedText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.accentGreen,
    },
    optionsGrid: {
        flexDirection: "row",
        gap: 12,
    },
    optionCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        position: "relative",
    },
    optionCardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: "rgba(253, 224, 71, 0.05)",
    },
    optionCardSelectedPurple: {
        borderWidth: 2,
        borderColor: COLORS.accentPurple,
        backgroundColor: "rgba(99, 102, 241, 0.05)",
    },
    activeDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    engagementBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    engagementText: {
        fontSize: 8,
        fontWeight: "bold",
        color: COLORS.accentPurple,
    },
    optionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    optionIconSelected: {
        backgroundColor: "rgba(253, 224, 71, 0.2)",
    },
    optionIconPurple: {
        backgroundColor: "rgba(99, 102, 241, 0.2)",
    },
    optionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray700,
        marginBottom: 2,
    },
    optionTitleSelected: {
        fontWeight: "bold",
        color: COLORS.gray900,
    },
    optionSubtitle: {
        fontSize: 10,
        color: COLORS.gray400,
    },
    // Footer
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 24,
        backgroundColor: "transparent",
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
    // Modal styles
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
        minHeight: "60%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textMain,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000000",
    },
    avatarGrid: {
        padding: 16,
    },
    avatarRow: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    avatarItem: {
        width: (SCREEN_WIDTH - 48) / 2 - 8,
        backgroundColor: COLORS.gray50,
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    avatarItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(253, 224, 71, 0.1)",
    },
    avatarImageContainer: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        position: "relative",
    },
    avatarImageContainerSelected: {
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    selectedBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.accentGreen,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarName: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textMain,
        textAlign: "center",
        marginBottom: 4,
    },
    avatarNameSelected: {
        color: COLORS.primaryDark,
        fontWeight: "bold",
    },
    avatarGender: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
    confirmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
    // Voice list styles
    voiceList: {
        padding: 16,
    },
    voiceItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "transparent",
    },
    voiceItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "rgba(253, 224, 71, 0.1)",
    },
    voiceItemContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    voiceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    voiceIconSelected: {
        backgroundColor: "rgba(253, 224, 71, 0.3)",
    },
    voiceItemInfo: {
        flex: 1,
    },
    voiceItemName: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 4,
    },
    voiceItemNameSelected: {
        color: COLORS.primaryDark,
        fontWeight: "bold",
    },
    voiceItemMeta: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    voiceItemActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    voicePlayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        alignItems: "center",
        justifyContent: "center",
    },
    voicePlayButtonActive: {
        backgroundColor: COLORS.accentPurple,
    },
    voiceSelectedCheck: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.accentGreen,
        alignItems: "center",
        justifyContent: "center",
    },
    playButtonActive: {
        backgroundColor: COLORS.accentPurple,
    },
    waveBarActive: {
        backgroundColor: COLORS.accentPurple,
    },
    voiceHint: {
        fontSize: 10,
        color: COLORS.gray400,
        marginTop: 2,
    },
    // Video Upload Modal Styles
    videoRequirements: {
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.1)",
    },
    requirementHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    requirementTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.accentBlue,
    },
    requirementDuration: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.gray900,
        marginBottom: 12,
    },
    requirementList: {
        marginBottom: 12,
    },
    requirementItem: {
        fontSize: 13,
        color: COLORS.gray700,
        marginBottom: 4,
        paddingLeft: 8,
    },
    tipBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "rgba(253, 224, 71, 0.15)",
        padding: 12,
        borderRadius: 8,
    },
    tipText: {
        fontSize: 12,
        color: COLORS.gray700,
        flex: 1,
        lineHeight: 18,
    },
    uploadOptions: {
        gap: 12,
    },
    uploadOptionsTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.gray500,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    uploadOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    uploadOptionDisabled: {
        opacity: 0.6,
    },
    uploadOptionIcon: {
        width: 52,
        height: 52,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    uploadOptionContent: {
        flex: 1,
    },
    uploadOptionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.gray900,
        marginBottom: 2,
    },
    uploadOptionSubtitle: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    comingSoonBadge: {
        backgroundColor: "rgba(234, 179, 8, 0.15)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    comingSoonText: {
        fontSize: 9,
        fontWeight: "bold",
        color: COLORS.primaryDark,
    },
    uploadOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    uploadCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        minWidth: 260,
    },
    uploadProgressText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.gray900,
        marginTop: 16,
        textAlign: "center",
    },
    uploadHintText: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 8,
        textAlign: "center",
    },
    // Help modal styles
    helpSection: {
        marginBottom: 20,
    },
    helpSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    helpSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.gray900,
    },
    helpModalText: {
        fontSize: 14,
        color: COLORS.gray700,
        lineHeight: 22,
        marginBottom: 10,
    },
    helpBullet: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginVertical: 6,
        paddingRight: 8,
    },
    helpBulletText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.gray700,
        lineHeight: 20,
    },
});

