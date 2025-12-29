import { registerGlobals } from "@livekit/react-native";
import { Redirect, Stack, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "../api/config";

// Initialize LiveKit WebRTC globals
registerGlobals();

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications
async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    console.log('[Notifications] Push token:', pushTokenData.data);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#137fec',
      });
    }

    return pushTokenData.data;
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return null;
  }
}

// Register token with backend
async function registerPushTokenWithServer(authToken: string, pushToken: string) {
  try {
    await fetch(`${API_URL}/user/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken }),
    });
    console.log('[Notifications] Token registered with server');
  } catch (error) {
    console.error('[Notifications] Failed to register token:', error);
  }
}

function RootLayoutNav() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!token) return;

    const setupNotifications = async () => {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerPushTokenWithServer(token, pushToken);
      }
    };

    setupNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Notification] Received:", notification.request.content);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[Notification] Tapped:", data);

      // Navigate based on notification type
      if (data.type === "appointment" && data.appointmentId) {
        router.push(`/appointment-details/${data.appointmentId}` as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [token]);

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
        <Stack.Screen name="avatar-chat/[professionalId]" />
        <Stack.Screen name="professional/[professionalId]" />
        <Stack.Screen name="book-appointment/[professionalId]" />
        <Stack.Screen name="appointment-details/[appointmentId]" />
        <Stack.Screen name="payment-success" />
        <Stack.Screen name="payment-cancelled" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="reviews/[professionalId]" />
        <Stack.Screen name="write-review/[professionalId]" />
        <Stack.Screen name="review-success/[professionalId]" />
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

