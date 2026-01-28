import { useState } from "react";
import { fetchPlayer } from "../api/api";

export default function PlayerSearch() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    try {
      const data = await fetchPlayer(name);
      setResults(data);
    } catch (err) {
      alert("Player not found");
    }
  };

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter player name"
      />
      <button onClick={handleSearch}>Search</button>

      {results && (
        <pre>{JSON.stringify(results, null, 2)}</pre>
      )}
    </div>
  );
}
