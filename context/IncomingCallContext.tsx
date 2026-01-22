import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { router } from "expo-router";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { SOCKET_URL } from "../api/config";

interface IncomingCallData {
    chatId: string;
    callerName: string;
    callerAvatar: string | null;
    callerId: string;
    roomName: string;
}

interface NewMessageData {
    chatId: string;
    message: {
        _id: string;
        chat: string;
        user: string;
        message: string;
        type: string;
        isFromBot: boolean;
        isFromProfessional: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

type MessageCallback = (data: NewMessageData) => void;

interface IncomingCallContextType {
    incomingCall: IncomingCallData | null;
    isConnected: boolean;
    dismissCall: () => void;
    subscribeToMessages: (chatId: string, callback: MessageCallback) => () => void;
}

const IncomingCallContext = createContext<IncomingCallContextType>({
    incomingCall: null,
    isConnected: false,
    dismissCall: () => { },
    subscribeToMessages: () => () => { },
});

export function useIncomingCall() {
    return useContext(IncomingCallContext);
}

export function IncomingCallProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Connect to socket server
    useEffect(() => {
        if (!user?._id || !token) {
            // Disconnect if no user
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        console.log("[IncomingCall] Connecting to socket:", SOCKET_URL);

        // In production (Railway), WebSocket works fine
        // In development (Windows), use polling to avoid firewall issues
        const transportOptions = __DEV__ ? ["polling"] : ["websocket", "polling"];

        const socket = io(SOCKET_URL, {
            transports: transportOptions,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        socket.on("connect", () => {
            console.log("[IncomingCall] Socket connected:", socket.id);
            setIsConnected(true);
            // Register user with socket server
            socket.emit("register", user._id);
        });

        socket.on("disconnect", () => {
            console.log("[IncomingCall] Socket disconnected");
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("[IncomingCall] Socket connection error:", error.message);
            console.error("[IncomingCall] Error details:", JSON.stringify(error, null, 2));
        });

        socket.on("error", (error) => {
            console.error("[IncomingCall] Socket error event:", error);
        });

        // Listen for incoming calls
        socket.on("incoming-call", (data: IncomingCallData) => {
            console.log("[IncomingCall] Incoming call received:", data);
            setIncomingCall(data);

            // Auto-navigate to incoming call screen
            router.push({
                pathname: `/incoming-call/${data.chatId}`,
                params: {
                    callerName: data.callerName,
                    callerAvatar: data.callerAvatar || "",
                    callerId: data.callerId,
                },
            } as any);

            // Set timeout to dismiss call after 30 seconds
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                console.log("[IncomingCall] Call timed out");
                setIncomingCall(null);
            }, 30000);
        });

        // Listen for call rejection
        socket.on("call-rejected", (data: { chatId: string }) => {
            console.log("[IncomingCall] Call rejected:", data);
            setIncomingCall(null);
        });

        // Listen for call acceptance
        socket.on("call-accepted", (data: { chatId: string }) => {
            console.log("[IncomingCall] Call accepted:", data);
        });

        // Listen for new chat messages
        socket.on("new-message", (data: NewMessageData) => {
            console.log("[Socket] New message received:", data.chatId);
            // Notify all registered callbacks for this chat
            const callbacks = messageCallbacksRef.current.get(data.chatId);
            if (callbacks) {
                callbacks.forEach(callback => callback(data));
            }
        });

        socketRef.current = socket;

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [user?._id, token]);

    const dismissCall = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIncomingCall(null);
    }, []);

    // Subscribe to messages for a specific chat
    const messageCallbacksRef = useRef<Map<string, Set<MessageCallback>>>(new Map());

    const subscribeToMessages = useCallback((chatId: string, callback: MessageCallback) => {
        if (!messageCallbacksRef.current.has(chatId)) {
            messageCallbacksRef.current.set(chatId, new Set());
        }
        messageCallbacksRef.current.get(chatId)!.add(callback);
        console.log("[Socket] Subscribed to messages for chat:", chatId);

        // Return unsubscribe function
        return () => {
            const callbacks = messageCallbacksRef.current.get(chatId);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    messageCallbacksRef.current.delete(chatId);
                }
            }
            console.log("[Socket] Unsubscribed from messages for chat:", chatId);
        };
    }, []);

    return (
        <IncomingCallContext.Provider value={{ incomingCall, isConnected, dismissCall, subscribeToMessages }}>
            {children}
        </IncomingCallContext.Provider>
    );
}
