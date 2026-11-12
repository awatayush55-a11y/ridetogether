import { describe, expect, it } from "vitest";
import { getJourneysForRoute, getMockJourneys, mockStudents } from "../../data/mock";
import { locationChoices } from "../../data/mock/locations";
import { matchJourneys } from "./matchJourneys";
import type { Journey } from "../../types/domain";

const request: Journey = {
  id: "request",
  driverId: "rider",
  origin: { lat: 30, lng: 76 },
  destination: { lat: 30, lng: 76.2 },
  departureAt: "2026-11-10T09:00:00.000Z",
  availableSeats: 0,
  route: [
    { lat: 30, lng: 76 },
    { lat: 30, lng: 76.1 },
    { lat: 30, lng: 76.2 },
  ],
};

function offer(
  id: string,
  departureOffsetMinutes: number,
  route: Journey["route"] = [
    { lat: 30, lng: 76 },
    { lat: 30, lng: 76.1 },
    { lat: 30, lng: 76.2 },
    { lat: 30, lng: 76.3 },
  ],
): Journey {
  return {
    id,
    driverId: `student-${id}`,
    origin: route[0],
    destination: route[route.length - 1],
    departureAt: new Date(
      new Date(request.departureAt).getTime() +
        departureOffsetMinutes * 60_000,
    ).toISOString(),
    availableSeats: 2,
    route,
  };
}

describe("matchJourneys", () => {
  it("includes rides inside the default +/-20 minute window and excludes those outside", () => {
    const results = matchJourneys(request, [
      offer("inside", -20),
      offer("outside", 20.1),
    ]);

    expect(results.map((result) => result.journeyId)).toEqual(["inside"]);
  });

  it("requires pickup and drop-off to be within one kilometer of the offered route", () => {
    const tooFar = offer("too-far", 0, [
      { lat: 30.04, lng: 76 },
      { lat: 30.04, lng: 76.1 },
      { lat: 30.04, lng: 76.2 },
      { lat: 30.04, lng: 76.3 },
    ]);

    expect(matchJourneys(request, [tooFar])).toEqual([]);
  });

  it("ranks closer departure times higher and gives a readable route reason", () => {
    const results = matchJourneys(request, [
      offer("later", 15),
      offer("nearer", 2),
    ]);

    expect(results[0].journeyId).toBe("nearer");
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].reason).toMatch(/% route overlap, \d+ min detour/);
    expect(results[0].overlapRatio).toBeGreaterThan(0);
    expect(results[0].overlapRatio).toBeLessThanOrEqual(1);
  });

  it("rejects journeys travelling in the opposite direction", () => {
    const reverse = offer("reverse", 0, [
      { lat: 30, lng: 76.3 },
      { lat: 30, lng: 76.2 },
      { lat: 30, lng: 76.1 },
      { lat: 30, lng: 76 },
    ]);

    expect(matchJourneys(request, [reverse])).toEqual([]);
  });

  it("finds the seeded Patiala rides despite their different destinations", () => {
    const requestTime = "2026-11-10T09:00:00.000Z";
    const patialaRequest: Journey = {
      ...request,
      departureAt: requestTime,
      origin: { lat: 30.3421, lng: 76.3869 },
      destination: { lat: 30.5867, lng: 76.8461 },
      route: [
        { lat: 30.3421, lng: 76.3869 },
        { lat: 30.4818, lng: 76.5921 },
        { lat: 30.5867, lng: 76.8461 },
      ],
    };
    const results = matchJourneys(patialaRequest, getMockJourneys(requestTime));

    expect(results).toHaveLength(3);
    expect(new Set(mockStudents.map((student) => student.id)).size).toBe(4);
    expect(results.every((result) => result.reason.includes("route overlap"))).toBe(true);
  });

  it("provides at least one match for every distinct preset location pair", () => {
    const departureAt = "2026-11-10T09:00:00.000Z";
    const pairs = locationChoices.flatMap((origin) =>
      locationChoices
        .filter((destination) => destination.id !== origin.id)
        .map((destination) => ({ origin, destination })),
    );

    for (const { origin, destination } of pairs) {
      const requested: Journey = {
        ...request,
        origin: origin.coordinate,
        destination: destination.coordinate,
        departureAt,
        route: [
          origin.coordinate,
          {
            lat: (origin.coordinate.lat + destination.coordinate.lat) / 2,
            lng: (origin.coordinate.lng + destination.coordinate.lng) / 2,
          },
          destination.coordinate,
        ],
      };

      expect(
        matchJourneys(
          requested,
          getJourneysForRoute(departureAt, requested),
        ).some((result) => result.journeyId === "journey-flexible-demo"),
        `${origin.label} to ${destination.label}`,
      ).toBe(true);
    }
  });

  it("provides a match for custom pinned coordinates", () => {
    const departureAt = "2026-11-10T09:00:00.000Z";
    const requested: Journey = {
      ...request,
      departureAt,
      origin: { lat: 29.5, lng: 75.5 },
      destination: { lat: 31.2, lng: 77.1 },
      route: [
        { lat: 29.5, lng: 75.5 },
        { lat: 30.2, lng: 76.1 },
        { lat: 31.2, lng: 77.1 },
      ],
    };

    expect(
      matchJourneys(
        requested,
        getJourneysForRoute(departureAt, requested),
      ).some((result) => result.journeyId === "journey-flexible-demo"),
    ).toBe(true);
  });
});
