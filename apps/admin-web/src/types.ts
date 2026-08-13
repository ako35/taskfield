import type { VisitStatus } from "@taskfield/domain";

export type AppView = "home" | "login" | "register" | "dashboard";
export type DashboardSection = "overview" | "visits" | "customers" | "team";

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string | null;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
}

export interface FieldAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface VisitAssignment {
  id: string;
  fieldAgentId: string;
  customerId: string | null;
  agentFirstName: string;
  agentLastName: string;
  customerName: string;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
  createdAt: string;
  checkInAt: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutAt: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
}

export interface ManagerProfile {
  firstName: string;
  lastName: string;
}