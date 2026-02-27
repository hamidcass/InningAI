import { motion } from "framer-motion";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.08,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
};

export default function NextSeason() {
    return (
        <div className="page-container">
            <motion.header
                className="hero-header"
                initial="hidden"
                animate="visible"
            >
                <motion.h1 variants={fadeUp} custom={0}>Next Season</motion.h1>
                <motion.p className="subtitle" variants={fadeUp} custom={1}>
                    <span className="highlight">Coming Soon</span>
                </motion.p>
                <motion.p className="hero-description" variants={fadeUp} custom={2}>
                    View the projected stats for the upcoming 2026 MLB season.
                </motion.p>
            </motion.header>
        </div>
    );
}
