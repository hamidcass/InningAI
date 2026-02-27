import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Predictions from "./pages/Predictions";
import Search from "./pages/Search";
import NextSeason from "./pages/NextSeason";
import NotFound from "./pages/NotFound";

function BackgroundEffects() {
  return (
    <div className="bg-effects" aria-hidden="true">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />
      <div className="bg-grain" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundEffects />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/search" element={<Search />} />
        <Route path="/next-season" element={<NextSeason />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
