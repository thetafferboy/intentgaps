import { countries, languages } from "../_lib/geo.js";
import { json } from "../_lib/http.js";

export async function onRequestGet() {
  return json({ countries, languages });
}
