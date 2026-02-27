import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="page-container not-found-page">
            <motion.div
                className="not-found-content"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <h1 className="not-found-code">404</h1>
                <h2 className="not-found-title">Page Not Found</h2>
                <p className="not-found-message">
                    Looks like this pitch went wide. The page you're looking for doesn't exist.
                </p>
                <Link to="/" className="btn-cta">
                    Back to Home
                </Link>
            </motion.div>
        </div>
    );
}
