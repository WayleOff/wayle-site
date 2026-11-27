// /cgv : page « cgv » de l'admin si publiée, sinon texte par défaut (functions/_shared/legal.js).
import { fixedPage } from "./_shared/fixedpage.js";
import { cgvFallback } from "./_shared/legal.js";
export const onRequestGet = fixedPage("cgv", cgvFallback);
