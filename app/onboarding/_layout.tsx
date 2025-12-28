import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="language" />
            <Stack.Screen name="profile-type" />
            <Stack.Screen name="register-user" />
            <Stack.Screen name="register-pro" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="complete-profile" />
            <Stack.Screen name="success" />
            {/* Professional onboarding screens */}
            <Stack.Screen name="pro-profile" />
            <Stack.Screen name="pro-contact" />
            <Stack.Screen name="pro-complete" />
            <Stack.Screen name="twin-appearance" />
            <Stack.Screen name="twin-behavior" />
            <Stack.Screen name="twin-knowledge" />
            <Stack.Screen name="pro-success" />
        </Stack>
    );
}
