/**
 * AddressAutocomplete Component
 * Real-time address suggestions using Google Places Autocomplete API
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as placesApi from '../api/placesAutocomplete';
import { useTranslation } from 'react-i18next';

interface AddressAutocompleteProps {
    value: string;
    onAddressSelect: (address: {
        formattedAddress: string;
        city: string | null;
        lat: number;
        lng: number;
    }) => void;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    style?: any;
    inputStyle?: any;
}

const COLORS = {
    primary: '#f9f506',
    textMain: '#0f172a',
    textMuted: '#64748B',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray400: '#9CA3AF',
    gray600: '#4B5563',
    white: '#FFFFFF',
    blue600: '#2563EB',
};

export default function AddressAutocomplete({
    value,
    onAddressSelect,
    onChangeText,
    placeholder = 'Escribe una dirección...',
    style,
    inputStyle,
}: AddressAutocompleteProps) {
    const { t } = useTranslation('settings');
    const resolvedPlaceholder = placeholder === 'Escribe una dirección...' ? t('addressAutocomplete.placeholder') : placeholder;
    const [inputValue, setInputValue] = useState(value);
    const [predictions, setPredictions] = useState<placesApi.PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

    const sessionTokenRef = useRef<string>(placesApi.generateSessionToken());
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update input when external value changes
    useEffect(() => {
        if (value !== inputValue && value !== selectedAddress) {
            setInputValue(value);
        }
    }, [value]);

    // Debounced search
    const searchPlaces = useCallback(async (query: string) => {
        if (query.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);
        const results = await placesApi.getPlacePredictions(
            query,
            sessionTokenRef.current
        );
        setPredictions(results);
        setShowDropdown(results.length > 0);
        setIsLoading(false);
    }, []);

    const handleTextChange = (text: string) => {
        setInputValue(text);
        setSelectedAddress(null);
        onChangeText?.(text);

        // Debounce the API call
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            searchPlaces(text);
        }, 300); // 300ms debounce
    };

    const handleSelectPrediction = async (prediction: placesApi.PlacePrediction) => {
        setIsLoading(true);
        setShowDropdown(false);
        Keyboard.dismiss();

        console.log('Fetching details for placeId:', prediction.placeId);

        const details = await placesApi.getPlaceDetails(
            prediction.placeId,
            sessionTokenRef.current
        );

        console.log('Place details received:', details);

        if (details) {
            console.log('Setting address with coordinates:', {
                address: details.formattedAddress,
                city: details.city,
                lat: details.lat,
                lng: details.lng,
            });

            setInputValue(details.formattedAddress);
            setSelectedAddress(details.formattedAddress);
            onAddressSelect({
                formattedAddress: details.formattedAddress,
                city: details.city,
                lat: details.lat,
                lng: details.lng,
            });

            // Generate new session token for next search
            sessionTokenRef.current = placesApi.generateSessionToken();
        } else {
            console.error('No details received for placeId:', prediction.placeId);
        }

        setIsLoading(false);
    };

    const handleClear = () => {
        setInputValue('');
        setSelectedAddress(null);
        setPredictions([]);
        setShowDropdown(false);
        onChangeText?.('');
    };

    const handleFocus = () => {
        if (predictions.length > 0 && !selectedAddress) {
            setShowDropdown(true);
        }
    };

    const handleBlur = () => {
        // Increased delay to ensure touch events on predictions register first
        setTimeout(() => {
            // Only hide if not loading (which means a selection is not in progress)
            if (!isLoading) {
                setShowDropdown(false);
            }
        }, 400);
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, inputStyle]}
                    value={inputValue}
                    onChangeText={handleTextChange}
                    onFocus={handleFocus}
                    placeholder={resolvedPlaceholder}
                    placeholderTextColor={COLORS.gray400}
                />
                {isLoading ? (
                    <ActivityIndicator
                        size="small"
                        color={COLORS.blue600}
                        style={styles.iconRight}
                    />
                ) : inputValue ? (
                    <TouchableOpacity onPress={handleClear} style={styles.iconRight}>
                        <MaterialIcons name="close" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                ) : (
                    <MaterialIcons
                        name="search"
                        size={20}
                        color={COLORS.gray400}
                        style={styles.iconRight}
                    />
                )}
            </View>

            {/* Validation indicator */}
            {selectedAddress && (
                <View style={styles.validatedBadge}>
                    <MaterialIcons name="check-circle" size={14} color="#16a34a" />
                    <Text style={styles.validatedText}>{t('addressAutocomplete.validated')}</Text>
                </View>
            )}

            {/* Dropdown with predictions */}
            {showDropdown && predictions.length > 0 && (
                <View style={styles.dropdown}>
                    <View style={{ maxHeight: 200 }}>
                        {predictions.map((item) => (
                            <Pressable
                                key={item.placeId}
                                style={({ pressed }) => [
                                    styles.predictionItem,
                                    pressed && { backgroundColor: COLORS.gray100 }
                                ]}
                                onPress={() => {
                                    console.log('Prediction PRESSED:', item.mainText);
                                    handleSelectPrediction(item);
                                }}
                            >
                                <MaterialIcons
                                    name="location-on"
                                    size={20}
                                    color={COLORS.gray400}
                                />
                                <View style={styles.predictionText}>
                                    <Text style={styles.predictionMain} numberOfLines={1}>
                                        {item.mainText}
                                    </Text>
                                    <Text style={styles.predictionSecondary} numberOfLines={1}>
                                        {item.secondaryText}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.poweredBy}>
                        <Text style={styles.poweredByText}>powered by Google</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textMain,
    },
    iconRight: {
        padding: 4,
    },
    validatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    validatedText: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '500',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginTop: 4,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    predictionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    predictionText: {
        flex: 1,
    },
    predictionMain: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textMain,
    },
    predictionSecondary: {
        fontSize: 12,
        color: COLORS.gray600,
        marginTop: 2,
    },
    poweredBy: {
        padding: 8,
        alignItems: 'flex-end',
    },
    poweredByText: {
        fontSize: 10,
        color: COLORS.gray400,
    },
});
