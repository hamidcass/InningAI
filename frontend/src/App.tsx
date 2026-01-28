import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Models from "./pages/Models";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: "10px", borderBottom: "1px solid gray" }}>
        <Link to="/">Player Search</Link> |{" "}
        <Link to="/models">Model Performance</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models" element={<Models />} />
      </Routes>
    </BrowserRouter>
  );
}
