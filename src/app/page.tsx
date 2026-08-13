import { Hero } from "@/components/landing/Hero";
import { ForecastSimulatorWidget } from "@/components/landing/ForecastSimulatorWidget";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export default function LandingPage() {
  return (
    <main className="bg-canvas">
      <Hero />

      <ScrollReveal className="px-6 py-24">
        <ForecastSimulatorWidget />
      </ScrollReveal>

      <ScrollReveal>
        <Features />
      </ScrollReveal>

      <ScrollReveal className="px-6 py-4">
        <ROICalculator />
      </ScrollReveal>

      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>

      <LandingFooter />
    </main>
  );
}
