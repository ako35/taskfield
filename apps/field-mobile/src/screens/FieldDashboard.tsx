import type { VisitStatus } from "@taskfield/domain";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, getAssignedVisits } from "../services/mobileApi";
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
}: {
  visit: VisitAssignment;
  isLast: boolean;
}) {
  const scheduledAt = new Date(visit.scheduledAt);
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
      </View>
    </View>
  );
}

export function FieldDashboard({
  user,
  onOpenProfile,
  onSessionExpired,
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
