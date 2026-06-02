# Portfolio Mathieu Grosshans — Cérémonie des Oscars

Site portfolio cinématographique, style Apple (vidéos scrubbées au scroll,
fluidité) avec boutons **Liquid Glass**. Les 4 plans sont fondus l'un dans
l'autre pour donner l'illusion d'**une seule et même vidéo continue**.

## Comment ça marche
Un seul plateau « film » est épinglé à l'écran ; les 4 vidéos y sont
superposées. Une unique timeline de scroll pilote à la fois :
- la **lecture image par image** de chaque vidéo (technique Apple) ;
- un **fondu enchaîné** (cross-dissolve) entre une scène et la suivante :
  la dernière image d'un plan se dissout dans la première du plan suivant.

Vidéos ré-encodées en **CRF 18** (quasi sans perte) avec des **images-clés
tous les 0,25 s**, ce qui rend le « scrubbing » fluide dans les deux sens
sans alourdir la navigation.

## Les scènes
1. **Accueil** — le rideau s'ouvre au scroll · *Portfolio Mathieu Grosshans*.
2. **Le discours** — bulles Liquid Glass *Mon parcours* / *Mon projet professionnel*.
3. **Les coulisses** — 5 statuettes = 5 compétences (points alignés) :
   Vente · Marketing · Business Développement · Management de la relation client · Automatisation.
4. **L'enveloppe** — bulle Liquid Glass vers https://www.skema.edu/en.

Le menu en haut à droite amène directement sur la **dernière image** de
chaque scène (contenu révélé, image figée).

## Structure
```
site/
├── index.html      ← le film (4 calques superposés)
├── styles.css      ← thème + Liquid Glass + fondus + responsive
├── script.js       ← timeline unique : scrub + cross-dissolve + nav
├── assets/         ← vidéos (CRF18, faststart) + posters
└── pages/          ← cibles des boutons (gabarits à développer)
```

## Lancer / héberger
Les vidéos doivent être servies par un serveur (le `file://` peut bloquer la lecture) :
```
cd site
python3 -m http.server 8000   →   http://localhost:8000
```
Mise en ligne : déposez le dossier `site/` sur Netlify, Vercel ou GitHub Pages.

## Réglages utiles (dans script.js / styles.css)
- `SEG`, `SCRUB`, `FADE` (script.js) : durée de chaque scène, moment où l'image
  se fige, et largeur du fondu enchaîné.
- `navP(k)` (script.js) : point d'atterrissage du menu (dernière image par défaut).
- `--x` sur chaque `.statue-btn` (index.html) : position horizontale des points.
- `top:58%` de `.statue-btn` (styles.css) : la ligne commune des points.
- `revealRules` (script.js) : moment d'apparition des boutons.
- hauteur `.film-wrap` (styles.css, 1320vh) : longueur totale du scroll.
