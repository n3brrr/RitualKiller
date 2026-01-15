import React from "react";
import { useNavigate } from "react-router-dom";
import { Skull, Play } from "lucide-react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { User } from "@/types";
import { FeatureCard } from "../components/ui/FeatureCard.tsx"; // Importamos el nuevo componente

const LandingPage = ({ onAuth }: { onAuth: (user: User) => void }) => {
  const navigate = useNavigate();

  React.useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });
      gsap.from(".feature-card", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.5,
      });
    });
    return () => ctx.revert();
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-ritual-accent selection:text-black font-body overflow-hidden relative">
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08),transparent_70%)] pointer-events-none"></div>

      <nav className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Skull className="text-ritual-accent" />
          <span className="font-ritual font-bold text-xl tracking-widest uppercase">
            RitualKiller
          </span>
        </div>
        <button
          onClick={handleLogin}
          className="text-xs font-ritual tracking-widest uppercase border border-ritual-accent px-2 py-2 shadow-xl hover:text-black hover:bg-ritual-accent "
        >
          Iniciar Sesión
        </button>
      </nav>

      <header className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative z-10">
        {/* Aquí insertamos la Calavera Animada que tenías fuera */}
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <Skull
            size={64}
            className="text-ritual-accent/50 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          />
        </motion.div>

        <h1 className="hero-text text-6xl md:text-9xl font-ritual font-black mb-6 uppercase tracking-tighter leading-none">
          Kill The <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-ritual-accent to-emerald-900">
            Old You
          </span>
        </h1>

        <p className="hero-text text-zinc-500 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light uppercase tracking-widest">
          Build rituals. Earn essence. Ascend.
        </p>

        <button
          onClick={handleLogin}
          className="hero-text group relative px-10 py-5 bg-transparent border border-ritual-accent text-ritual-accent font-ritual font-bold text-lg uppercase tracking-[0.3em] overflow-hidden transition-all"
        >
          <span className="relative z-10 flex items-center gap-3 group-hover:text-black">
            Begin The Ritual <Play size={18} fill="currentColor" />
          </span>
          <div className="absolute inset-0 bg-ritual-accent translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300 -z-10"></div>
        </button>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-8 relative z-10">
        <FeatureCard
          index={0}
          title="Rituals"
          desc="Define your daily sacrifices. Strict tracking creates iron discipline."
        />
        <FeatureCard
          index={1}
          title="Heatmap"
          desc="Visualize your consistency. Watch your dormant potential awaken."
        />
        <FeatureCard
          index={2}
          title="Black Market"
          desc="Exchange your suffering for digital glory and artifacts."
        />
      </section>
    </div>
  );
};

export default LandingPage;
