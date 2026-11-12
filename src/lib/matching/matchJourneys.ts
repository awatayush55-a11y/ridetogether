import nearestPointOnLine from "@turf/nearest-point-on-line";
import type { Feature, LineString } from "geojson";
import type { Coordinate, Journey, MatchResult } from "../../types/domain";

const EARTH_RADIUS_KM = 6371.0088;

export interface MatchOptions {
  departureWindowMinutes?: number;
  maxRouteDistanceKm?: number;
  averageSpeedKmh?: number;
}

interface Projection {
  point: Coordinate;
  distanceKm: number;
  alongKm: number;
}

function toLine(route: Coordinate[]): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route.map(({ lng, lat }) => [lng, lat]),
    },
  };
}

function projectPoint(route: Feature<LineString>, point: Coordinate): Projection {
  const nearest = nearestPointOnLine(route, [point.lng, point.lat], {
    units: "kilometers",
  });

  return {
    point: { lat: nearest.geometry.coordinates[1], lng: nearest.geometry.coordinates[0] },
    distanceKm: nearest.properties.pointDistance,
    alongKm: nearest.properties.totalDistance,
  };
}

function distanceKm(from: Coordinate, to: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = radians(to.lat - from.lat);
  const lngDelta = radians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function routeLength(route: Coordinate[]): number {
  return route.slice(1).reduce(
    (total, point, index) => total + distanceKm(route[index], point),
    0,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function matchJourneys(
  request: Journey,
  offers: Journey[],
  options: MatchOptions = {},
): MatchResult[] {
  const departureWindowMinutes = options.departureWindowMinutes ?? 20;
  const maxRouteDistanceKm = options.maxRouteDistanceKm ?? 1;
  const averageSpeedKmh = options.averageSpeedKmh ?? 25;

  if (request.route.length < 2) {
    throw new Error("The requested journey must include at least two route points.");
  }
  if (departureWindowMinutes <= 0 || maxRouteDistanceKm <= 0 || averageSpeedKmh <= 0) {
    throw new Error("Matching thresholds must be positive numbers.");
  }

  const requestDepartureMs = new Date(request.departureAt).getTime();
  if (!Number.isFinite(requestDepartureMs)) {
    throw new Error("The requested journey must have a valid departure time.");
  }

  const requestLengthKm = routeLength(request.route);
  const results: MatchResult[] = [];

  for (const offer of offers) {
    if (offer.id === request.id || offer.route.length < 2) continue;

    const offerDepartureMs = new Date(offer.departureAt).getTime();
    if (!Number.isFinite(offerDepartureMs)) {
      throw new Error(`Journey "${offer.id}" must have a valid departure time.`);
    }

    const departureDeltaMinutes =
      Math.abs(offerDepartureMs - requestDepartureMs) / 60_000;
    if (departureDeltaMinutes > departureWindowMinutes) continue;

    const offerLine = toLine(offer.route);
    const pickupProjection = projectPoint(offerLine, request.origin);
    const dropoffProjection = projectPoint(offerLine, request.destination);

    if (
      pickupProjection.distanceKm > maxRouteDistanceKm ||
      dropoffProjection.distanceKm > maxRouteDistanceKm ||
      dropoffProjection.alongKm <= pickupProjection.alongKm
    ) {
      continue;
    }

    const offerLengthKm = routeLength(offer.route);
    if (offerLengthKm === 0 || requestLengthKm === 0) continue;

    const sharedDistanceKm = dropoffProjection.alongKm - pickupProjection.alongKm;
    const overlapRatio = clamp(sharedDistanceKm / offerLengthKm, 0, 1);
    const detourDistanceKm =
      2 * (pickupProjection.distanceKm + dropoffProjection.distanceKm);
    const detourMinutes = Math.round((detourDistanceKm / averageSpeedKmh) * 60);
    const timingScore =
      20 * (1 - departureDeltaMinutes / departureWindowMinutes);
    const proximityScore =
      10 *
      (1 -
        (pickupProjection.distanceKm + dropoffProjection.distanceKm) /
          (2 * maxRouteDistanceKm));
    const score = Math.round(
      clamp(overlapRatio * 70 + timingScore + proximityScore, 0, 100),
    );
    const overlapPercent = Math.round(overlapRatio * 100);

    results.push({
      journeyId: offer.id,
      studentId: offer.driverId,
      score,
      overlapRatio,
      detourMinutes,
      pickup: pickupProjection.point,
      dropoff: dropoffProjection.point,
      reason: `${overlapPercent}% route overlap, ${detourMinutes} min detour`,
    });
  }

  return results.sort((left, right) => right.score - left.score);
}
