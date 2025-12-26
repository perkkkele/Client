import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
    primary: "#f9f506",
    backgroundLight: "#f8f8f5",
    surfaceLight: "#ffffff",
    textMain: "#181811",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    blue500: "#3B82F6",
};

interface License {
    name: string;
    licenseType: string;
    copyright: string;
    text: string;
}

const LICENSES: License[] = [
    {
        name: "Tailwind CSS",
        licenseType: "MIT License",
        copyright: "Copyright (c) Tailwind Labs, Inc.",
        text: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.",
    },
    {
        name: "Google Fonts",
        licenseType: "SIL Open Font License 1.1",
        copyright: "Copyright (c) 2023 The Spline Sans Project Authors",
        text: "PREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.\n\nPERMISSION & CONDITIONS\nPermission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software...",
    },
    {
        name: "Material Symbols",
        licenseType: "Apache License 2.0",
        copyright: "Copyright 2023 Google LLC",
        text: "Licensed under the Apache License, Version 2.0 (the \"License\"); you may not use this file except in compliance with the License. You may obtain a copy of the License at\n\nhttp://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software distributed under the License is distributed on an \"AS IS\" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
    },
];

export default function OpenSourceLicensesScreen() {
    function handleBack() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Licencias de Código Abierto</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro */}
                <Text style={styles.introText}>
                    TwinPro utiliza software de código abierto para ofrecer la mejor experiencia posible. Agradecemos a los autores y contribuidores de las siguientes bibliotecas y herramientas.
                </Text>

                {/* Licenses */}
                <View style={styles.licensesContainer}>
                    {LICENSES.map((license, index) => (
                        <View key={index} style={styles.licenseSection}>
                            <Text style={styles.licenseName}>{license.name}</Text>
                            <View style={styles.licenseCard}>
                                <Text style={styles.licenseType}>{license.licenseType}</Text>
                                <Text style={styles.licenseCopyright}>{license.copyright}</Text>
                                <Text style={styles.licenseText}>{license.text}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footerText}>
                    Todas las marcas comerciales son propiedad de sus respectivos dueños.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        textAlign: "center",
        marginHorizontal: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 48,
    },
    // Intro
    introText: {
        fontSize: 14,
        color: COLORS.gray500,
        lineHeight: 22,
        marginBottom: 24,
    },
    // Licenses
    licensesContainer: {
        gap: 24,
    },
    licenseSection: {
        gap: 8,
    },
    licenseName: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.textMain,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 4,
    },
    licenseCard: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    licenseType: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.gray600,
        marginBottom: 4,
        fontFamily: "monospace",
    },
    licenseCopyright: {
        fontSize: 11,
        color: COLORS.gray600,
        marginBottom: 12,
        fontFamily: "monospace",
    },
    licenseText: {
        fontSize: 11,
        color: COLORS.gray600,
        lineHeight: 18,
        fontFamily: "monospace",
    },
    // Footer
    footerText: {
        fontSize: 12,
        color: COLORS.gray400,
        textAlign: "center",
        marginTop: 32,
    },
});
