import { useState, useCallback } from "react";

// Safe import — expo-speech-recognition requires a native dev build.
// In Expo Go the native module is not available, so we guard the import.
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (_event: string, _cb: any) => {};

try {
    const speechModule = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
} catch {
    console.warn("[VoiceSearch] expo-speech-recognition not available — voice search disabled");
}

interface UseVoiceSearchOptions {
    language?: string;
    onResult?: (text: string) => void;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
    const { language = "es-ES", onResult } = options;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const isAvailable = !!ExpoSpeechRecognitionModule;

    useSpeechRecognitionEvent("start", () => {
        setIsListening(true);
    });

    useSpeechRecognitionEvent("end", () => {
        setIsListening(false);
    });

    useSpeechRecognitionEvent("result", (event: any) => {
        const text = event.results[0]?.transcript || "";
        setTranscript(text);
        if (event.isFinal && text.trim()) {
            onResult?.(text.trim());
        }
    });

    useSpeechRecognitionEvent("error", (event: any) => {
        console.log("[VoiceSearch] Error:", event.error, event.message);
        setIsListening(false);
    });

    const startListening = useCallback(async () => {
        if (!ExpoSpeechRecognitionModule) {
            console.warn("[VoiceSearch] Native module not available (requires dev build)");
            return;
        }
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
            console.log("[VoiceSearch] Permission not granted");
            return;
        }

        ExpoSpeechRecognitionModule.start({
            lang: language,
            interimResults: true,
            maxAlternatives: 1,
        });
    }, [language]);

    const stopListening = useCallback(() => {
        if (!ExpoSpeechRecognitionModule) return;
        ExpoSpeechRecognitionModule.stop();
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isAvailable,
        isListening,
        transcript,
        startListening,
        stopListening,
        toggleListening,
    };
}
