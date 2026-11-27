// /cgu : page « cgu » de l'admin si publiée, sinon texte par défaut (functions/_shared/legal.js).
import { fixedPage } from "./_shared/fixedpage.js";
import { cguFallback } from "./_shared/legal.js";
export const onRequestGet = fixedPage("cgu", cguFallback);
