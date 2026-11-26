// /realisations : toutes les réalisations (page « realisations » de l'admin si publiée, sinon page par défaut).
import { fixedPage, realisationsFallback } from "./_shared/fixedpage.js";
export const onRequestGet = fixedPage("realisations", realisationsFallback);
