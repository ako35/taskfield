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
  agentFirstName: string;
  agentLastName: string;
  customerName: string;
  district: string;
  address: string;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
}

export interface ManagerProfile {
  firstName: string;
  lastName: string;
}