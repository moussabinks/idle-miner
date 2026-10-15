import { PIOCHES } from './jeu/donnees'

function App() {
  return (
    <main className="accueil">
      <h1>⛏️ Idle Miner</h1>
      <p>Creuse jusqu'à la bedrock (-64 m). Le jeu arrive bientôt !</p>
      <ul className="pioches">
        {PIOCHES.map((p) => (
          <li key={p.niveau}>
            <strong>{p.nom}</strong> · x{p.vitesse} · jusqu'à -{p.profMax} m
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
