import { useState } from "react";
import {
  Bell,
  ClipboardCheck,
  MapPinned,
  PackageCheck,
  Search,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { ProfileMenu } from "../components/ProfileMenu";
import { CustomersManagement } from "../features/customers/CustomersManagement";
import { Overview } from "../features/dashboard/Overview";
import { TeamManagement } from "../features/team/TeamManagement";
import { VisitsManagement } from "../features/visits/VisitsManagement";
import type { AppView as View, DashboardSection } from "../types";
import "../styles/dashboard.css";
import "./DashboardPage.css";

export function DashboardPage({ goTo }: { goTo: (view: View) => void }) {
  const [section, setSection] = useState<DashboardSection>("overview");
  let profile = { firstName: "Ahmet", lastName: "Kaya" };
  try {
    const storedProfile = JSON.parse(
      localStorage.getItem("taskfield_user") ?? "null",
    ) as { firstName?: string; lastName?: string } | null;
    if (storedProfile?.firstName && storedProfile.lastName) {
      profile = {
        firstName: storedProfile.firstName,
        lastName: storedProfile.lastName,
      };
    }
  } catch {
    localStorage.removeItem("taskfield_user");
  }
  const initials =
    `${profile.firstName[0]}${profile.lastName[0]}`.toLocaleUpperCase("tr-TR");
  const logout = () => {
    localStorage.removeItem("taskfield_user");
    localStorage.removeItem("taskfield_token");
    goTo("home");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>TF</span>
          <strong>Taskfield</strong>
        </div>
        <nav aria-label="Ana menü">
          <a
            className={section === "overview" ? "active" : ""}
            href="#overview"
            onClick={(event) => {
              event.preventDefault();
              setSection("overview");
            }}
          >
            <ClipboardCheck size={19} /> Genel Bakış
          </a>
          <a
            className={section === "visits" ? "active" : ""}
            href="#visits"
            onClick={(event) => {
              event.preventDefault();
              setSection("visits");
            }}
          >
            <MapPinned size={19} /> Ziyaretler
          </a>
          <a
            className={section === "customers" ? "active" : ""}
            href="#customers"
            onClick={(event) => {
              event.preventDefault();
              setSection("customers");
            }}
          >
            <Store size={19} /> Müşteriler
          </a>
          <a href="#orders">
            <ShoppingCart size={19} /> Siparişler
          </a>
          <a href="#products">
            <PackageCheck size={19} /> Ürünler
          </a>
          <a
            className={section === "team" ? "active" : ""}
            href="#team"
            onClick={(event) => {
              event.preventDefault();
              setSection("team");
            }}
          >
            <Users size={19} /> Saha Ekibi
          </a>
        </nav>
        <ProfileMenu
          profile={profile}
          initials={initials}
          placement="sidebar"
          onLogout={logout}
        />
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>Saha Operasyonları</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={18} />
              <input aria-label="Ara" placeholder="Müşteri veya ekip ara" />
            </label>
            <button
              className="icon-button"
              type="button"
              aria-label="Bildirimler"
            >
              <Bell size={20} />
              <span />
            </button>
            <ProfileMenu
              profile={profile}
              initials={initials}
              placement="top"
              onLogout={logout}
            />
          </div>
        </header>

        {section === "team" ? (
          <TeamManagement onUnauthorized={logout} />
        ) : section === "customers" ? (
          <CustomersManagement onUnauthorized={logout} />
        ) : section === "visits" ? (
          <VisitsManagement onUnauthorized={logout} />
        ) : (
          <Overview
            onUnauthorized={logout}
            onViewAllVisits={() => setSection("visits")}
          />
        )}
      </main>
    </div>
  );
}
