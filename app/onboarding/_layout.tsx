import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="language" />
            <Stack.Screen name="profile-type" />
            <Stack.Screen name="register-user" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="complete-profile" />
            <Stack.Screen name="success" />
        </Stack>
    );
}
