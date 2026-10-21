/**
 * Pantry LK's factory, as listed on Google Maps ("Pantry LK (Pvt) Ltd", furniture manufacturer).
 * Used for the address on the site and for local-business structured data, so the name, address
 * and map pin match the Google listing exactly.
 */
export const FACTORY = {
  name: "Pantry LK (Pvt) Ltd",
  street: "248 Aguruwathota Road",
  locality: "Bandaragama",
  district: "Kalutara",
  region: "Western Province",
  postalCode: "12530",
  country: "LK",
  lat: 6.716722,
  lng: 80.0142648,
  plusCode: "P287+MP Bandaragama",
  mapUrl: "https://maps.app.goo.gl/AmypXMnGY2ShRuwJA",
} as const;

export const FACTORY_ADDRESS = `${FACTORY.street}, ${FACTORY.locality} ${FACTORY.postalCode}, Sri Lanka`;

/** Map embed for the contact page (loaded only when the visitor asks for it). */
export const FACTORY_MAP_EMBED = `https://www.google.com/maps?q=${FACTORY.lat},${FACTORY.lng}&z=15&output=embed`;
