import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Database,
  BarChart2,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { DatabaseModal } from '../components/DatabaseModal';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch {
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8fd] text-slate-900 font-sans">
      <Navbar onOpenDbModal={() => setIsDbModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-800 bg-purple-100/70 border border-purple-200/80 px-3 py-1 rounded-full">
                <Heart className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                <span>Your daily glucose companion</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Take control of your <br className="hidden sm:inline" />
                <span className="text-purple-700">glucose health</span> with confidence.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Sweety helps diabetes patients track up to four clinical readings each day. 
                Monitor morning fasting to evening post-dinner spikes with comprehensive daily, 
                month-to-date, and monthly reporting backed by Neon PostgreSQL.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md shadow-purple-900/10 hover:shadow-lg"
                  >
                    <span>Open Patient Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md shadow-purple-900/10 hover:shadow-lg"
                    >
                      <span>Start Tracking Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleDemoLogin}
                      disabled={demoLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-purple-800 bg-purple-100/80 hover:bg-purple-200/80 rounded-xl transition-colors border border-purple-200"
                    >
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>{demoLoading ? 'Accessing Demo...' : '1-Click Demo Login'}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  <Database className="w-4 h-4 text-purple-600" />
                  <span>Neon DB Status</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ADA Clinical Ranges (40–600 mg/dl)
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  Private bcrypt & JWT Security
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  Neon Serverless PostgreSQL
                </span>
              </div>
            </div>

            {/* Right Column: Hero Healthcare Illustration */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-purple-100 shadow-xl shadow-purple-950/5 bg-white">
                <img
                  src="/src/assets/images/hero_glucose_companion_1794211678536.jpg"
                  alt="Sweety Glucose Companion on digital health display"
                  className="w-full h-auto object-cover rounded-3xl"
                  referrerPolicy="no-referrer"
                />
                <div className="p-4 bg-white/95 backdrop-blur-xs border-t border-purple-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Patient Morning Check-In</p>
                    <p className="text-[11px] text-slate-500">Fasting target achieved · 98 mg/dl</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    In Target
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Clinical Slots Section */}
      <section id="clinical-slots" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
              Structured Daily Discipline
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Four Standard Clinical Slots
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Medical best practices recommend checking blood glucose at key intervals. 
              Sweety enforces exactly one reading per slot per day to build dependable routines.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                slot: 'Morning (fasting)',
                desc: 'Taken immediately upon waking before eating. Evaluates overnight basal hepatic glucose output.',
                target: 'Target: 70–99 mg/dl',
              },
              {
                slot: 'After breakfast',
                desc: 'Recorded 1–2 hours after breakfast. Gauges post-prandial insulin response to morning carbohydrates.',
                target: 'Target: <140 mg/dl',
              },
              {
                slot: 'After lunch',
                desc: 'Checks mid-day glycemic stability following your mid-day meal.',
                target: 'Target: <140 mg/dl',
              },
              {
                slot: 'After dinner',
                desc: 'Reflects evening meal impact and predicts overnight safety before bedtime.',
                target: 'Target: <140 mg/dl',
              },
            ].map((item, idx) => (
              <div
                key={item.slot}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-purple-50/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    Slot 0{idx + 1}
                  </span>
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">{item.slot}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                <div className="pt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Spotlight with Daily Care Illustration */}
      <section id="features" className="py-20 bg-[#faf8fd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border border-purple-100 shadow-lg bg-white">
                <img
                  src="/src/assets/images/sweety_daily_care_1794211678255.jpg"
                  alt="Patient reviewing daily routine"
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Evidence-Based Diabetes Care
              </h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed for clarity, consistency, and peace of mind.
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Diabetes management can feel overwhelming when readings are scattered in paper notebooks. 
                Sweety provides instant feedback on whether your reading is In Range, Elevated, or High, 
                and highlights trends over weeks and months.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    title: 'Automated 5-Rule Clinical Validation',
                    desc: 'Instant safeguards guarantee values are between 40–600 mg/dl, whole numbers, no future dates, and safe maximums.',
                  },
                  {
                    title: 'Three Dynamic Report Horizons',
                    desc: 'Daily breakdown, Month-to-date trajectory, and entire previous calendar month aggregation.',
                  },
                  {
                    title: 'Recharts Trajectory Graphs',
                    desc: 'Visual reference areas color-code normal glycemic target zones (70–140 mg/dl).',
                  },
                ].map((feat) => (
                  <div key={feat.title} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{feat.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Tech Stack Section */}
      <section id="neon-database" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 bg-purple-950/70 border border-purple-800 px-3 py-1 rounded-full">
                  <Database className="w-3.5 h-3.5" />
                  <span>Neon PostgreSQL Serverless Architecture</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Real Full-Stack Engineering with PostgreSQL
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Built to the exact specifications of the Kenpath technical assignment:
                  Express.js controller-service-route pattern, node-postgres (pg) connection pooling with SSL, 
                  safe database transactions, unique composite constraints, and Jest/Supertest test coverage.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  className="px-5 py-3 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs text-center"
                >
                  Configure Neon Database
                </button>
                <Link
                  to="/register"
                  className="px-5 py-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs text-center"
                >
                  Create Patient Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span className="font-semibold text-slate-800">Sweety – Blood Glucose Tracker</span>
            <span>·</span>
            <span>Your daily glucose companion</span>
          </div>
          <div>
            <span>Kenpath Technical Assignment · Built with React, Node.js & Neon PostgreSQL</span>
          </div>
        </div>
      </footer>

      <DatabaseModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
    </div>
  );
};
