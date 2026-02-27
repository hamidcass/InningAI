import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fetchStats } from "../api/api";

interface DatasetStats {
  total_player_seasons: number;
  unique_players: number;
  years: number[];
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const stepVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const diamondVariant = {
  hidden: { opacity: 0, scale: 0.8, rotate: 45 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 45,
    transition: { delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function Home() {
  const [stats, setStats] = useState<DatasetStats | null>(null);

  useEffect(() => {
    fetchStats()
      .then(data => setStats(data))
      .catch(() => {
        setStats({
          total_player_seasons: 3076,
          unique_players: 462,
          years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
        });
      });
  }, []);

  const formatYears = (years: number[]) => {
    const training = years.filter(y => y < 2025);
    if (training.length < 2) return training.join(", ");
    return `${training[0]}–${training[training.length - 1]}`;
  };

  const pipelineSteps = [
    { num: "01", title: "Ingest", desc: "Pull qualified batting data via FanGraphs for every season since 2016." },
    { num: "02", title: "Engineer", desc: "Build features from sabermetrics, park factors, and year-over-year trends." },
    { num: "03", title: "Train", desc: "Fit Linear Regression, Ridge, Random Forest, and XGBoost models per stat." },
    { num: "04", title: "Evaluate", desc: "Compare predicted vs actual 2025 results with MAE, R², and feature importance." },
  ];

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.header
        className="home-hero"
        initial="hidden"
        animate="visible"
      >
        <motion.span className="hero-tag" variants={fadeUp} custom={0}>
          2025 Season Projections
        </motion.span>
        <motion.h1 variants={fadeUp} custom={1}>
          Machine Learning Meets{" "}
          <span className="hero-accent">Major League Baseball</span>
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp} custom={2}>
          Advanced sabermetrics and <span className="hl">4 ML models</span> trained
          on 9 years of data to project every qualified hitter's offensive numbers.
        </motion.p>
        <motion.div className="hero-ctas" variants={fadeUp} custom={3}>
          <Link to="/predictions" className="btn-cta">Explore Predictions</Link>
          <Link to="/search" className="btn-cta-secondary">Search Players</Link>
        </motion.div>

        {/* Decorative diamond wireframe */}
        <motion.div
          className="hero-decoration"
          variants={diamondVariant}
          aria-hidden="true"
        >
          <div className="hero-decoration-inner" />
          <span className="hero-decoration-dot" />
          <span className="hero-decoration-dot" />
          <span className="hero-decoration-dot" />
          <span className="hero-decoration-dot" />
        </motion.div>
      </motion.header>

      {/* Glow Line */}
      <motion.hr
        className="glow-line"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      {/* Stats Strip with animated counters */}
      <motion.section
        className="stats-strip"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <div className="strip-item">
          <span className="strip-value">
            {stats ? <AnimatedCounter value={stats.total_player_seasons} /> : "—"}
          </span>
          <span className="strip-label">Player-Seasons</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-item">
          <span className="strip-value">
            {stats ? formatYears(stats.years) : "—"}
          </span>
          <span className="strip-label">Training Window</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-item">
          <span className="strip-value">
            {stats ? <AnimatedCounter value={4} /> : "—"}
          </span>
          <span className="strip-label">ML Models</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-item">
          <span className="strip-value">
            {stats ? <AnimatedCounter value={4} /> : "—"}
          </span>
          <span className="strip-label">Stats Projected</span>
        </div>
      </motion.section>

      {/* Glow Line */}
      <motion.hr
        className="glow-line"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />

      {/* Pipeline Timeline */}
      <motion.section
        className="pipeline-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        <motion.h2 variants={fadeUp} custom={0}>How It Works</motion.h2>
        <motion.div
          className="pipeline-timeline"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {pipelineSteps.map(step => (
            <motion.div key={step.num} className="timeline-step" variants={stepVariant}>
              <div className="timeline-marker">{step.num}</div>
              <div className="timeline-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </div>
  );
}
