import { registerGlobals } from "@livekit/react-native";
import { Redirect, Slot, useSegments } from "expo-router";
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
      <Slot />
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
