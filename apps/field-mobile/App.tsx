import type { VisitStatus } from "@taskfield/domain";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api");

interface MobileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "field_agent";
}

interface VisitAssignment {
  id: string;
  customerName: string;
  district: string;
  address: string;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
}

const labels: Record<VisitStatus, string> = {
  planned: "Planlandı",
  in_progress: "Sıradaki",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function LoginScreen({ onLogin }: { onLogin: (user: MobileUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login() {
    if (!email.includes("@") || password.length < 8) {
      setError("Geçerli e-posta ve en az 8 karakterli parola girin.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = (await response.json()) as {
        token?: string;
        user?: MobileUser & { role: string };
        message?: string | string[];
      };
      if (!response.ok || !result.user || !result.token) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "Giriş yapılamadı.");
        return;
      }
      if (result.user.role !== "field_agent") {
        setError("Bu uygulama yalnız saha çalışanı hesapları içindir.");
        return;
      }
      await SecureStore.setItemAsync("taskfield_mobile_token", result.token);
      await SecureStore.setItemAsync(
        "taskfield_mobile_user",
        JSON.stringify(result.user),
      );
      onLogin(result.user as MobileUser);
    } catch {
      setError(
        "Sunucuya ulaşılamadı. API adresini ve ağ bağlantısını kontrol edin.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginSafeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.loginKeyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.loginBrand}>
          <View style={styles.loginLogo}>
            <Text style={styles.loginLogoText}>TF</Text>
          </View>
          <Text style={styles.loginBrandText}>Taskfield</Text>
        </View>
        <View style={styles.loginIntro}>
          <Text style={styles.loginEyebrow}>SAHA EKİBİ MOBİL</Text>
          <Text style={styles.loginTitle}>Bugünün rotası burada başlar.</Text>
          <Text style={styles.loginLead}>
            Bölge müdürünüzün oluşturduğu hesap bilgileriyle giriş yapın.
          </Text>
        </View>
        <View style={styles.loginForm}>
          <Text style={styles.inputLabel}>E-posta</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ad@firma.com"
            placeholderTextColor="#8c968f"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.inputLabel}>Parola</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Geçici parolanız"
            placeholderTextColor="#8c968f"
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={() => void login()}
          />
          {error ? <Text style={styles.loginError}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              submitting && styles.loginButtonDisabled,
            ]}
            disabled={submitting}
            onPress={() => void login()}
          >
            {submitting ? (
              <ActivityIndicator color="#173d2d" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş yap</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.loginHelp}>
          Hesap erişimi için bölge müdürünüzle iletişime geçin.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldDashboard({
  user,
  onOpenProfile,
  onSessionExpired,
}: {
  user: MobileUser;
  onOpenProfile: () => void;
  onSessionExpired: () => void;
}) {
  const [route, setRoute] = useState<VisitAssignment[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState("");
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toLocaleUpperCase(
    "tr-TR",
  );
  const completedVisits = route.filter(
    (visit) => visit.status === "completed",
  ).length;
  const completionRate = route.length
    ? Math.round((completedVisits / route.length) * 100)
    : 0;

  useEffect(() => {
    async function loadRoute() {
      try {
        const token = await SecureStore.getItemAsync("taskfield_mobile_token");
        if (!token) {
          onSessionExpired();
          return;
        }
        const response = await fetch(`${API_URL}/visits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const result = (await response.json()) as {
          visits?: VisitAssignment[];
          message?: string | string[];
        };
        if (!response.ok) {
          const message = Array.isArray(result.message)
            ? result.message.join(" ")
            : result.message;
          setRouteError(message ?? "Ziyaretler yüklenemedi.");
          return;
        }
        setRoute(result.visits ?? []);
      } catch {
        setRouteError("Ziyaretler için sunucuya ulaşılamadı.");
      } finally {
        setRouteLoading(false);
      }
    }
    void loadRoute();
  }, [onSessionExpired, user.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <Text style={styles.title}>Günaydın, {user.firstName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profili aç"
            style={styles.mobileProfile}
            onPress={onOpenProfile}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.logoutText}>Profil</Text>
          </Pressable>
        </View>
        <View style={styles.syncBar}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>
            {routeLoading ? "Atamalar yükleniyor" : "Ziyaret planın güncel"}
          </Text>
        </View>
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>ATANAN ZİYARET</Text>
            <Text style={styles.summaryValue}>{route.length} ziyaret</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.summaryLabel}>TAMAMLANAN</Text>
            <Text style={styles.summaryValue}>
              {completedVisits} / {route.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressValue, { width: `${completionRate}%` }]}
            />
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ziyaret planı</Text>
          <Text style={styles.sectionLink}>{route.length} durak</Text>
        </View>
        <View style={styles.routeList}>
          {routeLoading && (
            <ActivityIndicator color="#285b43" style={styles.routeLoading} />
          )}
          {routeError ? (
            <Text style={styles.routeError}>{routeError}</Text>
          ) : null}
          {!routeLoading && !routeError && route.length === 0 ? (
            <View style={styles.emptyRoute}>
              <Text style={styles.emptyRouteTitle}>Atanmış ziyaret yok</Text>
              <Text style={styles.emptyRouteText}>
                Yeni ziyaretler bölge müdürünüz tarafından atandığında burada
                görünecek.
              </Text>
            </View>
          ) : null}
          {route.map((visit, index) => (
            <View style={styles.visit} key={visit.id}>
              <View style={styles.timeColumn}>
                <Text style={styles.time}>
                  {new Date(visit.scheduledAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <View
                  style={[
                    styles.routeDot,
                    visit.status === "completed" && styles.doneDot,
                  ]}
                />
                {index < route.length - 1 && <View style={styles.routeLine} />}
              </View>
              <View
                style={[
                  styles.visitCard,
                  visit.status === "in_progress" && styles.activeCard,
                ]}
              >
                <View style={styles.visitTop}>
                  <View>
                    <Text style={styles.customer}>{visit.customerName}</Text>
                    <Text style={styles.district}>
                      {visit.district} ·{" "}
                      {new Date(visit.scheduledAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.badge, styles[visit.status]]}>
                    {labels[visit.status]}
                  </Text>
                </View>
                <Text style={styles.visitAddress}>{visit.address}</Text>
                {visit.notes ? (
                  <Text style={styles.visitNote}>{visit.notes}</Text>
                ) : null}
                {visit.status === "in_progress" && (
                  <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>
                      Ziyareti başlat
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({
  user,
  onBack,
  onLogout,
}: {
  user: MobileUser;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function changePassword() {
    setError("");
    setSuccess("");
    if (
      currentPassword.length < 8 ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      setError("Parolalar 8-128 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Yeni parola ve tekrarı eşleşmiyor.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("taskfield_mobile_token");
      if (!token) {
        setError("Oturumunuz bulunamadı. Lütfen yeniden giriş yapın.");
        return;
      }
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as {
        message?: string | string[];
      };
      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "Parola değiştirilemedi.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setSuccess(result.message as string);
    } catch {
      setError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.profileSafeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.profileKeyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.profileContainer}>
          <Pressable accessibilityRole="button" onPress={onBack}>
            <Text style={styles.backButton}>‹ Geri</Text>
          </Pressable>
          <Text style={styles.profileEyebrow}>HESAP AYARLARI</Text>
          <Text style={styles.profileTitle}>Profil</Text>
          <View style={styles.identityPanel}>
            <Text style={styles.identityName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.identityEmail}>{user.email}</Text>
            <Text style={styles.identityRole}>Saha çalışanı</Text>
          </View>
          <View style={styles.passwordPanel}>
            <Text style={styles.passwordTitle}>Parolanı değiştir</Text>
            <Text style={styles.passwordDescription}>
              Bölge müdürünüzün verdiği mevcut parolayı doğrulayarak yeni bir
              parola belirleyin.
            </Text>
            <Text style={styles.profileInputLabel}>Mevcut parola</Text>
            <TextInput
              style={styles.profileInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            <Text style={styles.profileInputLabel}>Yeni parola</Text>
            <TextInput
              style={styles.profileInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              placeholderTextColor="#8c968f"
            />
            <Text style={styles.profileInputLabel}>Yeni parola tekrar</Text>
            <TextInput
              style={styles.profileInput}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoComplete="new-password"
              onSubmitEditing={() => void changePassword()}
            />
            {error ? <Text style={styles.profileError}>{error}</Text> : null}
            {success ? (
              <Text style={styles.profileSuccess}>{success}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.savePasswordButton,
                pressed && styles.savePasswordButtonPressed,
                submitting && styles.loginButtonDisabled,
              ]}
              disabled={submitting}
              onPress={() => void changePassword()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.savePasswordButtonText}>
                  Parolayı güncelle
                </Text>
              )}
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.profileLogoutButton}
            onPress={onLogout}
          >
            <Text style={styles.profileLogoutText}>Oturumu kapat</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [screen, setScreen] = useState<"dashboard" | "profile">("dashboard");
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [token, storedUser] = await Promise.all([
          SecureStore.getItemAsync("taskfield_mobile_token"),
          SecureStore.getItemAsync("taskfield_mobile_user"),
        ]);
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser) as MobileUser;
          if (parsedUser.role === "field_agent") setUser(parsedUser);
        }
      } finally {
        setRestoring(false);
      }
    }
    void restoreSession();
  }, []);

  async function logout() {
    await Promise.all([
      SecureStore.deleteItemAsync("taskfield_mobile_token"),
      SecureStore.deleteItemAsync("taskfield_mobile_user"),
    ]);
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
  loginSafeArea: { flex: 1, backgroundColor: "#173d2d" },
  loginKeyboard: { flex: 1, paddingHorizontal: 24, paddingVertical: 28 },
  loginBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  loginLogo: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#d9f278",
  },
  loginLogoText: {
    color: "#173d2d",
    fontFamily: "serif",
    fontSize: 15,
    fontWeight: "700",
  },
  loginBrandText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  loginIntro: { marginTop: 68 },
  loginEyebrow: { color: "#d9f278", fontSize: 9, fontWeight: "800" },
  loginTitle: {
    maxWidth: 330,
    marginTop: 12,
    color: "#fff",
    fontFamily: "serif",
    fontSize: 38,
    fontWeight: "600",
    lineHeight: 41,
  },
  loginLead: {
    maxWidth: 330,
    marginTop: 16,
    color: "#b7c9bf",
    fontSize: 12,
    lineHeight: 19,
  },
  loginForm: { marginTop: 38 },
  inputLabel: {
    marginBottom: 7,
    color: "#dce6df",
    fontSize: 10,
    fontWeight: "700",
  },
  input: {
    height: 50,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#52715f",
    borderRadius: 6,
    backgroundColor: "#234b39",
    color: "#fff",
    fontSize: 13,
  },
  loginError: {
    marginBottom: 14,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#e2776d",
    backgroundColor: "#3f3931",
    color: "#ffd7d3",
    fontSize: 10,
    lineHeight: 15,
  },
  loginButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#d9f278",
  },
  loginButtonPressed: { backgroundColor: "#eef7c9" },
  loginButtonDisabled: { opacity: 0.65 },
  loginButtonText: { color: "#173d2d", fontSize: 12, fontWeight: "800" },
  loginHelp: {
    marginTop: "auto",
    color: "#91aa9b",
    textAlign: "center",
    fontSize: 9,
  },
  profileSafeArea: { flex: 1, backgroundColor: "#f4f5f1" },
  profileKeyboard: { flex: 1 },
  profileContainer: { padding: 22, paddingBottom: 44 },
  backButton: { color: "#285b43", fontSize: 12, fontWeight: "700" },
  profileEyebrow: {
    marginTop: 30,
    color: "#788078",
    fontSize: 9,
    fontWeight: "800",
  },
  profileTitle: {
    marginTop: 6,
    color: "#1d2922",
    fontFamily: "serif",
    fontSize: 30,
    fontWeight: "600",
  },
  identityPanel: {
    marginTop: 18,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d7dbd4",
  },
  identityName: { color: "#1d2922", fontSize: 16, fontWeight: "700" },
  identityEmail: { marginTop: 5, color: "#687169", fontSize: 11 },
  identityRole: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e1efe6",
    color: "#26734e",
    fontSize: 8,
    fontWeight: "700",
  },
  passwordPanel: { marginTop: 28 },
  passwordTitle: { color: "#1d2922", fontSize: 17, fontWeight: "700" },
  passwordDescription: {
    marginTop: 7,
    marginBottom: 22,
    color: "#687169",
    fontSize: 10,
    lineHeight: 16,
  },
  profileInputLabel: {
    marginBottom: 7,
    color: "#374039",
    fontSize: 10,
    fontWeight: "700",
  },
  profileInput: {
    height: 48,
    marginBottom: 15,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#c8cec8",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#1d2922",
    fontSize: 13,
  },
  profileError: {
    marginBottom: 14,
    color: "#a7473c",
    fontSize: 10,
    lineHeight: 15,
  },
  profileSuccess: {
    marginBottom: 14,
    color: "#26734e",
    fontSize: 10,
    fontWeight: "700",
  },
  savePasswordButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#285b43",
  },
  savePasswordButtonPressed: { backgroundColor: "#173d2d" },
  savePasswordButtonText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  profileLogoutButton: {
    alignItems: "center",
    marginTop: 36,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d7dbd4",
  },
  profileLogoutText: { color: "#a7473c", fontSize: 11, fontWeight: "700" },
  safeArea: { flex: 1, backgroundColor: "#f4f5f1" },
  container: { padding: 22, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#7b8179",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    color: "#1d2922",
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "600",
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#285b43",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  mobileProfile: { alignItems: "center", gap: 3 },
  logoutText: { color: "#69736c", fontSize: 8, fontWeight: "700" },
  syncBar: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4c976d",
    marginRight: 7,
  },
  syncText: { color: "#737b73", fontSize: 10 },
  summary: { padding: 18, borderRadius: 7, backgroundColor: "#173d2d" },
  summaryLabel: { color: "#a8bdb1", fontSize: 9, fontWeight: "700" },
  summaryValue: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: "#35604c", marginVertical: 14 },
  progressTrack: {
    height: 4,
    marginTop: 14,
    borderRadius: 2,
    backgroundColor: "#466a58",
  },
  progressValue: {
    width: "25%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f2cf66",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: "#1d2922", fontSize: 16, fontWeight: "700" },
  sectionLink: { color: "#285b43", fontSize: 11, fontWeight: "700" },
  routeLoading: { marginVertical: 30 },
  routeError: {
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#a7473c",
    backgroundColor: "#f2e4e2",
    color: "#893c34",
    fontSize: 10,
    lineHeight: 16,
  },
  emptyRoute: {
    paddingVertical: 38,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dde0d9",
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  emptyRouteTitle: { color: "#20251f", fontSize: 14, fontWeight: "700" },
  emptyRouteText: {
    maxWidth: 270,
    marginTop: 7,
    color: "#7b8179",
    textAlign: "center",
    fontSize: 9,
    lineHeight: 15,
  },
  routeList: { gap: 0 },
  visit: { flexDirection: "row", minHeight: 103 },
  timeColumn: { width: 52, alignItems: "flex-start", position: "relative" },
  time: { color: "#5e665e", fontSize: 10, fontWeight: "700" },
  routeDot: {
    position: "absolute",
    top: 26,
    left: 8,
    width: 9,
    height: 9,
    borderWidth: 2,
    borderColor: "#9da39b",
    borderRadius: 5,
    backgroundColor: "#f4f5f1",
    zIndex: 2,
  },
  doneDot: { borderColor: "#4c976d", backgroundColor: "#4c976d" },
  routeLine: {
    position: "absolute",
    top: 34,
    bottom: -2,
    left: 12,
    width: 1,
    backgroundColor: "#cfd3cc",
  },
  visitCard: {
    flex: 1,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dde0d9",
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  activeCard: { borderColor: "#8eaa9a" },
  visitTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  customer: { color: "#20251f", fontSize: 13, fontWeight: "700" },
  district: { color: "#7b8179", fontSize: 9, marginTop: 4 },
  visitAddress: {
    marginTop: 10,
    color: "#535c55",
    fontSize: 9,
    lineHeight: 14,
  },
  visitNote: {
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#eceee9",
    color: "#7b8179",
    fontSize: 9,
    fontStyle: "italic",
    lineHeight: 14,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    fontSize: 8,
    fontWeight: "700",
  },
  completed: { color: "#26734e", backgroundColor: "#e1efe6" },
  in_progress: { color: "#936116", backgroundColor: "#f8ecd3" },
  planned: { color: "#3f6885", backgroundColor: "#e5edf3" },
  cancelled: { color: "#a7473c", backgroundColor: "#f2e4e2" },
  primaryButton: {
    alignItems: "center",
    marginTop: 13,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: "#285b43",
  },
  primaryButtonText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
