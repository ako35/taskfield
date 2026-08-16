import type { VisitStatus } from "@taskfield/domain";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ApiError,
  checkInVisit,
  checkOutVisit,
  getAssignedVisits,
} from "../services/mobileApi";
import type { MobileUser, VisitAssignment } from "../types";

const statusLabels: Record<VisitStatus, string> = {
  planned: "Planlandı",
  in_progress: "Sıradaki",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

interface FieldDashboardProps {
  user: MobileUser;
  onOpenProfile: () => void;
  onSessionExpired: () => void;
  onCheckOutComplete: () => void;
}

const HIGH_ACCURACY_THRESHOLD_METERS = 20;
const MAX_LOCATION_AGE_MS = 12000;

function accuracyMeters(location: Location.LocationObject): number {
  return location.coords.accuracy ?? Number.POSITIVE_INFINITY;
}

function isValidCandidate(location: Location.LocationObject) {
  const accuracy = accuracyMeters(location);
  return (
    Number.isFinite(location.coords.latitude) &&
    Number.isFinite(location.coords.longitude) &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= 2000 &&
    Date.now() - location.timestamp <= MAX_LOCATION_AGE_MS
  );
}

async function getCurrentLocationOnce(): Promise<Location.LocationObject> {
  const status = await Location.getForegroundPermissionsAsync();
  if (status.status !== "granted") {
    const requestResult = await Location.requestForegroundPermissionsAsync();
    if (requestResult.status !== "granted") {
      throw new Error("Konum erişimi izni verilmedi.");
    }
  }

  const initialLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
    mayShowUserSettingsDialog: true,
  });

  if (!isValidCandidate(initialLocation)) {
    throw new Error("Geçerli konum alınamadı.");
  }

  let bestLocation = initialLocation;
  let cancelWatch: (() => void) | undefined;

  const watchPromise = new Promise<Location.LocationObject>(
    (resolve, reject) => {
      let settled = false;

      const finish = (callback: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        callback();
      };

      const onLocation = (candidate: Location.LocationObject) => {
        if (!isValidCandidate(candidate)) {
          return;
        }

        const candidateAccuracy = accuracyMeters(candidate);
        const bestAccuracy = accuracyMeters(bestLocation);

        if (
          candidateAccuracy < bestAccuracy ||
          (candidateAccuracy === bestAccuracy &&
            candidate.timestamp > bestLocation.timestamp)
        ) {
          bestLocation = candidate;
        }

        if (candidateAccuracy <= HIGH_ACCURACY_THRESHOLD_METERS) {
          finish(() => {
            if (cancelWatch) {
              cancelWatch();
            }
            resolve(candidate);
          });
        }
      };

      const onError = (errorMessage: string) => {
        finish(() => {
          reject(new Error(errorMessage || "Konum izleme hatası."));
        });
      };

      void Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 2,
          mayShowUserSettingsDialog: true,
        },
        onLocation,
        onError,
      )
        .then((subscription) => {
          cancelWatch = () => subscription.remove();
        })
        .catch((error) => {
          onError(
            error instanceof Error ? error.message : "Konum izleme hatası.",
          );
        });

      setTimeout(() => {
        finish(() => {
          if (cancelWatch) {
            cancelWatch();
          }
          resolve(bestLocation);
        });
      }, 8000);
    },
  );

  try {
    return await watchPromise;
  } finally {
    if (cancelWatch) {
      cancelWatch();
    }
  }
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} metre`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function RouteState({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return <ActivityIndicator color="#285b43" style={styles.routeLoading} />;
  }
  if (error) return <Text style={styles.routeError}>{error}</Text>;
  return null;
}

function VisitCard({
  visit,
  isLast,
  onCheckIn,
  onCheckOut,
}: {
  visit: VisitAssignment;
  isLast: boolean;
  onCheckIn: (visitId: string) => void;
  onCheckOut: (visitId: string) => void;
}) {
  const scheduledAt = new Date(visit.scheduledAt);
  const durationText = useMemo(() => {
    if (!visit.checkInAt) return "Giriş yapılmadı";
    const end = visit.checkOutAt ? new Date(visit.checkOutAt) : new Date();
    const start = new Date(visit.checkInAt);
    const diffMs = Math.max(end.getTime() - start.getTime(), 0);
    const totalMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}s ${minutes}dk` : `${minutes}dk`;
  }, [visit.checkInAt, visit.checkOutAt]);

  return (
    <View style={styles.visit}>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>
          {scheduledAt.toLocaleTimeString("tr-TR", {
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
        {!isLast && <View style={styles.routeLine} />}
      </View>
      <View
        style={[
          styles.visitCard,
          visit.status === "in_progress" && styles.activeCard,
        ]}
      >
        <View style={styles.visitTop}>
          <View style={styles.visitHeading}>
            <Text style={styles.customer}>{visit.customerName}</Text>
            <Text style={styles.district}>
              {visit.district} ·{" "}
              {scheduledAt.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
          <Text style={[styles.badge, styles[visit.status]]}>
            {statusLabels[visit.status]}
          </Text>
        </View>
        <Text style={styles.visitAddress}>{visit.address}</Text>
        {visit.notes ? (
          <Text style={styles.visitNote}>{visit.notes}</Text>
        ) : null}
        <View style={styles.visitMetaRow}>
          <Text style={styles.durationLabel}>Ziyaret süresi</Text>
          <Text style={styles.durationValue}>{durationText}</Text>
        </View>
        {visit.status === "planned" ? (
          <Pressable
            style={styles.actionButton}
            onPress={() => onCheckIn(visit.id)}
          >
            <Text style={styles.actionButtonText}>Dükkan giriş</Text>
          </Pressable>
        ) : null}
        {visit.status === "in_progress" ? (
          <Pressable
            style={[styles.actionButton, styles.exitButton]}
            onPress={() => onCheckOut(visit.id)}
          >
            <Text style={styles.actionButtonText}>Dükkan çıkış</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FieldDashboard({
  user,
  onOpenProfile,
  onSessionExpired,
  onCheckOutComplete,
}: FieldDashboardProps) {
  const [visits, setVisits] = useState<VisitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const completed = visits.filter(
    (visit) => visit.status === "completed",
  ).length;
  const completionRate = visits.length
    ? Math.round((completed / visits.length) * 100)
    : 0;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toLocaleUpperCase(
    "tr-TR",
  );

  useEffect(() => {
    async function loadVisits() {
      try {
        setVisits(await getAssignedVisits());
      } catch (visitError) {
        if (visitError instanceof ApiError && visitError.status === 401) {
          onSessionExpired();
          return;
        }
        setError(
          visitError instanceof ApiError
            ? visitError.message
            : "Ziyaretler için sunucuya ulaşılamadı.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadVisits();
  }, [user.id]);

  async function handleCheckIn(visitId: string) {
    try {
      const visit = visits.find((item) => item.id === visitId);
      if (!visit) {
        Alert.alert("Ziyaret bulunamadı.");
        return;
      }

      const position = await getCurrentLocationOnce();
      const distanceMeters =
        visit.latitude !== null && visit.longitude !== null
          ? calculateDistanceMeters(
              position.coords.latitude,
              position.coords.longitude,
              visit.latitude,
              visit.longitude,
            )
          : null;

      const accuracyMetersValue = Math.round(position.coords.accuracy ?? 0);
      const updatedVisit = await checkInVisit(
        visitId,
        position.coords.latitude,
        position.coords.longitude,
      );
      if (!updatedVisit) {
        Alert.alert("Giriş kaydı oluşturulamadı.");
        return;
      }
      setVisits((current) =>
        current.map((visit) => (visit.id === visitId ? updatedVisit : visit)),
      );

      Alert.alert(
        "Dükkan giriş kaydı",
        `Yüksek hassasiyetli konum gönderildi.\nKoordinat: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}\nHassasiyet: ±${accuracyMetersValue} m\nMüşteri adresine ${distanceMeters !== null ? formatDistanceMeters(distanceMeters) : "bilinmeyen mesafede"} yakın.`,
      );
    } catch (locationError) {
      Alert.alert(
        "Konum izni gerekli",
        locationError instanceof Error
          ? locationError.message
          : "Dükkan girişini kaydetmek için konum izni verin.",
      );
    }
  }

  async function handleCheckOut(visitId: string) {
    try {
      const visit = visits.find((item) => item.id === visitId);
      if (!visit) {
        Alert.alert("Ziyaret bulunamadı.");
        return;
      }

      const position = await getCurrentLocationOnce();
      const distanceMeters =
        visit.latitude !== null && visit.longitude !== null
          ? calculateDistanceMeters(
              position.coords.latitude,
              position.coords.longitude,
              visit.latitude,
              visit.longitude,
            )
          : null;

      const accuracyMetersValue = Math.round(position.coords.accuracy ?? 0);
      const updatedVisit = await checkOutVisit(
        visitId,
        position.coords.latitude,
        position.coords.longitude,
      );
      if (!updatedVisit) {
        Alert.alert("Çıkış kaydı oluşturulamadı.");
        return;
      }
      setVisits((current) =>
        current.map((visit) => (visit.id === visitId ? updatedVisit : visit)),
      );

      Alert.alert(
        "Dükkan çıkış kaydı",
        `Yüksek hassasiyetli konum gönderildi.\nKoordinat: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}\nHassasiyet: ±${accuracyMetersValue} m\nMüşteri adresine ${distanceMeters !== null ? formatDistanceMeters(distanceMeters) : "bilinmeyen mesafede"} yakın.`,
      );
      onCheckOutComplete();
    } catch (locationError) {
      Alert.alert(
        "Konum izni gerekli",
        locationError instanceof Error
          ? locationError.message
          : "Dükkan çıkışını kaydetmek için konum izni verin.",
      );
    }
  }

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
            style={styles.profile}
            onPress={onOpenProfile}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.profileText}>Profil</Text>
          </Pressable>
        </View>

        <View style={styles.syncBar}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>
            {loading ? "Atamalar yükleniyor" : "Ziyaret planın güncel"}
          </Text>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>ATANAN ZİYARET</Text>
            <Text style={styles.summaryValue}>{visits.length} ziyaret</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.summaryLabel}>TAMAMLANAN</Text>
            <Text style={styles.summaryValue}>
              {completed} / {visits.length}
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
          <Text style={styles.sectionCount}>{visits.length} durak</Text>
        </View>
        <RouteState loading={loading} error={error} />
        {!loading && !error && visits.length === 0 ? (
          <View style={styles.emptyRoute}>
            <Text style={styles.emptyRouteTitle}>Atanmış ziyaret yok</Text>
            <Text style={styles.emptyRouteText}>
              Yeni ziyaretler bölge müdürünüz tarafından atandığında burada
              görünecek.
            </Text>
          </View>
        ) : null}
        {visits.map((visit, index) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            isLast={index === visits.length - 1}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f5f1" },
  container: { padding: 22, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: { color: "#7b8179", fontSize: 10, fontWeight: "700" },
  title: {
    marginTop: 4,
    color: "#1d2922",
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "600",
  },
  profile: { alignItems: "center", gap: 3 },
  avatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#285b43",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  profileText: { color: "#69736c", fontSize: 8, fontWeight: "700" },
  syncBar: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  syncDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 4,
    backgroundColor: "#4c976d",
  },
  syncText: { color: "#737b73", fontSize: 10 },
  summary: { padding: 18, borderRadius: 7, backgroundColor: "#173d2d" },
  summaryLabel: { color: "#a8bdb1", fontSize: 9, fontWeight: "700" },
  summaryValue: {
    marginTop: 4,
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
  },
  divider: { height: 1, marginVertical: 14, backgroundColor: "#35604c" },
  progressTrack: {
    height: 4,
    marginTop: 14,
    borderRadius: 2,
    backgroundColor: "#466a58",
  },
  progressValue: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f2cf66",
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#1d2922", fontSize: 16, fontWeight: "700" },
  sectionCount: { color: "#285b43", fontSize: 11, fontWeight: "700" },
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
  visit: { minHeight: 103, flexDirection: "row" },
  timeColumn: { position: "relative", width: 52, alignItems: "flex-start" },
  time: { color: "#5e665e", fontSize: 10, fontWeight: "700" },
  routeDot: {
    position: "absolute",
    top: 26,
    left: 8,
    zIndex: 2,
    width: 9,
    height: 9,
    borderWidth: 2,
    borderColor: "#9da39b",
    borderRadius: 5,
    backgroundColor: "#f4f5f1",
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
  visitHeading: { flex: 1 },
  customer: { color: "#20251f", fontSize: 13, fontWeight: "700" },
  district: { marginTop: 4, color: "#7b8179", fontSize: 9 },
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
  visitMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eceee9",
    paddingTop: 8,
  },
  durationLabel: { color: "#69736c", fontSize: 9, fontWeight: "700" },
  durationValue: { color: "#173d2d", fontSize: 9, fontWeight: "700" },
  actionButton: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#285b43",
  },
  actionButtonText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  exitButton: { backgroundColor: "#b25642" },
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
});
