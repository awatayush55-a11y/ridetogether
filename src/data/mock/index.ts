import journeysJson from "./journeys.json";
import studentsJson from "./students.json";
import type { Journey, StudentProfile } from "../../types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStudentProfile(value: unknown): value is StudentProfile {
  if (!isRecord(value)) return false;
  const validStatuses = [
    "not_started",
    "email_pending",
    "id_pending",
    "verified",
    "rejected",
  ];

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.college === "string" &&
    typeof value.collegeEmail === "string" &&
    typeof value.verificationStatus === "string" &&
    validStatuses.includes(value.verificationStatus) &&
    typeof value.driver === "boolean" &&
    Array.isArray(value.emergencyContacts)
  );
}

const importedStudents: unknown = studentsJson;
if (!Array.isArray(importedStudents) || !importedStudents.every(isStudentProfile)) {
  throw new Error("The mock student data does not match the student profile schema.");
}

export const mockStudents: StudentProfile[] = importedStudents;

interface JourneySeed extends Omit<Journey, "departureAt"> {
  departureOffsetMinutes: number;
}

const journeySeeds: JourneySeed[] = journeysJson;

export function getMockJourneys(departureAt: string): Journey[] {
  const departureMs = new Date(departureAt).getTime();

  if (!Number.isFinite(departureMs)) {
    throw new Error("A valid departure time is required to create mock journeys.");
  }

  return journeySeeds.map(({ departureOffsetMinutes, ...journey }) => ({
    ...journey,
    departureAt: new Date(
      departureMs + departureOffsetMinutes * 60_000,
    ).toISOString(),
  }));
}

function makeRouteContinuation(route: Journey["route"]): Journey["route"] {
  const points = route.map((point) => ({ ...point }));
  if (points.length < 2) {
    throw new Error("A sample ride needs at least two route points.");
  }

  const previous = points[points.length - 2];
  const destination = points[points.length - 1];
  const meanLatitude = ((previous.lat + destination.lat) / 2) * (Math.PI / 180);
  const northKm = (destination.lat - previous.lat) * (Math.PI / 180) * 6371;
  const eastKm =
    (destination.lng - previous.lng) *
    (Math.PI / 180) *
    6371 *
    Math.cos(meanLatitude);
  const segmentKm = Math.hypot(northKm, eastKm);

  if (segmentKm === 0) {
    throw new Error("A sample ride needs two different route points.");
  }

  const continuationKm = Math.min(8, Math.max(0.5, segmentKm * 0.08));
  const scale = continuationKm / segmentKm;
  points.push({
    lat: destination.lat + (destination.lat - previous.lat) * scale,
    lng: destination.lng + (destination.lng - previous.lng) * scale,
  });

  return points;
}

export function getJourneysForRoute(
  departureAt: string,
  requestedJourney: Pick<Journey, "origin" | "destination" | "route">,
): Journey[] {
  const baseJourneys = getMockJourneys(departureAt);
  const route = makeRouteContinuation(requestedJourney.route);

  return [
    ...baseJourneys,
    {
      id: "journey-flexible-demo",
      driverId: "student-simulated",
      origin: requestedJourney.origin,
      destination: route[route.length - 1],
      departureAt: new Date(
        new Date(departureAt).getTime() + 3 * 60_000,
      ).toISOString(),
      availableSeats: 2,
      route,
    },
  ];
}
