// /blog : page « blog » de l'admin si publiée, sinon page d'attente (non indexée).
import { fixedPage, blogFallback } from "./_shared/fixedpage.js";
export const onRequestGet = fixedPage("blog", blogFallback);
