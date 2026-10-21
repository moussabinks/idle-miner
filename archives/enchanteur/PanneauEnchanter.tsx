// Archivé le 22/10 : le panneau de l'enchanteur (le bâtiment est retiré du jeu pour l'instant).
// Il dépendait de coutEnchantement, enchanter... de l'ancien src/jeu/mineur.ts (voir l'historique git).

export function PanneauEnchanter({ etat, jouer }: PropsPanneau) {
  return (
    <div className="liste-cartes">
      <p className="discret">
        Les enchantements s'appliquent à toutes tes pioches et sont gardés au prestige. Leurs niveaux se débloquent petit à petit, prestige après
        prestige. Tu as {quantite(etat, 'lapis')} 🔷 lapis et {quantite(etat, 'emeraude')} 💚 émeraudes.
      </p>
      {LISTE_ENCHANTEMENTS.map((id) => {
        const e = ENCHANTEMENTS[id]
        const niveau = etat.enchantements[id]
        const cout = coutEnchantement(etat, id)
        return (
          <div key={id} className="ligne-achat">
            <strong>✨ {e.nom}</strong>
            <span className="discret">{e.description}</span>
            <Amelioration
              etat={etat}
              actuel={niveau === 0 ? 'Pas encore enchantée' : `${e.nom} ${chiffreRomain(niveau)}`}
              niveau={niveau}
              niveauMax={e.niveauMax}
              niveauPermis={niveauMaxAuPrestige(id, etat.prestige)}
              suivant={cout && { cout, texte: `✨ Enchanter ${chiffreRomain(niveau + 1)}` }}
              bloqueAuPrestige={enchantementBloqueAuPrestige(etat, id)}
              possible={peutEnchanter(etat, id)}
              onAmeliorer={() => jouer((x) => enchanter(x, id))}
              genre="enchanter"
            />
          </div>
        )
      })}
    </div>
  )
}

