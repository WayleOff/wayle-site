// /offre : offre phare (page « offre » de l'admin si publiée, sinon page par défaut).
import { fixedPage, offreFallback } from "./_shared/fixedpage.js";
export const onRequestGet = fixedPage("offre", offreFallback);
