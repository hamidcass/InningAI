
// TODO: change to deployment URL when deploying
const BASE_URL = "http://127.0.0.1:8000";

export async function fetchPlayer(playerName: string) {
    const res = await fetch(`${BASE_URL}/player/${encodeURIComponent(playerName)}`);
    return res.json();
    
}

export async function fetchPredictions(stat: string, model: string, limit=20) {
    const res = await fetch(`${BASE_URL}/predictions?stat=${stat}&model=${model}&limit=${limit}`);
    return res.json();
}

export async function fetchMeta() {
    const res = await fetch(`${BASE_URL}/meta`);
    return res.json();
}