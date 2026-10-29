import type { Metadata } from "next";
import { copy } from "@content/copy.ka";
import { EventTypes } from "@/components/marketing/event-types";
import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Problem } from "@/components/marketing/problem";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { TemplateDemo } from "@/components/marketing/template-demo";
import { Testimonials } from "@/components/marketing/testimonials";
import { formatPrice, formatPriceShort, listedPrice } from "@/lib/payments/price";
import { shownReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: { absolute: copy.meta.homeTitle },
  description: copy.meta.description,
  alternates: { canonical: "/" },
  openGraph: { title: copy.meta.homeTitle, description: copy.meta.description, url: "/" },
};

export default function HomePage() {
  const price = listedPrice();
  const reviews = shownReviews();

  return (
    <div className="overflow-x-clip">
      <SiteHeader />
      <main>
        <Hero reviews={reviews} price={formatPriceShort(price)} />
        <Problem />
        <HowItWorks />
        <EventTypes />
        <Features />
        <TemplateDemo />
        <Testimonials reviews={reviews} />
        <Pricing price={formatPriceShort(price)} />
        <Faq price={formatPrice(price)} />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
