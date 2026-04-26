import { badRequest, json, kvGet } from "../../_lib/http.js";

export async function onRequestGet({ params, env }) {
  const record = await kvGet(env, `report:${params.id}`);
  if (!record) return badRequest("Report not found.");
  const { html, visibleText, mainContent, alsoAskedRaw, ...safeRecord } = record;
  return json(safeRecord);
}
