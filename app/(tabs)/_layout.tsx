import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Ocultamos la barra de tabs por defecto
        tabBarActiveTintColor: "#f9f506",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: "Directorio",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Configuración",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: "Escanear QR",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="my-qr-code"
        options={{
          title: "Mi Código QR",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoritos",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="category-results"
        options={{
          title: "Resultados",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="all-categories"
        options={{
          title: "Categorías",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="become-pro"
        options={{
          title: "Ser Pro",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="pro-dashboard"
        options={{
          title: "Dashboard Pro",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="delete-account"
        options={{
          title: "Eliminar Cuenta",
          tabBarButton: () => null,
        }}
      />

      <Tabs.Screen
        name="logout-confirm"
        options={{
          title: "Cerrar Sesión",
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}