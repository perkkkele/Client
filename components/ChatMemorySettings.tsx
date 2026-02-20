import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as chatApi from '../api/chat';
import { useAlert } from './TwinProAlert';

interface ChatMemorySettingsProps {
    chatId: string | null;
    professionalName?: string;
    onClose?: () => void;
}

const COLORS = {
    primary: '#f9f506',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    gray300: '#D1D5DB',
    danger: '#EF4444',
};

/**
 * ChatMemorySettings - RAG Fase 2 (Compact Version)
 * 
 * Componente compacto para controlar memoria conversacional en drawer.
 */
export default function ChatMemorySettings({ chatId, professionalName, onClose }: ChatMemorySettingsProps) {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const [memoryEnabled, setMemoryEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadMemoryStatus();
    }, [chatId, token]);

    const loadMemoryStatus = async () => {
        if (!chatId || !token) {
            setIsLoading(false);
            return;
        }
        try {
            const status = await chatApi.getMemoryStatus(token, chatId);
            setMemoryEnabled(status.clientMemoryEnabled);
        } catch (error) {
            console.error('[ChatMemorySettings] Error loading status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleMemory = async (value: boolean) => {
        if (!chatId || !token) return;
        try {
            setMemoryEnabled(value);
            await chatApi.toggleMemory(token, chatId, value);
        } catch (error) {
            setMemoryEnabled(!value);
            showAlert({ type: 'error', title: 'Error de configuración', message: 'No se pudo actualizar la memoria del gemelo. Inténtalo de nuevo.' });
        }
    };

    const handleForgetMe = () => {
        showAlert({
            type: 'warning',
            title: 'Eliminar memoria',
            message: `¿Eliminar lo que el gemelo ha aprendido de tus conversaciones con ${professionalName || 'este profesional'}?`,
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: confirmForgetMe },
            ]
        });
    };

    const confirmForgetMe = async () => {
        if (!chatId || !token) return;
        setIsDeleting(true);
        try {
            await chatApi.forgetMe(token, chatId);
            showAlert({ type: 'success', title: '¡Listo!', message: 'La memoria del gemelo sobre tus conversaciones ha sido eliminada.' });
        } catch (error) {
            showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar la memoria. Inténtalo de nuevo más tarde.' });
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.row}>
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Memory Toggle - Single compact row */}
            <View style={styles.row}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="psychology" size={18} color={COLORS.textSecondary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Memoria del gemelo</Text>
                </View>
                <Switch
                    value={memoryEnabled}
                    onValueChange={handleToggleMemory}
                    trackColor={{ false: '#D1D5DB', true: '#FDE047' }}
                    thumbColor={memoryEnabled ? COLORS.primary : '#f4f3f4'}
                    style={styles.switch}
                />
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleForgetMe}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator size="small" color={COLORS.danger} />
                    ) : (
                        <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    switch: {
        transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
        marginRight: 8,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
