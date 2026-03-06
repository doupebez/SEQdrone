'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronRight,
  Layers,
  Shield,
  Sparkles,
  Target,
  Zap,
  Camera,
  Home as HomeIcon,
  Sun,
  Map,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-100 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-900/20 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <Image
              src="/images/logo.png"
              alt="SEQ Drone Inspections"
              width={280}
              height={70}
              className="h-16 w-auto brightness-0 invert"
              priority
            />
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-primary transition-all">Home</Link>
            <Link href="#" className="hover:text-primary transition-all">Services</Link>
            <Link href="#" className="hover:text-primary transition-all">Locations</Link>
            <Link href="#" className="hover:text-primary transition-all">About Us</Link>
            <Link href="#" className="hover:text-primary transition-all">Contact</Link>
            <Link href="tel:0731796439" className="text-white hover:text-primary transition-all px-4 py-2 border border-white/10 rounded-full bg-white/5">07 3179 6439</Link>
            <Link href="/survey" className="bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)]">Get Quote</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-48">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 mb-8"
            >
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              CASA Certified | $10M Insured
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-white"
            >
              Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Drone Inspections</span> <br />
              Across <span className="text-primary">South East Queensland</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Fast, Safe, and Cost-Effective Roof & Building Inspections. <br className="hidden md:block" />
              AI-powered precision for commercial, residential and industrial assets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link
                href="/survey"
                className="group relative flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-5 text-base font-bold text-primary-foreground shadow-2xl shadow-primary/40 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Start New Survey
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                <LayoutDashboard className="size-5 text-primary" />
                Client Dashboard
              </Link>
            </motion.div>
          </div>

          {/* Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="container mx-auto px-6 mt-24"
          >
            <div className="relative aspect-[16/10] max-w-6xl mx-auto rounded-3xl border border-white/10 bg-[#0f172a]/80 shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
              <video
                src="/introvid.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000"
              />
              <div className="absolute bottom-12 left-12 z-20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-tighter">Live Analysis</div>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-black text-green-500 uppercase tracking-tighter">System Nominal</div>
                </div>
                <h3 className="text-3xl font-bold">Precision Damage Mapping</h3>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {(() => {
                const services = [
                  {
                    title: "Drone Roof Inspection",
                    description: "Detailed mapping and defect detection for commercial and residential roofing systems.",
                    icon: <HomeIcon className="size-6" />,
                  },
                  {
                    title: "Solar Panel Inspection",
                    description: "Thermal and visual analysis to identify hotspots, cracks, and efficiency loss.",
                    icon: <Sun className="size-6" />,
                  },
                  {
                    title: "Asset Inspection",
                    description: "High-resolution visual surveys for towers, bridges, and industrial infrastructure.",
                    icon: <Shield className="size-6" />,
                  },
                  {
                    title: "Aerial Photography",
                    description: "Stunning high-resolution aerial perspectives for marketing and documentation.",
                    icon: <Camera className="size-6" />,
                  },
                  {
                    title: "Real Estate Photography",
                    description: "Professional aerial imagery and video tailored for property marketing.",
                    icon: <Building2 className="size-6" />,
                  },
                  {
                    title: "Aerial Mapping & Surveying",
                    description: "Photogrammetry and LiDAR for accurate site mapping and 3D modeling.",
                    icon: <Map className="size-6" />,
                  },
                ];
                return services.map((service, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-primary/50 hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{service.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* Secondary Preview Section */}
        <section className="py-24 bg-white/[0.01]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 space-y-8"
              >
                <div className="text-primary font-black text-sm uppercase tracking-[0.2em]">Edge Intelligence</div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Advanced Image<br />Analysis Engine</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Our engine processes multi-spectral data, providing integrated visual and thermal
                  inspection capabilities. Identify hotspots and delamination before they become
                  critical failures.
                </p>
                <ul className="space-y-4">
                  {[
                    "Multi-spectral data integration",
                    "Deep-learning defect classification",
                    "Geospatial focal point mapping",
                    "Sub-pixel boundary tracing"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                      <CheckCircle2 className="size-5 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 relative"
              >
                <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image
                    src="/images/thermal_preview.png"
                    alt="Thermal Inspection Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="text-[10px] font-black text-red-500 uppercase mb-2 animate-pulse">Thermal Anomaly Detected</div>
                    <div className="text-xl font-bold">Solar Array Hotspot Analysis</div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 size-40 bg-primary/10 blur-[80px] rounded-full" />
                <div className="absolute -bottom-10 -left-10 size-40 bg-purple-600/10 blur-[80px] rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-[#020617]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center opacity-70">
            <Image
              src="/images/logo.png"
              alt="SEQ Drone Inspections"
              width={200}
              height={50}
              className="h-10 w-auto brightness-0 invert"
            />
          </div>
          <p className="text-slate-500 text-sm">© 2024 SEQ Drone Inspections. All rights reserved.</p>
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
