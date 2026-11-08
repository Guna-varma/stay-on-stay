/** Curated Unsplash assets — compressed params for LCP-friendly hero & section imagery. */

/** Landing hero: bright, residential living space (natural light, calm) — reads as “place to rest,” not clinical care. Unsplash License. */
export const HERO_HEALTHCARE_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80&ixlib=rb-4.0.3";

export const HOTEL_SECTION_GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80",
    alt: "Bright recovery-friendly apartment living space near care facilities",
  },
  {
    src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80",
    alt: "Calm hotel suite interior suited for rest after treatment",
  },
  {
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    alt: "Comfortable bedroom with natural light for medical travelers",
  },
  {
    src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    alt: "Modern hospital corridor — care environment context",
  },
] as const;

export const SERVICE_CARD_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1586773860318-8a89e503f258?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
] as const;

export const CARE_TEAM_MEMBERS = [
  {
    image: "/team/img1.jpg",
    nameKey: "team.1.name",
    roleKey: "team.1.role",
    altKey: "team.1.alt",
  },
  {
    image: "/team/img2.jpg",
    nameKey: "team.2.name",
    roleKey: "team.2.role",
    altKey: "team.2.alt",
  },
] as const;

export const TESTIMONIAL_PORTRAITS: Record<string, string> = {
  "Aisha Mbabazi":
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80&facepad=2",
  "Rajesh Sharma":
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80&facepad=2",
  "Marie Uwimana":
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=80&facepad=2",
  "Carlos Mendez":
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80&facepad=2",
  "Fatima Al-Hassan":
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80&facepad=2",
  "Jean-Pierre Nkusi":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80&facepad=2",
};
