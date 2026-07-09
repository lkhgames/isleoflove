import { useEffect, useState } from "react";
import { fetchIslanders, type Islander } from "./api/client";
import { PwaUpdatePrompt } from "./PwaUpdatePrompt";
import "./App.css";

function App() {
  const [islanders, setIslanders] = useState<Islander[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIslanders()
      .then(setIslanders)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Isle of Love</h1>
      {error && <p role="alert">Couldn't reach the villa: {error}</p>}
      <ul aria-label="islanders">
        {islanders.map((islander) => (
          <li key={islander.id}>
            <strong>{islander.name}</strong> — {islander.bio}
          </li>
        ))}
      </ul>
      <PwaUpdatePrompt />
    </main>
  );
}

export default App;
