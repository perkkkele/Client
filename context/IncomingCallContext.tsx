import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { router } from "expo-router";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_HOST, API_PORT } from "../api/config";

interface IncomingCallData {
    chatId: string;
    callerName: string;
    callerAvatar: string | null;
    callerId: string;
    roomName: string;
}

interface IncomingCallContextType {
    incomingCall: IncomingCallData | null;
    isConnected: boolean;
    dismissCall: () => void;
}

const IncomingCallContext = createContext<IncomingCallContextType>({
    incomingCall: null,
    isConnected: false,
    dismissCall: () => { },
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

        const socketUrl = `http://${API_HOST}:${API_PORT}`;
        console.log("[IncomingCall] Connecting to socket:", socketUrl);

        const socket = io(socketUrl, {
            transports: ["websocket"],
            autoConnect: true,
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

    return (
        <IncomingCallContext.Provider value={{ incomingCall, isConnected, dismissCall }}>
            {children}
        </IncomingCallContext.Provider>
    );
}
