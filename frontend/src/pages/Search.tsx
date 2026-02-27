import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceDot,
} from "recharts";
import { fetchPlayers, fetchPlayer, fetchPlayerHistory } from "../api/api";
import { useDesignTheme } from "../hooks/useDesignTheme";

interface Player {
    Player: string;
    Team: string;
    Age: number;
    PA: number;
}

interface PlayerPrediction {
    stat: string;
    model: string;
    Predicted: number;
    Actual: number;
    Error: number;
}

interface HistoryPoint {
    Season: number;
    OPS: number;
}

function calculateGrade(predicted: number, actual: number): string {
    const pctError = Math.abs((predicted - actual) / actual) * 100;
    if (pctError <= 2) return "A+";
    if (pctError <= 5) return "A";
    if (pctError <= 8) return "B+";
    if (pctError <= 12) return "B";
    if (pctError <= 18) return "C+";
    if (pctError <= 25) return "C";
    return "D";
}

function getGradeColor(grade: string, accent1: string, accentBlue: string, accent2: string, negative: string): string {
    if (grade.startsWith("A")) return accent1;
    if (grade.startsWith("B")) return accentBlue;
    if (grade.startsWith("C")) return accent2;
    return negative;
}

const MODEL_OPTIONS = [
    { value: "linearregression", label: "Linear Regression" },
    { value: "ridge", label: "Ridge" },
    { value: "randomforest", label: "Random Forest" },
    { value: "xgboost", label: "XGBoost" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.08,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};


export default function Search() {
    const colors = useDesignTheme();

    const [players, setPlayers] = useState<Player[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [playerPredictions, setPlayerPredictions] = useState<PlayerPrediction[]>([]);
    const [playerHistory, setPlayerHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedModel, setSelectedModel] = useState("xgboost");

    useEffect(() => {
        fetchPlayers()
            .then((data) => setPlayers(data.players || []))
            .catch(console.error);
    }, []);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return players
            .filter((p) => p.Player.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 10);
    }, [players, searchQuery]);

    const handlePlayerSelect = async (player: Player) => {
        setSelectedPlayer(player);
        setSearchQuery(player.Player);
        setShowDropdown(false);
        setLoading(true);

        try {
            const predData = await fetchPlayer(player.Player);
            setPlayerPredictions(predData.predictions || []);

            const historyData = await fetchPlayerHistory(player.Player);
            setPlayerHistory(historyData.history || []);
        } catch (err) {
            console.error("Error fetching player data:", err);
        } finally {
            setLoading(false);
        }
    };

    const opsPrediction = playerPredictions.find(
        (p) => p.stat === "OPS" && p.model === selectedModel
    );

    const selectedModelLabel = MODEL_OPTIONS.find(m => m.value === selectedModel)?.label || selectedModel;

    const chartData = useMemo(() => {
        const data: { Season: number; Actual: number | undefined; Predicted: number | null }[] =
            playerHistory.map((h) => ({
                Season: h.Season,
                Actual: h.OPS,
                Predicted: null as number | null,
            }));

        const modelPrediction = opsPrediction?.Predicted ?? null;
        if (modelPrediction !== null) {
            const existing2025 = data.find((d) => d.Season === 2025);
            if (existing2025) {
                existing2025.Predicted = modelPrediction;
            } else {
                data.push({
                    Season: 2025,
                    Actual: opsPrediction?.Actual,
                    Predicted: modelPrediction,
                });
            }
        }

        return data.sort((a, b) => a.Season - b.Season);
    }, [playerHistory, opsPrediction]);

    return (
        <div className="page-container search-page">
            <motion.div
                className="search-header"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
                <label className="search-label">Search for a player</label>
                <div className="search-dropdown-container">
                    <input
                        type="text"
                        className="search-dropdown-input"
                        placeholder="Vladimir Guerrero Jr."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />
                    <span className="dropdown-arrow">▼</span>
                    <AnimatePresence>
                        {showDropdown && filteredPlayers.length > 0 && (
                            <motion.div
                                className="search-dropdown-results"
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                                style={{ transformOrigin: 'top center' }}
                            >
                                {filteredPlayers.map((p, i) => (
                                    <div
                                        key={i}
                                        className="search-dropdown-item"
                                        onClick={() => handlePlayerSelect(p)}
                                    >
                                        <span className="player-name">{p.Player}</span>
                                        <span className="player-team">{p.Team}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {selectedPlayer && !loading && (
                    <motion.div
                        key={selectedPlayer.Player}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <motion.h1
                            className="player-title"
                            variants={fadeUp}
                            custom={0}
                        >
                            {selectedPlayer.Player}
                        </motion.h1>

                        <motion.section
                            className="player-info-section"
                            variants={fadeUp}
                            custom={1}
                        >
                            <h2 className="section-title">Player Info</h2>
                            <div className="player-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Team:</span>
                                    <span className="info-value team-badge">
                                        {selectedPlayer.Team} → {selectedPlayer.Team}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Age:</span>
                                    <span className="info-value">{selectedPlayer.Age}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">PA:</span>
                                    <span className="info-value">{selectedPlayer.PA}</span>
                                </div>
                            </div>
                        </motion.section>

                        {opsPrediction && (
                            <motion.section
                                className="prediction-summary-section"
                                variants={fadeUp}
                                custom={2}
                            >
                                <div className="prediction-header">
                                    <h2 className="section-title prediction-title">
                                        Prediction Summary{" "}
                                        <span className="model-badge">({selectedModelLabel})</span>
                                    </h2>
                                    <div className="model-selector">
                                        <label className="model-selector-label">Model:</label>
                                        <select
                                            className="model-select"
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                        >
                                            {MODEL_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="prediction-cards">
                                    <div className="prediction-card">
                                        <span className="prediction-label">Predicted 2025 OPS</span>
                                        <span className="prediction-value">
                                            {opsPrediction.Predicted.toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="prediction-card">
                                        <span className="prediction-label">Actual 2025 OPS</span>
                                        <span className="prediction-value">
                                            {opsPrediction.Actual.toFixed(3)}
                                        </span>
                                        <span
                                            className={`prediction-diff ${opsPrediction.Error < 0 ? "positive" : "negative"}`}
                                        >
                                            {opsPrediction.Error > 0 ? "+" : ""}
                                            {opsPrediction.Error.toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="prediction-card">
                                        <span className="prediction-label">Prediction Score</span>
                                        <span
                                            className="prediction-grade"
                                            style={{
                                                color: getGradeColor(
                                                    calculateGrade(opsPrediction.Predicted, opsPrediction.Actual),
                                                    colors.accent1,
                                                    colors.accentBlue,
                                                    colors.accent2,
                                                    colors.negative,
                                                ),
                                            }}
                                        >
                                            {calculateGrade(opsPrediction.Predicted, opsPrediction.Actual)}
                                        </span>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {chartData.length > 0 && (
                            <motion.section
                                className="history-section"
                                variants={fadeUp}
                                custom={3}
                            >
                                <h2 className="section-title">Historical Performance</h2>
                                <div className="history-chart-container">
                                    <div className="chart-scroll-wrapper">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <LineChart
                                                data={chartData}
                                                margin={{ top: 20, right: 80, bottom: 20, left: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                                                <XAxis
                                                    dataKey="Season"
                                                    tick={{ fill: colors.tickFill }}
                                                    tickFormatter={(val) => val.toString()}
                                                />
                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{ fill: colors.tickFill }}
                                                    tickFormatter={(val) => val.toFixed(2)}
                                                    label={{
                                                        value: "OPS",
                                                        angle: -90,
                                                        position: "insideLeft",
                                                        fill: colors.tickFill,
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: colors.tooltipBg,
                                                        border: `1px solid ${colors.tooltipBorder}`,
                                                        borderRadius: "8px",
                                                    }}
                                                    labelStyle={{ color: colors.tooltipText }}
                                                />
                                                <Legend
                                                    verticalAlign="top"
                                                    align="right"
                                                    wrapperStyle={{ paddingBottom: 20 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Actual"
                                                    stroke={colors.lineActual}
                                                    strokeWidth={2}
                                                    dot={{ fill: colors.lineActual, r: 5 }}
                                                    activeDot={{ r: 7 }}
                                                    name="Actual"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Predicted"
                                                    stroke={colors.linePredicted}
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={{ fill: colors.linePredicted, r: 5 }}
                                                    name="Prediction"
                                                    connectNulls={false}
                                                />
                                                {opsPrediction && (
                                                    <ReferenceDot
                                                        x={2025}
                                                        y={opsPrediction.Predicted}
                                                        r={6}
                                                        fill={colors.linePredicted}
                                                        stroke={colors.linePredicted}
                                                    />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <motion.div
                    className="search-loading-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="skeleton skeleton-player-name"></div>

                    <section className="skeleton-section">
                        <div className="skeleton skeleton-title" style={{ width: '120px' }}></div>
                        <div className="skeleton-info-grid">
                            <div className="skeleton skeleton-info-item"></div>
                            <div className="skeleton skeleton-info-item"></div>
                            <div className="skeleton skeleton-info-item"></div>
                        </div>
                    </section>

                    <section className="skeleton-section">
                        <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
                        <div className="skeleton-prediction-cards">
                            <div className="skeleton skeleton-prediction-card"></div>
                            <div className="skeleton skeleton-prediction-card"></div>
                            <div className="skeleton skeleton-prediction-card"></div>
                        </div>
                    </section>

                    <section className="skeleton-section">
                        <div className="skeleton skeleton-title" style={{ width: '180px' }}></div>
                        <div className="skeleton skeleton-history-chart"></div>
                    </section>
                </motion.div>
            )}

            {!selectedPlayer && !loading && (
                <motion.div
                    className="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <p>Search for a player to view their predictions and performance.</p>
                </motion.div>
            )}
        </div>
    );
}
