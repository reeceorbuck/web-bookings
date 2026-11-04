import { app } from "./main.tsx";

Deno.serve({ port: Number(Deno.env.get("PORT")) || 3035 }, app.fetch);
