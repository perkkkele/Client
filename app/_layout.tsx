import { registerGlobals } from "@livekit/react-native";
import { Redirect, Stack, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View, Linking } from "react-native";
import { AuthProvider, useAuth, IncomingCallProvider } from "../context";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "../api/config";
import { usernameApi } from "../api";

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

  // Handle notification navigation based on type
  const handleNotificationNavigation = (data: any) => {
    console.log("[Notification] Processing navigation for:", data);

    if (!data) return;

    if (data.type === "appointment" && data.appointmentId) {
      router.push(`/appointment-details/${data.appointmentId}` as any);
    } else if (data.type === "video_call" && data.chatId) {
      router.push({
        pathname: `/incoming-call/${data.chatId}`,
        params: {
          callerName: data.callerName || "Profesional",
          callerAvatar: data.callerAvatar || "",
        },
      } as any);
    } else if (data.type === "escalation" && data.chatId) {
      console.log("[Notification] Navigating to Atención directa:", data.chatId);
      router.push("/(settings)/pro-chats" as any);
    } else if (data.type === "direct_attention" && data.chatId) {
      console.log("[Notification] Navigating to Atención directa:", data.chatId);
      router.push("/(settings)/pro-chats" as any);
    }
  };

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!token) return;

    const setupNotifications = async () => {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerPushTokenWithServer(token, pushToken);
      }

      // Check if the app was opened by a notification (from closed/background state)
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        console.log("[Notification] App opened by notification:", lastNotificationResponse);
        const data = lastNotificationResponse.notification.request.content.data;
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          handleNotificationNavigation(data);
        }, 500);
      }
    };

    setupNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Notification] Received:", notification.request.content);
    });

    // Listen for notification taps (while app is running)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[Notification] Tapped:", data);
      handleNotificationNavigation(data);
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

  // Handle deep links (twinpro.app/@username or twinpro.app/user/{userId})
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log("[DeepLink] Received URL:", url);

      // Match twinpro.app/user/{userId} pattern (direct user ID)
      const userIdMatch = url.match(/twinpro\.app\/user\/([a-f0-9]{24})/i);
      if (userIdMatch) {
        const userId = userIdMatch[1];
        console.log("[DeepLink] Direct userId:", userId);
        router.push(`/avatar-chat/${userId}` as any);
        return;
      }

      // Match twinpro.app/@username pattern
      const usernameMatch = url.match(/twinpro\.app\/@([a-z0-9_-]+)/i);
      if (usernameMatch) {
        const username = usernameMatch[1].toLowerCase();
        console.log("[DeepLink] Resolving username:", username);

        try {
          const profile = await usernameApi.getByUsername(username);
          console.log("[DeepLink] Resolved to userId:", profile.userId);
          router.push(`/avatar-chat/${profile.userId}` as any);
        } catch (error) {
          console.error("[DeepLink] Error resolving username:", error);
        }
      }
    };

    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for incoming deep links while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

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
  const inLegalGroup = segments[0] === 'legal';
  const isDeleteAccountSuccess = segments[0] === 'delete-account-success';

  // Si no hay token y NO estamos ya en el grupo de autenticación, onboarding, legal, o pantalla de éxito de eliminación → redirige al login
  if (!token && !inAuthGroup && !inOnboardingGroup && !inLegalGroup && !isDeleteAccountSuccess) {
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
        <Stack.Screen name="pro-chat" />
        <Stack.Screen name="video-call" />
        <Stack.Screen name="incoming-call" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <IncomingCallProvider>
        <RootLayoutNav />
      </IncomingCallProvider>
    </AuthProvider>
  );
}

