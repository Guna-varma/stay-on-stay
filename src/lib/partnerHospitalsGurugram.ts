/** Medanta → Artemis → Fortis → Max → Manipal → Paras (Gurugram). Photos: `public/images-service`. */
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

function localHospitalImage(filename: string): string {
  const base = import.meta.env.BASE_URL;
  const path = `images-service/${filename}`;
  return base.endsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export const GURUGRAM_PARTNER_HOSPITALS: GurugramPartnerHospital[] = [
  {
    name: "Medanta – The Medicity",
    location: "Sector 38, Gurugram, India",
    rating: 4.9,
    specialty: "Cardiac, neurology & multi-specialty",
    accreditation: "JCI",
    image: localHospitalImage("medanta.webp"),
    websiteUrl: "https://www.medanta.org/",
  },
  {
    name: "Artemis Hospital",
    location: "Sector 51, Gurugram, India",
    rating: 4.8,
    specialty: "Multi-specialty",
    accreditation: "JCI",
    image: localHospitalImage("artemis.jpg"),
    websiteUrl: "https://www.artemishospitals.com/",
  },
  {
    name: "Fortis Memorial Research Institute",
    location: "Sector 44, Gurugram, India",
    rating: 4.8,
    specialty: "Oncology, transplants & quaternary care",
    accreditation: "JCI",
    image: localHospitalImage("fortis.webp"),
    websiteUrl: "https://www.fortishealthcare.com/hospitals/fortis-memorial-research-institute-gurgaon",
  },
  {
    name: "Max Super Speciality Hospital, Gurugram",
    location: "Sector 56, Gurugram, India",
    rating: 4.7,
    specialty: "Multi-specialty",
    accreditation: "JCI",
    image: localHospitalImage("max.png"),
    websiteUrl: "https://www.maxhealthcare.in/hospitals/gurugram/hospital",
  },
  {
    name: "Manipal Hospital, Gurugram",
    location: "Sector 23A, Gurugram, India",
    rating: 4.7,
    specialty: "Multi-specialty & emergency care",
    accreditation: "NABH",
    image: localHospitalImage("manipal.png"),
    websiteUrl: "https://www.manipalhospitals.com/gurugram/",
  },
  {
    name: "Paras Hospital",
    location: "Sector 43, Gurugram, India",
    rating: 4.6,
    specialty: "Orthopedics, neurology & multi-specialty",
    accreditation: "NABH",
    image: localHospitalImage("paras.jpg"),
    websiteUrl: "https://www.parashospitals.com/",
  },
];
