/** Medanta → Artemis → Fortis → Max → Paras (Gurugram). Used on /med-tourism hero strip + hospitals anchor. */
export type GurugramPartnerHospital = {
  name: string;
  /** Kept for admin / SEO; optional to show in UI */
  location: string;
  rating: number;
  specialty: string;
  accreditation: string;
  image: string;
  /** Official hospital site (opens in new tab from “See more details”) */
  websiteUrl: string;
};

export const GURUGRAM_PARTNER_HOSPITALS: GurugramPartnerHospital[] = [
  {
    name: "Medanta – The Medicity",
    location: "Sector 38, Gurugram, India",
    rating: 4.9,
    specialty: "Cardiac, neurology & multi-specialty",
    accreditation: "JCI",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=960&q=80&auto=format&fit=crop",
    websiteUrl: "https://www.medanta.org/",
  },
  {
    name: "Artemis Hospital",
    location: "Sector 51, Gurugram, India",
    rating: 4.8,
    specialty: "Multi-specialty",
    accreditation: "JCI",
    image:
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=960&q=80&auto=format&fit=crop",
    websiteUrl: "https://www.artemishospitals.com/",
  },
  {
    name: "Fortis Memorial Research Institute",
    location: "Sector 44, Gurugram, India",
    rating: 4.8,
    specialty: "Oncology, transplants & quaternary care",
    accreditation: "JCI",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=960&q=80&auto=format&fit=crop",
    websiteUrl: "https://www.fortishealthcare.com/hospitals/fortis-memorial-research-institute-gurgaon",
  },
  {
    name: "Max Super Speciality Hospital, Gurugram",
    location: "Sector 56, Gurugram, India",
    rating: 4.7,
    specialty: "Multi-specialty",
    accreditation: "JCI",
    image:
      "https://images.unsplash.com/photo-1551076805-e1869783b561?w=960&q=80&auto=format&fit=crop",
    websiteUrl: "https://www.maxhealthcare.in/hospitals/gurugram/hospital",
  },
  {
    name: "Paras Hospital",
    location: "Sector 43, Gurugram, India",
    rating: 4.6,
    specialty: "Orthopedics, neurology & multi-specialty",
    accreditation: "NABH",
    image:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=960&q=80&auto=format&fit=crop",
    websiteUrl: "https://www.parashospitals.com/",
  },
];
