import type { VisitStatus } from "@taskfield/domain";

export interface MobileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "field_agent";
}

export interface VisitAssignment {
  id: string;
  customerName: string;
  district: string;
  address: string;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
  checkInAt: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutAt: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
}

export type MobileScreen = "dashboard" | "profile";