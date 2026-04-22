import { Link } from "react-router-dom";

export default function GlobalSeoSections() {
  const industries = ["Construction", "Real Estate", "IT & Software", "Retail", "Manufacturing"];

  return (
    <section className="bg-background py-12 lg:py-20" aria-label="Global service information">
      <div className="max-w-page mx-auto px-4 sm:px-6 space-y-12">
        <section>
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Our Global Services</h2>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base leading-relaxed">
            We help patients and families find safe, clean, and hospital-nearby stays. Our team also supports airport pickup,
            local travel, and daily care needs. We keep every step simple, fast, and clear in English.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Why Choose StayOnStay</h2>
          <div className="grid gap-3 sm:grid-cols-2 max-w-4xl">
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Experienced support team with medical travel understanding</p>
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Fast response on WhatsApp and phone</p>
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Affordable options for price-sensitive families</p>
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Premium comfort plans for business and private patients</p>
          </div>
        </section>

        <section>
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Our Services</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Medical Stay Accommodation</h3>
              <p className="text-sm text-muted-foreground">Verified hotels and apartments near top hospitals for treatment and recovery.</p>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Airport and Hospital Transfer</h3>
              <p className="text-sm text-muted-foreground">Safe pickup and drop support for patients, attendants, and family members.</p>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Care and Local Assistance</h3>
              <p className="text-sm text-muted-foreground">Easy help for food, medicine, translation needs, and local guidance.</p>
            </article>
          </div>
        </section>

        <section>
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Industries We Serve</h2>
          <ul className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <li key={industry} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                {industry}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Serving Clients Across Regions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">India</h3>
              <p className="text-sm text-muted-foreground">Helping startups and enterprises across India with trusted medical stay and support services.</p>
              <Link to="/services-in-india" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Explore India services
              </Link>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">UAE</h3>
              <p className="text-sm text-muted-foreground">Serving businesses and families in Dubai, Abu Dhabi, and other UAE cities with premium support.</p>
              <Link to="/services-in-uae" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Explore UAE services
              </Link>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Africa</h3>
              <p className="text-sm text-muted-foreground">Supporting growing markets in Nigeria, Kenya, Rwanda, Ghana, and more with affordable care plans.</p>
              <Link to="/services-in-africa" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Explore Africa services
              </Link>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Contact Us / Get a Quote</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Need a trusted medical stay provider for India, UAE, or Africa? Share your treatment city and dates. We will send
            a clear and free quote with the best available options.
          </p>
          <p className="mt-4 text-base font-semibold text-foreground">Get a Free Quote Today</p>
        </section>
      </div>
    </section>
  );
}
