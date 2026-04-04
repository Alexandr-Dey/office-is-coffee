"use client";

import { motion } from "framer-motion";
import Providers from "@/components/Providers";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
};

const features = [
  { icon: "☕", title: "Group Orders", description: "Collect coffee orders from your team in one tap. No more Slack threads." },
  { icon: "🤝", title: "Coffee Buddies", description: "Match with colleagues who share your taste. Build connections over espresso." },
  { icon: "📊", title: "Office Stats", description: "See your office's coffee culture — top drinks, peak hours, and trends." },
  { icon: "🎯", title: "Smart Recommendations", description: "AI-powered suggestions based on your mood, weather, and past orders." },
];

export default function Home() {
  return (
    <Providers>
      <main className="min-h-screen">
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-cream-50/80 border-b border-coffee-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <span className="text-3xl">☕</span>
              <span className="font-display text-2xl font-bold text-coffee-900">OiC</span>
            </motion.div>
            <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-coffee-600 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-coffee-700 transition-colors">
              Join Waitlist
            </motion.button>
          </div>
        </nav>

        <section className="pt-32 pb-20 px-6">
          <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-block bg-coffee-100 text-coffee-700 text-sm font-medium px-4 py-1.5 rounded-full">Now in Beta</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold text-coffee-950 mb-6 text-balance">
              Your Office Runs on <span className="text-coffee-600">Coffee</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-coffee-700 max-w-2xl mx-auto mb-10 text-balance">
              OiC is the social platform that turns coffee breaks into team building. Order together, discover new blends, and fuel your best work.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-700 transition-colors shadow-lg shadow-coffee-600/25">
                Get Early Access
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border-2 border-coffee-300 text-coffee-700 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-coffee-50 transition-colors">
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        <section className="py-20 px-6 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="font-display text-3xl md:text-4xl font-bold text-coffee-950 text-center mb-16">
              Everything Your Office Needs
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} whileHover={{ y: -8 }} className="bg-white rounded-2xl p-6 shadow-sm border border-coffee-100 hover:shadow-lg hover:border-coffee-200 transition-all">
                  <span className="text-4xl block mb-4">{feature.icon}</span>
                  <h3 className="font-display text-xl font-semibold text-coffee-900 mb-2">{feature.title}</h3>
                  <p className="text-coffee-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-3xl mx-auto bg-gradient-to-br from-coffee-800 to-coffee-950 rounded-3xl p-12 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Coffee Culture?</h2>
            <p className="text-coffee-200 text-lg mb-8 max-w-xl mx-auto">Join 500+ teams already brewing better connections at the office.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-coffee-900 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-cream-100 transition-colors">
              Start Free Trial
            </motion.button>
          </motion.div>
        </section>

        <footer className="py-10 px-6 border-t border-coffee-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <span className="font-display font-bold text-coffee-900">Office is Coffee</span>
            </div>
            <p className="text-coffee-500 text-sm">&copy; {new Date().getFullYear()} OiC. Fueling teams, one cup at a time.</p>
          </div>
        </footer>
      </main>
    </Providers>
  );
}
