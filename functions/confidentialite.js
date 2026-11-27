// /confidentialite : page « confidentialite » de l'admin si publiée, sinon texte par défaut (functions/_shared/legal.js).
import { fixedPage } from "./_shared/fixedpage.js";
import { confidentialiteFallback } from "./_shared/legal.js";
export const onRequestGet = fixedPage("confidentialite", confidentialiteFallback);
