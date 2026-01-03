import { Stack } from "expo-router";

export default function IncomingCallLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "fade",
            }}
        />
    );
}
