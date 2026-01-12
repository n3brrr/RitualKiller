import React from "react";
import { useNavigate } from "react-router-dom";
import { Skull, Play } from "lucide-react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { User } from "@/types";

const LandingPage = ({ onAuth }: { onAuth: (user: User) => void }) => {
  const navigate = useNavigate();

  <motion.div
    animate={{
      y: [0, -15, 0],
      opacity: [0.8, 1, 0.8],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <Skull size={80} className="text-ritual-accent shadow-lg" />
  </motion.div>;
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
    // Simulating Auth - In a real app this would call an API
    const storedUser = localStorage.getItem("rk_user");
    let userToLoad: User;

    if (storedUser) {
      userToLoad = JSON.parse(storedUser);
    } else {
      userToLoad = {
        id: "demo",
        username: "Novice",
        essence: 0,
        inventory: [],
      };
      localStorage.setItem("rk_user", JSON.stringify(userToLoad));
    }

    onAuth(userToLoad);
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-ritual-accent selection:text-black font-sans overflow-hidden relative">
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_70%)] pointer-events-none"></div>

      <nav className="p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Skull className="text-ritual-accent" />
          <span className="font-display font-bold text-xl tracking-widest">
            RitualKiller
          </span>
        </div>
        <button
          onClick={handleLogin}
          className="text-sm font-semibold hover:text-ritual-accent transition-colors"
        >
          INITIATE_LOGIN
        </button>
      </nav>

      <header className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative z-10">
        <h1 className="hero-text text-5xl md:text-8xl font-display font-black mb-6 uppercase tracking-tighter">
          Kill The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-ritual-accent to-emerald-800">
            Old You
          </span>
        </h1>
        <p className="hero-text text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          A gamified habit tracker for those who find motivation in darkness.
          Build rituals. Earn essence. Ascend.
        </p>
        <button
          onClick={handleLogin}
          className="hero-text group relative px-8 py-4 bg-ritual-accent text-black font-bold text-lg uppercase tracking-widest overflow-hidden hover:scale-105 transition-transform"
        >
          <span className="relative z-10 flex items-center gap-2">
            Begin The Ritual <Play size={16} fill="black" />
          </span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
        </button>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Rituals",
            desc: "Define your daily sacrifices. Strict tracking creates iron discipline.",
          },
          {
            title: "Heatmap",
            desc: "Visualize your consistency. Watch your dormant potential awaken.",
          },
          {
            title: "Black Market",
            desc: "Exchange your suffering (effort) for digital glory.",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="feature-card p-8 border border-zinc-900 bg-zinc-950/50 hover:border-ritual-accent/50 transition-colors"
          >
            <h3 className="font-display text-2xl font-bold mb-4 text-zinc-200">
              {f.title}
            </h3>
            <p className="text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
