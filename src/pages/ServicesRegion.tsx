import { useEffect } from "react";
import { Link } from "react-router-dom";

type ServicesRegionProps = {
  region: "india" | "uae" | "africa";
};

const regionContent = {
  india: {
    regionLabel: "India",
    langTag: "en-IN",
    title: "Medical Stay Services in India",
    description:
      "Affordable and trusted medical stay support across India. Find hospital-nearby hotels, travel support, and simple patient assistance.",
    keywords: "best medical stay company in India, affordable medical stay India, patient hotel booking India",
    intro:
      "We support startups, families, and enterprises across India with safe accommodation near leading hospitals.",
    examples: "Popular cities: Delhi NCR, Mumbai, Chennai, Hyderabad, Bengaluru.",
  },
  uae: {
    regionLabel: "UAE",
    langTag: "en-AE",
    title: "Medical Stay Services in UAE",
    description:
      "Premium and reliable medical stay services in UAE. Book quality accommodation and get fast business-grade support.",
    keywords: "medical stay services in UAE, premium patient stay UAE, healthcare travel support Dubai Abu Dhabi",
    intro:
      "We support patients and business families in UAE with premium stay and transport coordination.",
    examples: "Popular cities: Dubai, Abu Dhabi, Sharjah, Ajman.",
  },
  africa: {
    regionLabel: "Africa",
    langTag: "en",
    title: "Affordable Medical Stay Services in Africa",
    description:
      "Simple and affordable medical stay support for African patients and families. Fast response, clear communication, and trusted options.",
    keywords: "affordable medical stay Africa, patient stay support Africa, healthcare travel services Africa",
    intro:
      "We support growing markets in Africa with clear pricing, mobile-first support, and easy booking.",
    examples: "Popular markets: Nigeria, Kenya, Rwanda, Ghana, Uganda, South Africa.",
  },
} as const;

export default function ServicesRegion({ region }: ServicesRegionProps) {
  const content = regionContent[region];
  const siteUrl = "https://www.stayonstay.com";
  const currentUrl = `${siteUrl}/services-in-${region}`;

  useEffect(() => {
    document.title = `${content.title} | StayOnStay`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", content.description);
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", content.keywords);
    }

    const upsertLinkTag = (selector: string, attrs: Record<string, string>) => {
      let node = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!node) {
        node = document.createElement("link");
        document.head.appendChild(node);
      }
      Object.entries(attrs).forEach(([key, value]) => {
        node!.setAttribute(key, value);
      });
    };

    upsertLinkTag('link[rel="canonical"]', { rel: "canonical", href: currentUrl });
    upsertLinkTag('link[data-hreflang="x-default"]', {
      rel: "alternate",
      href: `${siteUrl}/`,
      hreflang: "x-default",
      "data-hreflang": "x-default",
    });
    upsertLinkTag('link[data-hreflang="en-IN"]', {
      rel: "alternate",
      href: `${siteUrl}/services-in-india`,
      hreflang: "en-IN",
      "data-hreflang": "en-IN",
    });
    upsertLinkTag('link[data-hreflang="en-AE"]', {
      rel: "alternate",
      href: `${siteUrl}/services-in-uae`,
      hreflang: "en-AE",
      "data-hreflang": "en-AE",
    });
    upsertLinkTag('link[data-hreflang="en"]', {
      rel: "alternate",
      href: `${siteUrl}/services-in-africa`,
      hreflang: "en",
      "data-hreflang": "en",
    });

    let serviceSchema = document.getElementById("services-region-schema");
    if (!serviceSchema) {
      serviceSchema = document.createElement("script");
      serviceSchema.id = "services-region-schema";
      serviceSchema.setAttribute("type", "application/ld+json");
      document.head.appendChild(serviceSchema);
    }

    serviceSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      name: content.title,
      serviceType: "Medical stay accommodation and patient travel support",
      provider: {
        "@type": "Organization",
        name: "StayOnStay",
        url: `${siteUrl}/`,
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: content.regionLabel,
      },
      audience: {
        "@type": "Audience",
        audienceType: "Patients, attendants, and medical travel families",
      },
      url: currentUrl,
      description: content.description,
    });

    return () => {
      const currentCanonical = document.head.querySelector('link[rel="canonical"]');
      if (currentCanonical?.getAttribute("href") === currentUrl) {
        currentCanonical.setAttribute("href", `${siteUrl}/`);
      }
      if (serviceSchema && serviceSchema.parentElement) {
        serviceSchema.parentElement.removeChild(serviceSchema);
      }
    };
  }, [content.description, content.keywords, content.langTag, content.regionLabel, content.title, currentUrl, siteUrl]);

  return (
    <main className="min-h-screen bg-background py-12 lg:py-20">
      <div className="max-w-page mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">{content.title}</h1>
        <p className="text-base text-muted-foreground max-w-3xl leading-relaxed mb-4">{content.description}</p>
        <p className="text-sm text-muted-foreground mb-2">{content.intro}</p>
        <p className="text-sm text-muted-foreground mb-10">{content.examples}</p>

        <section className="grid gap-4 sm:grid-cols-3 mb-10">
          <article className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-2">Hospital Nearby Stay</h2>
            <p className="text-sm text-muted-foreground">Book verified hotels and apartments near treatment centers.</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-2">Travel and Transfer</h2>
            <p className="text-sm text-muted-foreground">Get pickup, drop, and local transport support.</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-2">Patient Support</h2>
            <p className="text-sm text-muted-foreground">Receive fast WhatsApp and phone support in simple English.</p>
          </article>
        </section>

        <Link
          to="/#contact"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get a Free Quote Today
        </Link>
      </div>
    </main>
  );
}
