import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { FieldDashboard } from "./src/screens/FieldDashboard";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import {
  clearMobileSession,
  restoreMobileSession,
} from "./src/services/mobileApi";
import type { MobileScreen, MobileUser } from "./src/types";

export default function App() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [screen, setScreen] = useState<MobileScreen>("dashboard");
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        setUser(await restoreMobileSession());
      } finally {
        setRestoring(false);
      }
    }
    void restoreSession();
  }, []);

  async function logout() {
    await clearMobileSession();
    setUser(null);
    setScreen("dashboard");
  }

  if (restoring) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#d9f278" size="large" />
      </SafeAreaView>
    );
  }
  if (!user) return <LoginScreen onLogin={setUser} />;
  if (screen === "profile") {
    return (
      <ProfileScreen
        user={user}
        onBack={() => setScreen("dashboard")}
        onLogout={() => void logout()}
      />
    );
  }
  return (
    <FieldDashboard
      user={user}
      onOpenProfile={() => setScreen("profile")}
      onSessionExpired={() => void logout()}
      onCheckOutComplete={() => setScreen("dashboard")}
    />
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173d2d",
  },
});
