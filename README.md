# wayle-site
Site Wayle

## Menus, pied de page, réalisations (admin → Menus)
- `config.menus` (collection `s_config`) pilote l'en-tête, le bouton d'action et le pied de page ; sans cette clé, les menus statiques des pages HTML s'appliquent. Rendu : `site.js` (`menus()`), aperçu en direct par `postMessage` (`wayle-menus`).
- Un lien du pied de page qui pointe vers la page affichée est masqué (ex. « Espace client » sur /espace-client).
- `/realisations` et `/blog` : si une page `realisations` / `blog` est publiée dans Admin → Pages, elle est affichée ; sinon page par défaut (`functions/_shared/fixedpage.js`).
- `/gestion` redirige vers `config.gestionUrl` (https, wayle.fr ou vercel.app) quand il est renseigné (`functions/gestion.js`).
- Bouton « Voir toutes les réalisations » de l'accueil : champs `moreL` / `moreU` du bloc Références.
