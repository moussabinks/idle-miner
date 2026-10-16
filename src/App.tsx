// La page du jeu : elle assemble les composants et relie les boutons aux actions.

import { useState } from 'react'
import { Hud } from './composants/Hud'
import { Inventaire } from './composants/Inventaire'
import { PanneauBoutique, PanneauEnchanter, PanneauPioches, PanneauSucces } from './composants/Panneaux'
import { Toasts } from './composants/Toasts'
import { Victoire } from './composants/Victoire'
import { VueMine } from './composants/VueMine'
import { apercuVente, vendre } from './jeu/mineur'
import { SUCCES } from './jeu/succes'
import { usePartie } from './usePartie'

type Onglet = 'pioches' | 'boutique' | 'enchant' | 'succes'

const ONGLETS: { id: Onglet; titre: string }[] = [
  { id: 'pioches', titre: '🧰 Pioches' },
  { id: 'boutique', titre: '🛒 Boutique' },
  { id: 'enchant', titre: '✨ Enchanter' },
  { id: 'succes', titre: '🏅 Succès' },
]

function App() {
  const { etat, toasts, gains, enMinage, jouer, creuser, arreter, recommencer, passerPrestige } = usePartie()
  const [onglet, setOnglet] = useState<Onglet>('pioches')
  const [victoireFermee, setVictoireFermee] = useState(false)

  const gainVente = apercuVente(etat).gain

  function demanderRecommencer() {
    if (window.confirm('Effacer ta partie et tout recommencer (succès compris) ?')) {
      recommencer()
      setVictoireFermee(false)
    }
  }

  function faireLePrestige() {
    passerPrestige()
    setVictoireFermee(false)
  }

  return (
    <div className="jeu">
      <h1 className="titre">⛏️ Idle Miner</h1>
      <Hud etat={etat} />

      <main className="plateau">
        <div className="colonne-mine">
          <VueMine etat={etat} enMinage={enMinage} gains={gains} />

          <div className="actions">
            {etat.victoire ? (
              <button className="bouton bouton-principal" onClick={faireLePrestige}>
                ⭐ Passer prestige {etat.prestige + 1}
              </button>
            ) : enMinage ? (
              <button className="bouton bouton-stop" onClick={arreter}>
                ⏹️ Arrêter
              </button>
            ) : (
              <>
                <button className="bouton bouton-principal" onClick={() => creuser(1)}>
                  ⛏️ Creuser
                </button>
                <button className="bouton" onClick={() => creuser(10)}>
                  ⛏️ Creuser x10
                </button>
              </>
            )}
            <button className="bouton bouton-vendre" disabled={gainVente === 0} onClick={() => jouer(vendre)}>
              💰 Vendre {gainVente > 0 && `+${gainVente.toLocaleString('fr-FR')} $`}
            </button>
          </div>
        </div>

        <div className="colonne-panneaux">
          <section className="carte panneau">
            <nav className="onglets" role="tablist">
              {ONGLETS.map((o) => (
                <button
                  key={o.id}
                  role="tab"
                  aria-selected={onglet === o.id}
                  className={`onglet ${onglet === o.id ? 'actif' : ''}`}
                  onClick={() => setOnglet(o.id)}
                >
                  {o.titre}
                  {o.id === 'succes' && ` ${etat.succes.length}/${SUCCES.length}`}
                </button>
              ))}
            </nav>
            <div className="panneau-contenu" role="tabpanel">
              {onglet === 'pioches' && <PanneauPioches etat={etat} jouer={jouer} />}
              {onglet === 'boutique' && <PanneauBoutique etat={etat} jouer={jouer} />}
              {onglet === 'enchant' && <PanneauEnchanter etat={etat} jouer={jouer} />}
              {onglet === 'succes' && <PanneauSucces etat={etat} />}
            </div>
          </section>

          <Inventaire etat={etat} />
        </div>
      </main>

      <footer className="pied">
        <span>Partie sauvegardée automatiquement dans ce navigateur.</span>
        <button className="lien" onClick={demanderRecommencer}>
          Recommencer à zéro
        </button>
      </footer>

      {etat.victoire && !victoireFermee && (
        <Victoire etat={etat} onPrestige={faireLePrestige} onFermer={() => setVictoireFermee(true)} />
      )}
      <Toasts toasts={toasts} />
    </div>
  )
}

export default App
