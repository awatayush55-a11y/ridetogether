export type Theme = "light" | "dark";

export interface Coordinate {
  lat: number;
  lng: number;
}

export type VerificationStatus =
  | "not_started"
  | "email_pending"
  | "id_pending"
  | "verified"
  | "rejected";

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  college: string;
  collegeEmail: string;
  verificationStatus: VerificationStatus;
  avatarUrl?: string;
  driver: boolean;
  emergencyContacts: EmergencyContact[];
}

export interface Journey {
  id: string;
  driverId: string;
  origin: Coordinate;
  destination: Coordinate;
  departureAt: string;
  availableSeats: number;
  route: Coordinate[];
}

export interface MatchResult {
  journeyId: string;
  studentId: string;
  score: number;
  overlapRatio: number;
  detourMinutes: number;
  pickup: Coordinate;
  dropoff: Coordinate;
  reason: string;
}

export interface RideMember {
  studentId: string;
  pickup: Coordinate;
  dropoff: Coordinate;
  seatCount: number;
}

export interface RouteSegmentCost {
  from: Coordinate;
  to: Coordinate;
  distanceKm: number;
  amount: number;
}

export interface RideGroup {
  id: string;
  journeyId: string;
  members: RideMember[];
  segments: RouteSegmentCost[];
}

export type TripStatus =
  | "scheduled"
  | "approaching_pickup"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface LocationConsent {
  enabled: boolean;
  rideId?: string;
  expiresAt?: string;
}

export interface PrivacySettings {
  locationConsent: LocationConsent;
  showCollege: boolean;
}

export type ReportReason =
  | "unsafe_behavior"
  | "harassment"
  | "no_show"
  | "other";
