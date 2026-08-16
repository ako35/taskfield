import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ManagerProfile } from "../types";
import "./ProfileMenu.css";

interface ProfileMenuProps {
  profile: ManagerProfile;
  initials: string;
  placement: "top" | "sidebar";
  onLogout: () => void;
}

export function ProfileMenu({
  profile,
  initials,
  placement,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fullName = `${profile.firstName} ${profile.lastName}`;

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  return (
    <div className={`profile-menu profile-menu-${placement}`} ref={menuRef}>
      <button
        className="profile-trigger"
        type="button"
        aria-label={`${fullName} profil menüsü`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        <span className="avatar">{initials}</span>
        <span className="profile-copy">
          <strong>{fullName}</strong>
          <small>Bölge Müdürü</small>
        </span>
        <ChevronDown className={open ? "rotated" : ""} size={15} />
      </button>
      {open && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-heading">
            <span className="avatar">{initials}</span>
            <span>
              <strong>{fullName}</strong>
              <small>Bölge Müdürü</small>
            </span>
          </div>
          <button type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={16} /> Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
