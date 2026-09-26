export type LocalShoreHub = {
  code: string;
  city: "Coimbatore" | "Bengaluru";
  name: string;
  latitude: number;
  longitude: number;
  focus: string;
};

export const LOCALSHORE_HUBS: LocalShoreHub[] = [
  {
    code: "CBE-01",
    city: "Coimbatore",
    name: "Gandhipuram",
    latitude: 11.0168,
    longitude: 76.9558,
    focus: "Gandhipuram, RS Puram, Town Hall, Ukkadam, Saibaba Colony",
  },
  {
    code: "CBE-02",
    city: "Coimbatore",
    name: "Saravanampatti",
    latitude: 11.081,
    longitude: 77.0,
    focus: "Ganapathy, Saravanampatti, Thudiyalur, Kovilmedu",
  },
  {
    code: "CBE-03",
    city: "Coimbatore",
    name: "Peelamedu",
    latitude: 11.03,
    longitude: 77.0,
    focus: "Hope College, Kalapatti, Vilankurichi, Uppilipalayam, Chinniampalayam",
  },
  {
    code: "CBE-04",
    city: "Coimbatore",
    name: "Singanallur",
    latitude: 11.0,
    longitude: 77.03,
    focus: "Ramanathapuram, Ondipudur, Trichy Road, Podanur, Sundarapuram",
  },
  {
    code: "CBE-05",
    city: "Coimbatore",
    name: "Vadavalli",
    latitude: 11.02,
    longitude: 76.88,
    focus: "Vadavalli, Marudamalai Road, Perur, Kovaipudur, Kuniyamuthur",
  },
  {
    code: "BLR-01",
    city: "Bengaluru",
    name: "Central · Majestic / Kempegowda",
    latitude: 12.9763,
    longitude: 77.5713,
    focus: "Majestic, Shivajinagar, MG Road, Richmond Town, Vasanth Nagar",
  },
  {
    code: "BLR-02",
    city: "Bengaluru",
    name: "East · Whitefield",
    latitude: 12.9698,
    longitude: 77.75,
    focus: "Whitefield, Hoodi, ITPL, Kadugodi, Mahadevapura",
  },
  {
    code: "BLR-03",
    city: "Bengaluru",
    name: "South-East · Marathahalli / Bellandur",
    latitude: 12.9352,
    longitude: 77.6899,
    focus: "Bellandur, Marathahalli, HSR Layout, Sarjapur Road, Koramangala",
  },
  {
    code: "BLR-04",
    city: "Bengaluru",
    name: "South · Jayanagar",
    latitude: 12.925,
    longitude: 77.5938,
    focus: "Jayanagar, JP Nagar, Banashankari, Basavanagudi, Kumaraswamy Layout",
  },
  {
    code: "BLR-05",
    city: "Bengaluru",
    name: "South-West · Rajarajeshwari Nagar",
    latitude: 12.9121,
    longitude: 77.5199,
    focus: "RR Nagar, Kengeri, Uttarahalli, Nagarbhavi, Mysore Road corridor",
  },
  {
    code: "BLR-06",
    city: "Bengaluru",
    name: "West · Rajajinagar",
    latitude: 12.991,
    longitude: 77.552,
    focus: "Rajajinagar, Vijayanagar, Basaveshwaranagar, Peenya, Magadi Road",
  },
  {
    code: "BLR-07",
    city: "Bengaluru",
    name: "North · Yelahanka",
    latitude: 13.1007,
    longitude: 77.5963,
    focus: "Yelahanka, Hebbal, Jakkur, Vidyaranyapura, Thanisandra",
  },
  {
    code: "BLR-08",
    city: "Bengaluru",
    name: "North-East · Hennur / Kalyan Nagar",
    latitude: 13.0298,
    longitude: 77.6467,
    focus: "Hennur, Banaswadi, Kalyan Nagar, Horamavu, Ramamurthy Nagar",
  },
];

export function getNearestLocalShoreHub(latitude?: number, longitude?: number) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return (
    LOCALSHORE_HUBS.reduce<{ hub: LocalShoreHub; distance: number } | null>((nearest, hub) => {
      const distance = (hub.latitude - latitude) ** 2 + (hub.longitude - longitude) ** 2;
      if (!nearest || distance < nearest.distance) return { hub, distance };
      return nearest;
    }, null)?.hub ?? null
  );
}
