import { registerGlobals } from "@livekit/react-native";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context";

// Initialize LiveKit WebRTC globals
registerGlobals();
function RootLayoutNav() {
  const { token, loading } = useAuth();
  const segments = useSegments();

  // Mientras se carga el token → pantalla estable
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#6A4DFD" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inOnboardingGroup = segments[0] === 'onboarding';
  const isDeleteAccountSuccess = segments[0] === 'delete-account-success';

  // Si no hay token y NO estamos ya en el grupo de autenticación, onboarding, o pantalla de éxito de eliminación → redirige al login
  if (!token && !inAuthGroup && !inOnboardingGroup && !isDeleteAccountSuccess) {
    return <Redirect href="/(auth)/login" />;
  }

  // Si hay token → entra a la app
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(settings)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="avatar-chat" />
        <Stack.Screen name="professional" />
        <Stack.Screen name="delete-account-success" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

