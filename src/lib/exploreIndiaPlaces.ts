/**
 * Curated Delhi NCR + ~200 km highlights for the Explore India page.
 * Images: Unsplash (+ Pexels where noted). Use `w=900&auto=format&fit=crop&ixlib=rb-4.0.3` on Unsplash
 * so URLs stay valid when photos are re-indexed.
 */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop&ixlib=rb-4.0.3`;
export type ExploreCategory =
  | "heritage"
  | "spiritual"
  | "markets"
  | "parks"
  | "food"
  | "weekend";

export interface ExplorePlace {
  id: string;
  name: string;
  region: string;
  category: ExploreCategory;
  tagline: string;
  /** Representative photo */
  image: string;
  /** Rough from central Delhi */
  distance?: string;
}

export const EXPLORE_CATEGORIES: { id: ExploreCategory; labelKey: string }[] = [
  { id: "heritage", labelKey: "explore.cat.heritage" },
  { id: "spiritual", labelKey: "explore.cat.spiritual" },
  { id: "markets", labelKey: "explore.cat.markets" },
  { id: "parks", labelKey: "explore.cat.parks" },
  { id: "food", labelKey: "explore.cat.food" },
  { id: "weekend", labelKey: "explore.cat.weekend" },
];

/** Hero mosaic + carousel priority order (iconic, photogenic). */
export const exploreIndiaPlaces: ExplorePlace[] = [
  {
    id: "taj",
    name: "Taj Mahal",
    region: "Agra, UP",
    category: "heritage",
    tagline: "Sunrise marble glow — India’s most celebrated UNESCO wonder.",
    image: U("1564507592333-c60657eea523"),
    distance: "~205 km · day trip",
  },
  {
    id: "qutub",
    name: "Qutub Minar",
    region: "Mehrauli, Delhi",
    category: "heritage",
    tagline: "12th-century minaret & Indo-Islamic carvings.",
    image: U("1716747713381-ebdd06319cdd"),
    distance: "~15 km",
  },
  {
    id: "red-fort",
    name: "Red Fort",
    region: "Old Delhi",
    category: "heritage",
    tagline: "Mughal fortress walls — sound & light after dusk.",
    image: U("1744979197022-f9f70e8a9402"),
    distance: "~5 km",
  },
  {
    id: "humayun",
    name: "Humayun’s Tomb",
    region: "Nizamuddin, Delhi",
    category: "heritage",
    tagline: "Garden tomb that inspired the Taj.",
    image: U("1637072286375-60a9859123cc"),
    distance: "~10 km",
  },
  {
    id: "india-gate",
    name: "India Gate",
    region: "Central Delhi",
    category: "heritage",
    tagline: "Evening strolls & lawns under the arch.",
    image: U("1596601133894-f5acb46b3732"),
    distance: "~4 km",
  },
  {
    id: "lotus",
    name: "Lotus Temple",
    region: "Kalkaji, Delhi",
    category: "spiritual",
    tagline: "Lotus-shaped hall open to all faiths.",
    image: U("1668971786470-441d20a8fdca"),
    distance: "~8 km",
  },
  {
    id: "akshardham",
    name: "Akshardham",
    region: "East Delhi",
    category: "spiritual",
    tagline: "Stone carvings, gardens & evening water show.",
    image: U("1697192047329-fa74f6a95dc2"),
    distance: "~15 km",
  },
  {
    id: "jama",
    name: "Jama Masjid",
    region: "Old Delhi",
    category: "spiritual",
    tagline: "Grand courtyard mosque — Old Delhi at its fullest.",
    image: U("1549526725-5c188c251c37"),
    distance: "~5 km",
  },
  {
    id: "bangla-sahib",
    name: "Gurudwara Bangla Sahib",
    region: "Connaught Place",
    category: "spiritual",
    tagline: "Golden dome, sacred sarovar & langar.",
    image: U("1615922091967-f977f13ea9a8"),
    distance: "~6 km",
  },
  {
    id: "chandni",
    name: "Chandni Chowk",
    region: "Old Delhi",
    category: "markets",
    tagline: "Lanes of spice, silver, weddings & street chaat.",
    image: U("1643194928449-a7d88050afb5"),
    distance: "~5 km",
  },
  {
    id: "cp",
    name: "Connaught Place",
    region: "New Delhi",
    category: "markets",
    tagline: "Colonial arcades, books & nightlife.",
    image: U("1710992119019-b8fd3651fc8e"),
    distance: "Central",
  },
  {
    id: "dilli-haat",
    name: "Dilli Haat",
    region: "INA, Delhi",
    category: "markets",
    tagline: "State crafts & regional food stalls.",
    image: U("1611652022419-a9419f74343d"),
    distance: "~7 km",
  },
  {
    id: "cyber-hub",
    name: "DLF Cyber Hub",
    region: "Gurugram",
    category: "markets",
    tagline: "Dining & microbreweries after hospital visits.",
    image: U("1514933651103-005eec06c04b"),
    distance: "~25 km",
  },
  {
    id: "lodhi",
    name: "Lodhi Gardens",
    region: "South Delhi",
    category: "parks",
    tagline: "Tombs, joggers & open-air calm.",
    image: U("1642595012740-ff3cc4b1164a"),
    distance: "~10 km",
  },
  {
    id: "sunder",
    name: "Sunder Nursery",
    region: "Near Humayun’s Tomb",
    category: "parks",
    tagline: "Mughal-era garden restoration & birdlife.",
    image: U("1661696716329-0d4ecf2e6a8e"),
    distance: "~10 km",
  },
  {
    id: "sultanpur",
    name: "Sultanpur Bird Sanctuary",
    region: "Gurugram dist.",
    category: "parks",
    tagline: "Winter migratory birds & boardwalks.",
    image: U("1444464666168-49d633b86797"),
    distance: "~50 km",
  },
  {
    id: "paranthe",
    name: "Paranthe Wali Gali",
    region: "Chandni Chowk",
    category: "food",
    tagline: "Stuffed parathas since generations.",
    image: U("1601050690597-df0568f70950"),
    distance: "~5 km",
  },
  {
    id: "khan",
    name: "Khan Market",
    region: "New Delhi",
    category: "food",
    tagline: "Cafés, rolls & upscale bites.",
    image: U("1555396273-367ea4eb4db5"),
    distance: "~8 km",
  },
  {
    id: "majnu",
    name: "Majnu ka Tila",
    region: "North Delhi",
    category: "food",
    tagline: "Tibetan momos & riverside lanes.",
    image: U("1563245372-f21724e3856d"),
    distance: "~12 km",
  },
  {
    id: "agra-fort",
    name: "Agra Fort",
    region: "Agra, UP",
    category: "heritage",
    tagline: "Red sandstone seat of Mughal power.",
    image: U("1544735716-392fe2489ffa"),
    distance: "~205 km",
  },
  {
    id: "neemrana",
    name: "Neemrana Fort Palace",
    region: "Alwar, Rajasthan",
    category: "weekend",
    tagline: "Heritage ramparts & sunset views.",
    image: U("1520250497591-112f2f40a3f4"),
    distance: "~122 km",
  },
  {
    id: "mathura",
    name: "Mathura & Vrindavan",
    region: "UP",
    category: "weekend",
    tagline: "Krishna ghats, temples & festival colour.",
    image: U("1602216056096-3b40cc0c9944"),
    distance: "~150 km",
  },
  {
    id: "bharatpur",
    name: "Keoladeo National Park",
    region: "Bharatpur, Rajasthan",
    category: "weekend",
    tagline: "UNESCO wetlands — cycle rickshaw birding.",
    image:
      "https://images.pexels.com/photos/2132126/pexels-photo-2132126.jpeg?auto=compress&cs=tinysrgb&w=900",
    distance: "~180 km",
  },
  {
    id: "damdama",
    name: "Damdama Lake",
    region: "Gurugram",
    category: "weekend",
    tagline: "Aravalli lake day-out & adventure options.",
    image: U("1506905925346-21bda4d32df4"),
    distance: "~38 km",
  },
  {
    id: "hauz",
    name: "Hauz Khas Village",
    region: "South Delhi",
    category: "heritage",
    tagline: "Reservoir ruins meet cafés & galleries.",
    image: U("1747491746369-1a7ee2f2e825"),
    distance: "~14 km",
  },
  {
    id: "baoli",
    name: "Agrasen ki Baoli",
    region: "Connaught Place",
    category: "heritage",
    tagline: "Stepwell depth & light — a quick heritage stop.",
    image: U("1638183209148-e87c0c9bb6f4"),
    distance: "~3 km",
  },
  {
    id: "okhla-bird",
    name: "Okhla Bird Sanctuary",
    region: "Noida",
    category: "parks",
    tagline: "Yamuna wetlands in the city’s east.",
    image:
      "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=900",
    distance: "~25 km",
  },
  {
    id: "jantar",
    name: "Jantar Mantar",
    region: "Connaught Place",
    category: "heritage",
    tagline: "Giant sundials — Jai Singh’s observatory.",
    image: U("1582706342618-4417db3adfc5"),
    distance: "~3 km",
  },
];

export function placesByCategory(cat: ExploreCategory | "all"): ExplorePlace[] {
  if (cat === "all") return exploreIndiaPlaces;
  return exploreIndiaPlaces.filter((p) => p.category === cat);
}
