import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Flame,
  FlaskConical,
  Lock,
  Skull,
  Trophy,
} from "lucide-react";

const CTA_LABEL = "Empezar el ritual";

function CTA({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/login"
      className={`group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-ritual-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-ritual-accent transition-colors hover:text-black focus-visible:text-black ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full bg-ritual-accent transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0"
      />
      <span className="relative z-10">{CTA_LABEL}</span>
      <ArrowRight size={16} className="relative z-10" aria-hidden="true" />
    </Link>
  );
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-[0_0_48px_rgba(34,197,94,0.04)] sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-zinc-900 pb-3">
        <Skull size={14} className="text-ritual-accent" aria-hidden="true" />
        <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  copy,
  flip = false,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  flip?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      data-reveal
      className="border-t border-zinc-900/80"
      aria-labelledby={`section-${eyebrow.replace(/\W+/g, "-")}`}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-24">
        <div className={flip ? "md:order-2" : undefined}>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-ritual-accent">
            {eyebrow}
          </span>
          <h2
            id={`section-${eyebrow.replace(/\W+/g, "-")}`}
            className="mt-3 font-display text-3xl font-bold leading-tight text-white md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-md text-zinc-400">{copy}</p>
        </div>
        <div aria-hidden="true" className={flip ? "md:order-1" : undefined}>
          {children}
        </div>
      </div>
    </section>
  );
}

const RITUALS = [
  { title: "Meditar 10 minutos", reward: "+15", done: true },
  { title: "Leer 20 páginas", reward: "+10", done: true },
  { title: "Entrenar 30 minutos", reward: "+20", done: false },
];

const HEATMAP = [
  0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1, 2, 0, 2, 3, 3, 1, 0, 1, 2, 2, 3, 1, 2, 0, 1,
];

const HEATMAP_STYLES = [
  "bg-zinc-900",
  "bg-ritual-accent/20",
  "bg-ritual-accent/40",
  "bg-ritual-accent/70",
];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let context: { revert: () => void } | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        gsap.from("[data-hero]", {
          y: 12,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        });

        for (const element of gsap.utils.toArray("[data-reveal]") as HTMLElement[]) {
          gsap.from(element, {
            y: 16,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 85%", once: true },
          });
        }
      }, rootRef);
    })();

    return () => {
      cancelled = true;
      context?.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-ritual-black text-zinc-100"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.10),transparent_60%)]"
      />

      <header className="safe-pt fixed inset-x-0 top-0 z-50 border-b border-zinc-900 bg-ritual-dark/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white"
          >
            <Skull size={22} className="text-ritual-accent" aria-hidden="true" />
            RitualKiller
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-800 px-4 font-display text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-28 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-36">
          <div>
            <p
              data-hero
              className="font-mono text-xs uppercase tracking-[0.32em] text-ritual-accent"
            >
              RitualKiller
            </p>
            <h1
              data-hero
              className="mt-4 font-display text-4xl font-black leading-[1.05] text-white sm:text-5xl md:text-6xl"
            >
              La disciplina no se promete.
              <span className="mt-2 block text-ritual-accent">Se ritualiza.</span>
            </h1>
            <p data-hero className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-400">
              Un altar para tus hábitos: rituales diarios, esencia, rango y una racha que
              solo crece si vuelves mañana.
            </p>
            <div data-hero className="mt-8">
              <CTA />
            </div>
            <p data-hero className="mt-4 text-xs uppercase tracking-widest text-zinc-600">
              Sin promesas. Solo el registro de tus actos.
            </p>
          </div>

          <div data-hero aria-hidden="true">
            <Frame label="Altar">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Esencia
                  </p>
                  <p className="font-mono text-3xl font-bold text-ritual-accent">1.850</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Rango</p>
                  <p className="font-display text-lg font-bold text-white">Warlock</p>
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div className="h-full w-[57%] rounded-full bg-ritual-accent" />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-500">
                <span>1.000</span>
                <span>2.500</span>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                <Flame size={16} className="text-yellow-500" aria-hidden="true" />
                <span className="font-mono text-sm text-yellow-500">
                  12 días de racha
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ritual-accent bg-ritual-accent text-black">
                  <Check size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    Meditar 10 minutos
                  </p>
                  <p className="text-xs text-zinc-500">Hecho hoy</p>
                </div>
                <span className="font-mono text-sm text-ritual-accent">+15</span>
              </div>
            </Frame>
          </div>
        </section>

        <Section
          eyebrow="01 · Rituales"
          title="Tres actos al día. Cero negociación."
          copy="Define tus rituales, complétalos y mira cómo la racha sostiene lo que prometiste. Si fallas, el altar lo sabe."
        >
          <Frame label="Rituales · Hoy">
            <ul className="space-y-2">
              {RITUALS.map((ritual) => (
                <li
                  key={ritual.title}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      ritual.done
                        ? "border-ritual-accent bg-ritual-accent text-black"
                        : "border-zinc-700 text-zinc-500"
                    }`}
                  >
                    <Check size={16} aria-hidden="true" />
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      ritual.done ? "text-zinc-400 line-through" : "text-white"
                    }`}
                  >
                    {ritual.title}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">{ritual.reward}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
              <span className="inline-flex items-center gap-2 text-yellow-500">
                <Flame size={15} aria-hidden="true" /> 12 días de racha
              </span>
              <span className="font-mono text-xs text-ritual-accent">
                +45 esencia hoy
              </span>
            </div>
          </Frame>
        </Section>

        <Section
          eyebrow="02 · Objetivos"
          title="Una meta sin barra es un deseo."
          copy="Ata cada objetivo a tus rituales y deja que el progreso se calcule solo. Nada de marcar casillas a mano."
          flip
        >
          <Frame label="Objetivo">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Leer 12 libros este año</p>
                <p className="mt-1 text-xs text-zinc-500">Vence en diciembre</p>
              </div>
              <span className="font-mono text-2xl font-bold text-ritual-accent">58%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900">
              <div className="h-full w-[58%] rounded-full bg-ritual-accent" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-zinc-500">
              <span>7 de 12</span>
              <span>5 restantes</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                Leer 20 páginas
              </span>
              <span className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                Racha activa
              </span>
            </div>
          </Frame>
        </Section>

        <Section
          eyebrow="03 · Coven"
          title="Tu constancia también se ve fuera."
          copy="Un feed de actos cumplidos, no de intenciones. Sigue a quien sostiene el ritmo y deja que te sigan."
        >
          <Frame label="Coven">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-display font-bold text-ritual-accent">
                V
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200">
                  <span className="font-bold text-white">Vex</span> completó «Meditar 10
                  minutos»
                </p>
                <p className="text-xs uppercase tracking-wider text-zinc-500">hace 2 h</p>
              </div>
              <span className="font-mono text-xs text-ritual-accent">+15</span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-900 pt-3 text-xs text-zinc-500">
              <Flame size={14} className="text-yellow-500" aria-hidden="true" />3 miembros
              mantienen su racha hoy
            </div>
          </Frame>
        </Section>

        <Section
          eyebrow="04 · Mercado"
          title="La esencia se gana. No se regala."
          copy="Cambia constancia por objetos que empujan la siguiente racha. Lo comprado aparece en tu inventario, listo para usar."
          flip
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Frame label="Mercado">
              <div className="flex items-start justify-between gap-2">
                <FlaskConical
                  size={32}
                  className="text-ritual-accent"
                  aria-hidden="true"
                />
                <span className="rounded border border-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wider text-zinc-500">
                  raro
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-white">Elixir de disciplina</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Duplica la esencia de tus rituales durante un día.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3">
                <span className="font-mono text-sm text-ritual-accent">500 esencia</span>
                <span className="rounded-lg border border-ritual-accent/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ritual-accent">
                  Comprar
                </span>
              </div>
            </Frame>

            <Frame label="Inventario">
              <div className="flex items-start justify-between gap-2">
                <FlaskConical
                  size={32}
                  className="text-ritual-accent"
                  aria-hidden="true"
                />
                <span className="rounded border border-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                  x1
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-white">Elixir de disciplina</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Comprado con la esencia de esta semana.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  En inventario
                </span>
                <span className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Usar
                </span>
              </div>
            </Frame>
          </div>
        </Section>

        <Section
          eyebrow="05 · Analíticas"
          title="El registro no miente."
          copy="Rangos, rachas y mapas de constancia. Cuando el mes se cierra, solo queda lo que hiciste."
        >
          <Frame label="Analíticas · 28 días">
            <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
              {HEATMAP.map((level, index) => (
                <span
                  key={index}
                  className={`aspect-square rounded-[2px] ${HEATMAP_STYLES[level]}`}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
                <Trophy size={18} className="text-yellow-500" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-white">Primera semana</p>
                  <p className="text-xs text-zinc-500">Logro desbloqueado</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <Lock size={18} className="text-zinc-500" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-zinc-400">Mes completo</p>
                  <p className="text-xs text-zinc-500">30 días de racha</p>
                </div>
              </div>
            </div>
          </Frame>
        </Section>

        <section className="border-t border-zinc-900/80">
          <div data-reveal className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
            <Skull
              size={40}
              className="mx-auto text-ritual-accent/60"
              aria-hidden="true"
            />
            <h2 className="mt-5 font-display text-3xl font-black leading-tight text-white md:text-5xl">
              La disciplina no se promete.
              <span className="mt-2 block text-ritual-accent">Se ritualiza.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Entra al altar, define tu primer ritual y deja que la racha hable por ti.
            </p>
            <div className="mt-8">
              <CTA />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-zinc-500 sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <Skull size={14} className="text-ritual-accent/70" aria-hidden="true" />
            RitualKiller · 2026
          </span>
          <Link to="/login" className="transition-colors hover:text-ritual-accent">
            Entrar al altar
          </Link>
        </div>
      </footer>
    </div>
  );
}
