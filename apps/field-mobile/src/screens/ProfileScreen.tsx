import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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
import { ApiError, updateOwnPassword } from "../services/mobileApi";
import type { MobileUser } from "../types";

interface ProfileScreenProps {
  user: MobileUser;
  onBack: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ user, onBack, onLogout }: ProfileScreenProps) {
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
      setSuccess(await updateOwnPassword(currentPassword, newPassword));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
    } catch (passwordError) {
      setError(
        passwordError instanceof ApiError
          ? passwordError.message
          : "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable accessibilityRole="button" onPress={onBack}>
            <Text style={styles.backButton}>‹ Geri</Text>
          </Pressable>
          <Text style={styles.eyebrow}>HESAP AYARLARI</Text>
          <Text style={styles.title}>Profil</Text>

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
              Mevcut parolanı doğrulayarak yeni bir parola belirle.
            </Text>
            <Text style={styles.inputLabel}>Mevcut parola</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            <Text style={styles.inputLabel}>Yeni parola</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              placeholderTextColor="#8c968f"
            />
            <Text style={styles.inputLabel}>Yeni parola tekrar</Text>
            <TextInput
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoComplete="new-password"
              onSubmitEditing={() => void changePassword()}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                submitting && styles.buttonDisabled,
              ]}
              disabled={submitting}
              onPress={() => void changePassword()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Parolayı güncelle</Text>
              )}
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.logoutButton}
            onPress={onLogout}
          >
            <Text style={styles.logoutText}>Oturumu kapat</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f5f1" },
  keyboard: { flex: 1 },
  container: { padding: 22, paddingBottom: 44 },
  backButton: { color: "#285b43", fontSize: 12, fontWeight: "700" },
  eyebrow: { marginTop: 30, color: "#788078", fontSize: 9, fontWeight: "800" },
  title: {
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
  inputLabel: {
    marginBottom: 7,
    color: "#374039",
    fontSize: 10,
    fontWeight: "700",
  },
  input: {
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
  error: { marginBottom: 14, color: "#a7473c", fontSize: 10, lineHeight: 15 },
  success: {
    marginBottom: 14,
    color: "#26734e",
    fontSize: 10,
    fontWeight: "700",
  },
  saveButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#285b43",
  },
  saveButtonPressed: { backgroundColor: "#173d2d" },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  logoutButton: {
    alignItems: "center",
    marginTop: 36,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d7dbd4",
  },
  logoutText: { color: "#a7473c", fontSize: 11, fontWeight: "700" },
});
