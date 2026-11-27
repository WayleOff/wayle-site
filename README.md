# wayle-site
Site Wayle

## Menus, pied de page, réalisations (admin → Menus)
- `config.menus` (collection `s_config`) pilote l'en-tête, le bouton d'action et le pied de page ; sans cette clé, les menus statiques des pages HTML s'appliquent. Rendu : `site.js` (`menus()`), aperçu en direct par `postMessage` (`wayle-menus`).
- Un lien du pied de page qui pointe vers la page affichée est masqué (ex. « Espace client » sur /espace-client).
- `/realisations` et `/blog` : si une page `realisations` / `blog` est publiée dans Admin → Pages, elle est affichée ; sinon page par défaut (`functions/_shared/fixedpage.js`).
- `/gestion` redirige vers `config.gestionUrl` (https, wayle.fr ou vercel.app) quand il est renseigné (`functions/gestion.js`).
- Bouton « Voir toutes les réalisations » de l'accueil : champs `moreL` / `moreU` du bloc Références.

## Blog (admin → Blog)
- Articles dans D1, collection `s_blog` (un document par article, identifiant = adresse) : titre, description, date, catégorie, image de couverture, contenu, publié.
- Pages publiques : `/blog` (liste), `/blog/<adresse>` (article, JSON-LD BlogPosting, Open Graph, canonical), `/blog/rss.xml`, `/sitemap.xml` (aussi référencé dans robots.txt).
- Un article publié avec une date future est caché jusqu'à ce jour-là. Brouillons et programmés : visibles seulement avec `?preview=1` (admin connecté).
- Contenu : paragraphes séparés par une ligne vide, `## Titre`, `### Sous-titre`, `- liste`, `**gras**`, `[texte](lien)`, `![description](id-image)`, adresse YouTube/Vimeo seule sur une ligne. Tout le reste est échappé (pas de HTML libre).
- Sans article publié, `/blog` affiche la page d'attente (ou la page « blog » d'Admin → Pages si publiée).

## Offre phare (/offre)
- `/offre` : page par défaut rendue avec les blocs du site (`offreFallback` dans `functions/_shared/fixedpage.js`) ; remplaçable en publiant une page `offre` dans Admin → Pages. Aucun prix affiché.
- Accueil : bloc « Offre phare » en tête de la section Offres (`feature()` dans `functions/_shared/home.js`), affiché par défaut ; masquable ou modifiable dans le bloc Offres de l'accueil (champs `featOff`, `featTitle`, `featText`, `featLabel`, `featUrl`).
- Le bouton « Offres » du menu mène à `/offre` (modifiable dans Admin → Menus).
