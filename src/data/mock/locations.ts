import type { Coordinate } from "../../types/domain";

export interface LocationChoice {
  id: string;
  label: string;
  coordinate: Coordinate;
}

export const locationChoices: LocationChoice[] = [
  { id: "patiala", label: "Patiala", coordinate: { lat: 30.3421, lng: 76.3869 } },
  { id: "rajpura", label: "Rajpura", coordinate: { lat: 30.4818, lng: 76.5921 } },
  { id: "ambala", label: "Ambala", coordinate: { lat: 30.3752, lng: 76.7821 } },
  { id: "dera-bassi", label: "Dera Bassi", coordinate: { lat: 30.5867, lng: 76.8461 } },
  { id: "zirakpur", label: "Zirakpur", coordinate: { lat: 30.6428, lng: 76.8172 } },
  { id: "chandigarh", label: "Chandigarh · Sector 17", coordinate: { lat: 30.7412, lng: 76.7681 } },
  { id: "airport", label: "Chandigarh Airport", coordinate: { lat: 30.6734, lng: 76.7885 } },
  { id: "mohali", label: "Mohali", coordinate: { lat: 30.7046, lng: 76.7178 } },
  { id: "ludhiana", label: "Ludhiana", coordinate: { lat: 30.901, lng: 75.8573 } },
  { id: "jalandhar", label: "Jalandhar", coordinate: { lat: 31.326, lng: 75.5762 } },
  { id: "delhi", label: "New Delhi", coordinate: { lat: 28.6139, lng: 77.209 } },
];
