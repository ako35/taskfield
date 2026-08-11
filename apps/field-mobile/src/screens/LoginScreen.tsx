import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError, loginFieldAgent } from "../services/mobileApi";
import type { MobileUser } from "../types";

interface LoginScreenProps {
  onLogin: (user: MobileUser) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.includes("@") || password.length < 8) {
      setError("Geçerli e-posta ve en az 8 karakterli parola girin.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      onLogin(await loginFieldAgent(email, password));
    } catch (loginError) {
      setError(
        loginError instanceof ApiError
          ? loginError.message
          : "Sunucuya ulaşılamadı. API adresini ve ağı kontrol edin.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TF</Text>
          </View>
          <Text style={styles.brandText}>Taskfield</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>SAHA EKİBİ MOBİL</Text>
          <Text style={styles.title}>Bugünün rotası burada başlar.</Text>
          <Text style={styles.lead}>
            Bölge müdürünüzün oluşturduğu hesap bilgileriyle giriş yapın.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-posta</Text>
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
          <Text style={styles.label}>Parola</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Parolanız"
            placeholderTextColor="#8c968f"
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={() => void submit()}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              submitting && styles.buttonDisabled,
            ]}
            disabled={submitting}
            onPress={() => void submit()}
          >
            {submitting ? (
              <ActivityIndicator color="#173d2d" />
            ) : (
              <Text style={styles.buttonText}>Giriş yap</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.help}>
          Hesap erişimi için bölge müdürünüzle iletişime geçin.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#173d2d" },
  keyboard: { flex: 1, paddingHorizontal: 24, paddingVertical: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#d9f278",
  },
  logoText: {
    color: "#173d2d",
    fontFamily: "serif",
    fontSize: 15,
    fontWeight: "700",
  },
  brandText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  intro: { marginTop: 68 },
  eyebrow: { color: "#d9f278", fontSize: 9, fontWeight: "800" },
  title: {
    maxWidth: 330,
    marginTop: 12,
    color: "#fff",
    fontFamily: "serif",
    fontSize: 38,
    fontWeight: "600",
    lineHeight: 41,
  },
  lead: {
    maxWidth: 330,
    marginTop: 16,
    color: "#b7c9bf",
    fontSize: 12,
    lineHeight: 19,
  },
  form: { marginTop: 38 },
  label: {
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
  error: {
    marginBottom: 14,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#e2776d",
    backgroundColor: "#3f3931",
    color: "#ffd7d3",
    fontSize: 10,
    lineHeight: 15,
  },
  button: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#d9f278",
  },
  buttonPressed: { backgroundColor: "#eef7c9" },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#173d2d", fontSize: 12, fontWeight: "800" },
  help: {
    marginTop: "auto",
    color: "#91aa9b",
    textAlign: "center",
    fontSize: 9,
  },
});
