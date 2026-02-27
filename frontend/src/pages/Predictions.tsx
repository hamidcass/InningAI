import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar,
    Cell,
} from "recharts";
import { fetchAllPredictions, fetchMetrics, fetchImportance } from "../api/api";
import { useDesignTheme } from "../hooks/useDesignTheme";

interface Prediction {
    Player: string;
    Actual: number;
    Predicted: number;
    Error: number;
    Abs_Error: number;
    Pct_Error: number;
    Age?: number;
    PA?: number;
}

interface Metrics {
    MAE: number;
    R2: number;
    Num_Players: number;
}

interface FeatureImportance {
    Feature: string;
    Importance: number;
    Direction?: number;
    Effect?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: Prediction }>;
}

function AnimatedValue({ value, decimals = 4 }: { value: number; decimals?: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let frame: number;
        const duration = 1200;
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(eased * value);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, value]);

    return <span ref={ref}>{display.toFixed(decimals)}</span>;
}

function AnimatedInt({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let frame: number;
        const duration = 1200;
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, value]);

    return <span ref={ref}>{display}</span>;
}

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.09,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const sectionIn = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

const cardIn = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="scatter-tooltip">
                <p className="tooltip-name">{data.Player}</p>
                <p>Actual: <strong>{data.Actual.toFixed(3)}</strong></p>
                <p>Predicted: <strong>{data.Predicted.toFixed(3)}</strong></p>
                <p>Error: <span className={data.Error > 0 ? "positive" : "negative"}>
                    {data.Error > 0 ? "+" : ""}{data.Error.toFixed(3)}
                </span></p>
            </div>
        );
    }
    return null;
}

function LoadingSkeleton() {
    return (
        <>
            <section className="skeleton-section">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton-metrics-grid">
                    <div className="skeleton skeleton-metric-card"></div>
                    <div className="skeleton skeleton-metric-card"></div>
                    <div className="skeleton skeleton-metric-card"></div>
                </div>
            </section>
            <section className="skeleton-section">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-subtitle"></div>
                <div className="skeleton skeleton-importance"></div>
            </section>
            <section className="skeleton-section">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-subtitle"></div>
                <div className="skeleton skeleton-chart"></div>
            </section>
            <section className="skeleton-section">
                <div className="skeleton-performers-grid">
                    <div className="skeleton skeleton-table"></div>
                    <div className="skeleton skeleton-table"></div>
                </div>
            </section>
        </>
    );
}

export default function Predictions() {
    const colors = useDesignTheme();

    const [targetStat, setTargetStat] = useState("OPS");
    const [model, setModel] = useState("XGBoost");
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [importance, setImportance] = useState<FeatureImportance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [zoomLevel, setZoomLevel] = useState(10);
    const [panX, setPanX] = useState(50);
    const [panY, setPanY] = useState(50);

    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);

    const loadPredictions = async (stat: string, modelName: string) => {
        setLoading(true);
        setError(null);
        setZoomLevel(10);
        setPanX(50);
        setPanY(50);
        setSearchQuery("");
        setHighlightedPlayer(null);
        try {
            const [predData, metricsData] = await Promise.all([
                fetchAllPredictions(stat, modelName),
                fetchMetrics(stat, modelName),
            ]);
            setPredictions(predData.predictions || []);
            setMetrics(metricsData);
            try {
                const importanceData = await fetchImportance(stat, modelName);
                setImportance(importanceData.features || []);
            } catch {
                setImportance([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data");
            setPredictions([]);
            setMetrics(null);
            setImportance([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPredictions(targetStat, model);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRunPredictions = () => loadPredictions(targetStat, model);

    const allValues = predictions.flatMap(p => [p.Actual, p.Predicted]);
    const dataMin = allValues.length ? Math.min(...allValues) : 0;
    const dataMax = allValues.length ? Math.max(...allValues) : 1;
    const dataRange = dataMax - dataMin;
    const baseMin = dataMin - dataRange * 0.05;
    const baseMax = dataMax + dataRange * 0.05;
    const fullRange = baseMax - baseMin;

    const zoomedDomain = useMemo(() => {
        const effectiveZoom = 110 - zoomLevel;
        const viewRange = (fullRange * effectiveZoom) / 100;
        const halfView = viewRange / 2;
        const centerX = baseMin + (fullRange * panX) / 100;
        const centerY = baseMin + (fullRange * panY) / 100;
        return {
            xMin: Math.max(baseMin, centerX - halfView),
            xMax: Math.min(baseMax, centerX + halfView),
            yMin: Math.max(baseMin, centerY - halfView),
            yMax: Math.min(baseMax, centerY + halfView),
        };
    }, [zoomLevel, panX, panY, baseMin, baseMax, fullRange]);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return predictions
            .filter(p => p.Player.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 8);
    }, [predictions, searchQuery]);

    const handleResetZoom = () => {
        setZoomLevel(10);
        setPanX(50);
        setPanY(50);
    };

    const handlePlayerSelect = (playerName: string) => {
        setHighlightedPlayer(playerName);
        setSearchQuery("");
    };

    const importanceChartData = importance.slice(0, 10).map(f => ({
        ...f,
        Feature: f.Feature.replace("Current_", ""),
        fill: f.Direction && f.Direction > 0 ? colors.positiveDir : colors.negativeDir,
    }));

    return (
        <div className="page-container">
            {/* Hero */}
            <motion.header
                className="hero-header"
                initial="hidden"
                animate="visible"
            >
                <motion.h1 variants={fadeUp} custom={0}>
                    Run <span className="highlight">Predictions</span>
                </motion.h1>
                <motion.p className="subtitle" variants={fadeUp} custom={1}>
                    Select your target stat and model to generate 2025 MLB projections.
                </motion.p>
            </motion.header>

            {/* Control Panel */}
            <motion.div
                className="control-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
                <div className="control-group">
                    <label>Target Stat</label>
                    <select value={targetStat} onChange={e => setTargetStat(e.target.value)}>
                        <option value="OPS">OPS</option>
                        <option value="AVG">AVG</option>
                        <option value="HR">HR</option>
                        <option value="wRC_PLUS">wRC+</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Model</label>
                    <select value={model} onChange={e => setModel(e.target.value)}>
                        <option value="XGBoost">XGBoost</option>
                        <option value="RandomForest">Random Forest</option>
                        <option value="LinearRegression">Linear Regression</option>
                        <option value="Ridge">Ridge</option>
                    </select>
                </div>
                <button className="btn-primary" onClick={handleRunPredictions} disabled={loading}>
                    {loading ? "Loading..." : "Run Predictions"}
                </button>
            </motion.div>

            {error && (
                <motion.div
                    className="error-banner"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.div>
            )}

            {loading && <LoadingSkeleton />}

            {/* Metrics */}
            {!loading && metrics && (
                <motion.section
                    className="metrics-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                >
                    <motion.h2 variants={sectionIn}>Model Performance</motion.h2>
                    <motion.div className="metrics-grid" variants={stagger}>
                        <motion.div className="metric-card" variants={cardIn}>
                            <div className="metric-label">Mean Absolute Error</div>
                            <div className="metric-value"><AnimatedValue value={metrics.MAE} /></div>
                        </motion.div>
                        <motion.div className="metric-card" variants={cardIn}>
                            <div className="metric-label">R² Score</div>
                            <div className="metric-value"><AnimatedValue value={metrics.R2} /></div>
                        </motion.div>
                        <motion.div className="metric-card" variants={cardIn}>
                            <div className="metric-label">Players Evaluated</div>
                            <div className="metric-value"><AnimatedInt value={metrics.Num_Players} /></div>
                        </motion.div>
                    </motion.div>
                </motion.section>
            )}

            {/* Glow Line */}
            {!loading && metrics && (
                <motion.hr
                    className="glow-line"
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                />
            )}

            {/* Feature Importance */}
            {!loading && importance.length > 0 && (
                <motion.section
                    className="importance-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={sectionIn}
                >
                    <h2>Feature Importance</h2>
                    <p className="chart-subtitle">
                        Top factors driving {model} predictions for {targetStat}
                    </p>
                    <div className="importance-chart-container">
                        <div className="chart-scroll-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={importanceChartData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                                    <XAxis type="number" tick={{ fill: colors.tickFill }} />
                                    <YAxis
                                        type="category"
                                        dataKey="Feature"
                                        tick={{ fill: colors.tickFill, fontSize: 12 }}
                                        width={90}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: colors.tooltipBg,
                                            border: `1px solid ${colors.tooltipBorder}`,
                                            borderRadius: "8px",
                                        }}
                                        labelStyle={{ color: colors.tooltipText }}
                                        itemStyle={{ color: colors.tooltipText }}
                                    />
                                    <Bar dataKey="Importance" radius={[0, 4, 4, 0]}>
                                        {importanceChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <p className="importance-legend">
                        <span className="legend-dot positive-dir"></span> Increases prediction
                        <span className="legend-dot negative-dir"></span> Decreases prediction
                    </p>
                </motion.section>
            )}

            {/* Glow Line */}
            {!loading && importance.length > 0 && (
                <motion.hr
                    className="glow-line"
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                />
            )}

            {/* Scatter Chart */}
            {!loading && predictions.length > 0 && (
                <motion.section
                    className="chart-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={sectionIn}
                >
                    <h2>Predicted vs Actual {targetStat}</h2>
                    <p className="chart-subtitle">
                        {predictions.length} players &bull; {model} model
                        {highlightedPlayer && <span className="highlight-badge"> &bull; Showing: {highlightedPlayer}</span>}
                    </p>

                    <div className="player-search">
                        <input
                            type="text"
                            placeholder="Search for a player..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {filteredPlayers.length > 0 && (
                            <div className="search-results">
                                {filteredPlayers.map((p, i) => (
                                    <div key={i} className="search-result-item" onClick={() => handlePlayerSelect(p.Player)}>
                                        <span className="player-name">{p.Player}</span>
                                        <span className="player-stats">
                                            Actual: {p.Actual.toFixed(3)} | Pred: {p.Predicted.toFixed(3)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {highlightedPlayer && (
                            <button className="btn-clear-highlight" onClick={() => setHighlightedPlayer(null)}>
                                Clear highlight
                            </button>
                        )}
                    </div>

                    <div className="zoom-controls">
                        <div className="zoom-control-group">
                            <label>Zoom</label>
                            <input
                                type="range" min="10" max="100"
                                value={zoomLevel}
                                onChange={e => setZoomLevel(Number(e.target.value))}
                                className="zoom-slider"
                            />
                            <span className="zoom-value">{Math.round(zoomLevel / 10)}x</span>
                        </div>
                        <div className="zoom-control-group">
                            <label>Pan X</label>
                            <input
                                type="range" min="0" max="100"
                                value={panX}
                                onChange={e => setPanX(Number(e.target.value))}
                                className="zoom-slider"
                                disabled={zoomLevel === 10}
                            />
                        </div>
                        <div className="zoom-control-group">
                            <label>Pan Y</label>
                            <input
                                type="range" min="0" max="100"
                                value={panY}
                                onChange={e => setPanY(Number(e.target.value))}
                                className="zoom-slider"
                                disabled={zoomLevel === 10}
                            />
                        </div>
                        <button className="btn-reset" onClick={handleResetZoom}>Reset View</button>
                    </div>

                    <div className="scatter-container">
                        <div className="chart-scroll-wrapper">
                            <ResponsiveContainer width="100%" height={500}>
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                                    <XAxis
                                        type="number" dataKey="Actual" name="Actual"
                                        domain={[zoomedDomain.xMin, zoomedDomain.xMax]}
                                        tick={{ fill: colors.tickFill }}
                                        label={{ value: `Actual ${targetStat}`, position: "bottom", offset: 40, fill: colors.tickFill }}
                                        allowDataOverflow
                                    />
                                    <YAxis
                                        type="number" dataKey="Predicted" name="Predicted"
                                        domain={[zoomedDomain.yMin, zoomedDomain.yMax]}
                                        tick={{ fill: colors.tickFill }}
                                        label={{ value: `Predicted ${targetStat}`, angle: -90, position: "left", offset: 40, fill: colors.tickFill }}
                                        allowDataOverflow
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine
                                        segment={[
                                            { x: zoomedDomain.xMin, y: zoomedDomain.xMin },
                                            { x: zoomedDomain.xMax, y: zoomedDomain.xMax },
                                        ]}
                                        stroke={colors.accent2}
                                        strokeDasharray="5 5"
                                        strokeWidth={2}
                                    />
                                    <Scatter
                                        data={predictions.filter(p => p.Player !== highlightedPlayer)}
                                        fill={colors.scatterDot}
                                        fillOpacity={highlightedPlayer ? 0.3 : 0.7}
                                    />
                                    {highlightedPlayer && (
                                        <Scatter
                                            data={predictions.filter(p => p.Player === highlightedPlayer)}
                                            fill={colors.highlight}
                                            fillOpacity={1}
                                            shape="star"
                                        />
                                    )}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <p className="chart-legend">
                        <span className="legend-line"></span> Perfect prediction line (y = x)
                    </p>
                </motion.section>
            )}

            {/* Glow Line */}
            {!loading && predictions.length > 0 && (
                <motion.hr
                    className="glow-line"
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                />
            )}

            {/* Performers */}
            {!loading && predictions.length > 0 && (
                <motion.section
                    className="performers-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={stagger}
                >
                    <motion.div className="performers-grid" variants={stagger}>
                        <motion.div className="performers-table" variants={cardIn}>
                            <h3>Top 5 Overperformers</h3>
                            <div className="table-scroll-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Predicted</th>
                                            <th>Actual</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...predictions]
                                            .sort((a, b) => a.Error - b.Error)
                                            .slice(0, 5)
                                            .map((p, i) => (
                                                <tr key={i}>
                                                    <td className="player-name">{p.Player}</td>
                                                    <td>{p.Predicted.toFixed(3)}</td>
                                                    <td>{p.Actual.toFixed(3)}</td>
                                                    <td className="error-cell overperform">{p.Error.toFixed(3)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        <motion.div className="performers-table" variants={cardIn}>
                            <h3>Top 5 Underperformers</h3>
                            <div className="table-scroll-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Predicted</th>
                                            <th>Actual</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...predictions]
                                            .sort((a, b) => b.Error - a.Error)
                                            .slice(0, 5)
                                            .map((p, i) => (
                                                <tr key={i}>
                                                    <td className="player-name">{p.Player}</td>
                                                    <td>{p.Predicted.toFixed(3)}</td>
                                                    <td>{p.Actual.toFixed(3)}</td>
                                                    <td className="error-cell underperform">+{p.Error.toFixed(3)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.section>
            )}

            {/* Info Banner */}
            <motion.div
                className="info-banner"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
                Predict 2025 player stats using 9 years of historical data, advanced sabermetrics,
                and various ML models. Configure your settings and click Run Predictions to get started.
            </motion.div>
        </div>
    );
}
