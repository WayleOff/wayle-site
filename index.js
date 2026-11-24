import { validate } from "../tokens/validate.js";
import { compile } from "./compile.js";
/* thème stocké (écarts) → CSS. En cas d'erreur de validation : les valeurs invalides sont ignorées (défauts). */
export function cssFromStored(stored) {
  const { theme } = validate(stored && typeof stored === "object" ? stored : {});
  return compile(theme);
}
export { validate, compile };
