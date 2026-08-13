const TESTIMONIALS = [
  {
    quote: "We stopped finding out we were out of stock from angry customers instead of a dashboard.",
    name: "Aditi R.",
    role: "Operations Lead, Aurora Retail Co.",
  },
  {
    quote: "The what-if simulator talked us out of over-ordering before a sale that never spiked as hard as we guessed.",
    name: "Marcus T.",
    role: "Founder, Northline Goods",
  },
  {
    quote: "Reorder suggestions that actually account for lead time saved us from two stockouts in the first month.",
    name: "Priya K.",
    role: "Inventory Manager, Solstice Home",
  },
];

// Illustrative personas for this demo project, not real customers.
export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
          What restocking looks like with a forecast
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="h-full flex flex-col justify-between rounded-2xl border border-slate-100 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <blockquote className="font-display text-base leading-relaxed text-ink">“{t.quote}”</blockquote>
            <figcaption className="mt-6">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              <p className="text-xs text-slate-500">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
