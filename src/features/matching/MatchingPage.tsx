import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { getJourneysForRoute, mockStudents } from "../../data/mock";
import { locationChoices, type LocationChoice } from "../../data/mock/locations";
import { matchJourneys } from "../../lib/matching/matchJourneys";
import type { Coordinate, Journey, MatchResult } from "../../types/domain";

const routeColorTokens = [
  "--color-route-main",
  "--color-route-one",
  "--color-route-two",
];

type LocationField = "origin" | "destination";

const initialOrigin = locationChoices.find((location) => location.id === "patiala")!;
const initialDestination = locationChoices.find((location) => location.id === "dera-bassi")!;

function toLocalInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function toLatLng(point: Coordinate): L.LatLngTuple {
  return [point.lat, point.lng];
}

interface RouteMapProps {
  request: Journey;
  offers: Journey[];
  matches: MatchResult[];
  focusedJourneyId: string;
  mapPickFor: LocationField | null;
  onPickMapLocation: (coordinate: Coordinate) => void;
}

function RouteMap({
  request,
  offers,
  matches,
  focusedJourneyId,
  mapPickFor,
  onPickMapLocation,
}: RouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapElement.current) return;

    const map = L.map(mapElement.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const bounds: L.LatLngExpression[] = [];
    const style = getComputedStyle(document.documentElement);
    const requestColor = style.getPropertyValue("--color-primary").trim();
    const surfaceColor = style.getPropertyValue("--color-surface").trim();

    offers.forEach((offer, index) => {
      const points = offer.route.map(toLatLng);
      bounds.push(...points);
      L.polyline(points, {
        color: style.getPropertyValue(routeColorTokens[index % routeColorTokens.length]).trim(),
        weight: offer.id === focusedJourneyId ? 5 : 3,
        opacity: offer.id === focusedJourneyId ? 0.95 : 0.52,
        interactive: false,
      }).addTo(map);
    });

    const requestPoints = request.route.map(toLatLng);
    bounds.push(...requestPoints);
    L.polyline(requestPoints, {
      color: requestColor,
      dashArray: "5 7",
      opacity: 0.7,
      weight: 2,
      interactive: false,
    }).addTo(map);

    [
      { coordinate: request.origin, label: "Your start" },
      { coordinate: request.destination, label: "Your destination" },
    ].forEach(({ coordinate, label }) => {
      L.circleMarker(toLatLng(coordinate), {
        color: requestColor,
        fillColor: surfaceColor,
        fillOpacity: 1,
        radius: 7,
        weight: 3,
        interactive: false,
      })
        .bindTooltip(label)
        .addTo(map);
    });

    matches.forEach((match) => {
      const isFocused = match.journeyId === focusedJourneyId;
      [match.pickup, match.dropoff].forEach((point) => {
        L.circleMarker(toLatLng(point), {
          color: requestColor,
          fillColor: surfaceColor,
          fillOpacity: 1,
          opacity: isFocused ? 1 : 0.55,
          radius: isFocused ? 8 : 6,
          weight: 3,
          interactive: false,
        }).addTo(map);
      });
    });

    map.getContainer().style.cursor = mapPickFor ? "crosshair" : "";
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (mapPickFor) {
        onPickMapLocation({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] });
    } else {
      map.setView(toLatLng(request.origin), 10);
    }

    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      map.remove();
    };
  }, [focusedJourneyId, mapPickFor, matches, offers, onPickMapLocation, request]);

  return <div className="route-map" ref={mapElement} aria-label="Map showing approximate shared routes" role="region" />;
}

function MatchCard({
  result,
  journey,
  index,
  active,
  requestSent,
  onSelect,
  onRequest,
}: {
  result: MatchResult;
  journey: Journey;
  index: number;
  active: boolean;
  requestSent: boolean;
  onSelect: () => void;
  onRequest: () => void;
}) {
  const student = mockStudents.find((item) => item.id === result.studentId);
  if (!student) {
    throw new Error(`Missing mock student for journey "${journey.id}".`);
  }

  const destinationLabels: Record<string, string> = {
    "journey-chandigarh": "Chandigarh",
    "journey-airport": "Chandigarh Airport",
    "journey-mohali": "Mohali",
    "journey-flexible-demo": "Continuing along your route",
  };

  return (
    <article className={`match-card${active ? " selected" : ""}`}>
      <button className="match-card-select" onClick={onSelect} type="button" aria-pressed={active}>
        <span className={`route-number route-number-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
        <span className="match-main">
          <span className="match-person-row">
            <strong>{student.name}</strong>
            {student.id === "student-simulated" ? (
              <span className="simulated-tag">Simulated example</span>
            ) : (
              <span className="verified-tag"><span aria-hidden="true">✓</span> Email marked verified</span>
            )}
          </span>
          <span className="match-destination">
            {journey.id === "journey-flexible-demo"
              ? destinationLabels[journey.id]
              : `Going to ${destinationLabels[journey.id] ?? "Chandigarh area"}`}
            {journey.id === "journey-flexible-demo" && (
              <span className="demo-match-tag">ROUTE-ADAPTED SAMPLE</span>
            )}
          </span>
          <span className="match-meta">
            <span>{formatTime(journey.departureAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{journey.availableSeats} seats</span>
            <span aria-hidden="true">·</span>
            <span>{result.reason}</span>
          </span>
        </span>
        <span className="match-score">{result.score}<small>/100</small></span>
      </button>
      <div className="match-card-bottom">
        <span className="verification-caveat">Email check is not a safety guarantee.</span>
        <button
          className={`secondary-button${requestSent ? " request-sent" : ""}`}
          onClick={onRequest}
          type="button"
          disabled={requestSent}
        >
          {requestSent ? "Request simulated" : "Request to join"}
        </button>
      </div>
    </article>
  );
}

export default function MatchingPage() {
  const [departureValue, setDepartureValue] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 15 * 60_000)),
  );
  const [focusedJourneyId, setFocusedJourneyId] = useState("journey-airport");
  const [requestedJourneyIds, setRequestedJourneyIds] = useState<string[]>([]);
  const [origin, setOrigin] = useState<LocationChoice>(initialOrigin);
  const [destination, setDestination] = useState<LocationChoice>(initialDestination);
  const [mapPickFor, setMapPickFor] = useState<LocationField | null>(null);
  const request = useMemo<Journey>(() => {
    const departureAt = new Date(departureValue);
    const sameAsSeededRoute =
      origin.id === initialOrigin.id && destination.id === initialDestination.id;
    const route = sameAsSeededRoute
      ? [
          origin.coordinate,
          { lat: 30.4818, lng: 76.5921 },
          destination.coordinate,
        ]
      : Array.from({ length: 5 }, (_, index) => {
          const progress = index / 4;
          return {
            lat:
              origin.coordinate.lat +
              (destination.coordinate.lat - origin.coordinate.lat) * progress,
            lng:
              origin.coordinate.lng +
              (destination.coordinate.lng - origin.coordinate.lng) * progress,
          };
        });

    return {
      id: "aanya-request",
      driverId: "student-aanya",
      origin: origin.coordinate,
      destination: destination.coordinate,
      departureAt: departureAt.toISOString(),
      availableSeats: 0,
      route,
    };
  }, [departureValue, destination, origin]);
  const offers = useMemo(
    () => getJourneysForRoute(request.departureAt, request),
    [request],
  );
  const matches = useMemo(() => matchJourneys(request, offers), [request, offers]);

  useEffect(() => {
    if (!matches.some((match) => match.journeyId === focusedJourneyId) && matches[0]) {
      setFocusedJourneyId(matches[0].journeyId);
    }
  }, [focusedJourneyId, matches]);

  const journeyById = new Map(offers.map((journey) => [journey.id, journey]));

  const handleMapPick = useCallback((coordinate: Coordinate) => {
    const label = `Pinned location (${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)})`;
    const selectedLocation: LocationChoice = {
      id: `pin-${coordinate.lat.toFixed(5)}-${coordinate.lng.toFixed(5)}`,
      label,
      coordinate,
    };

    if (mapPickFor === "origin") setOrigin(selectedLocation);
    if (mapPickFor === "destination") setDestination(selectedLocation);
    setMapPickFor(null);
  }, [mapPickFor]);

  function chooseLocation(field: LocationField, id: string) {
    const selected = locationChoices.find((location) => location.id === id);
    if (!selected) return;

    if (field === "origin") setOrigin(selected);
    else setDestination(selected);
    setMapPickFor(null);
  }

  function simulateJoinRequest(journeyId: string) {
    // Prototype-only confirmation: this does not contact a driver or server.
    setRequestedJourneyIds((current) =>
      current.includes(journeyId) ? current : [...current, journeyId],
    );
  }

  return (
    <div className="page-wrap matching-page">
      <section className="welcome-row match-welcome">
        <div>
          <p className="eyebrow">ROUTE-FIRST MATCHING <span>·</span> PATIALA</p>
          <h1>Find your shared stretch.</h1>
          <p className="page-subtitle">A different destination can still mean the same road.</p>
        </div>
        <label className="departure-control">
          <span>LEAVING AROUND</span>
          <input
            aria-label="Choose your requested departure time"
            type="datetime-local"
            value={departureValue}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (Number.isFinite(new Date(value).getTime())) setDepartureValue(value);
            }}
          />
        </label>
      </section>

      <section className="route-search-summary" aria-label="Your requested route">
        <div className="route-summary-point">
          <span className="route-origin-dot" />
          <label htmlFor="origin-location">
            <small>FROM</small>
            <select
              id="origin-location"
              value={locationChoices.some((location) => location.id === origin.id) ? origin.id : ""}
              onChange={(event) => chooseLocation("origin", event.currentTarget.value)}
            >
              {!locationChoices.some((location) => location.id === origin.id) && (
                <option value="">{origin.label}</option>
              )}
              {locationChoices.map((location) => (
                <option key={location.id} value={location.id}>{location.label}</option>
              ))}
            </select>
          </label>
        </div>
        <span className="route-summary-line" aria-hidden="true" />
        <div className="route-summary-point">
          <span className="route-destination-dot" />
          <label htmlFor="destination-location">
            <small>TO</small>
            <select
              id="destination-location"
              value={locationChoices.some((location) => location.id === destination.id) ? destination.id : ""}
              onChange={(event) => chooseLocation("destination", event.currentTarget.value)}
            >
              {!locationChoices.some((location) => location.id === destination.id) && (
                <option value="">{destination.label}</option>
              )}
              {locationChoices.map((location) => (
                <option key={location.id} value={location.id}>{location.label}</option>
              ))}
            </select>
          </label>
        </div>
        <span className="corridor-chip">Edit either location</span>
      </section>

      <section className="match-layout">
        <div className="matches-column">
          <div className="matches-heading">
            <div>
              <p className="eyebrow">YOUR ROUTE, WIDENED</p>
              <h2>{matches.length} student rides in range</h2>
            </div>
            <span className="window-chip">±20 min</span>
          </div>
          {matches.length > 0 ? (
            <div className="match-list">
              {matches.map((result, index) => {
                const journey = journeyById.get(result.journeyId);
                if (!journey) throw new Error(`Missing mock journey "${result.journeyId}".`);
                return (
                  <MatchCard
                    key={result.journeyId}
                    result={result}
                    journey={journey}
                    index={index}
                    active={focusedJourneyId === result.journeyId}
                    requestSent={requestedJourneyIds.includes(result.journeyId)}
                    onSelect={() => setFocusedJourneyId(result.journeyId)}
                    onRequest={() => simulateJoinRequest(result.journeyId)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="empty-matches">
              <span aria-hidden="true">⌁</span>
              <strong>No rides overlap this time.</strong>
              <p>Try a departure closer to one of the sample journeys.</p>
            </div>
          )}
          <p className="match-data-note">
            Sample journeys and verification labels are mock data; the route-adapted ride is generated for your selected locations. Email verification alone does not guarantee safety.
          </p>
        </div>

        <div className="map-column">
          <div className="map-heading">
            <div>
              <p className="eyebrow">SHARED ROADS, NOT SHARED DESTINATIONS</p>
              <h2>Route preview</h2>
            </div>
            <span className="map-live-tag"><span /> Sample map</span>
          </div>
          <div className="map-pick-controls">
            <span>Pick an exact point on the map:</span>
            <button
              className={`pin-location-button${mapPickFor === "origin" ? " active" : ""}`}
              onClick={() => setMapPickFor(mapPickFor === "origin" ? null : "origin")}
              type="button"
              aria-pressed={mapPickFor === "origin"}
            >
              Set start
            </button>
            <button
              className={`pin-location-button${mapPickFor === "destination" ? " active" : ""}`}
              onClick={() => setMapPickFor(mapPickFor === "destination" ? null : "destination")}
              type="button"
              aria-pressed={mapPickFor === "destination"}
            >
              Set destination
            </button>
            {mapPickFor && (
              <button className="cancel-pin-button" onClick={() => setMapPickFor(null)} type="button">
                Cancel
              </button>
            )}
          </div>
          {mapPickFor && (
            <p className="map-pick-instruction" aria-live="polite">
              Click the map to set your {mapPickFor === "origin" ? "starting point" : "destination"}.
            </p>
          )}
          <RouteMap
            request={request}
            offers={offers}
            matches={matches}
            focusedJourneyId={focusedJourneyId}
            mapPickFor={mapPickFor}
            onPickMapLocation={handleMapPick}
          />
          <div className="map-legend" aria-label="Map legend">
            <span><i className="legend-dash" /> Your requested stretch</span>
            <span><i className="legend-point" /> Approximate meetup area</span>
          </div>
          <p className="approximate-note">
            Route line is a straight-line preview, not turn-by-turn directions. Pickup points are approximate; exact meetup details stay hidden until a ride is confirmed.
          </p>
        </div>
      </section>
      <div className="prototype-toast" aria-live="polite">
        {requestedJourneyIds.length > 0
          ? "Join request simulated locally — no message was sent."
          : "Prototype only · no rides or requests are live"}
      </div>
    </div>
  );
}
