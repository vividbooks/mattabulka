import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-df5dd726/health", (c) => {
  return c.json({ status: "ok" });
});

app.get('/make-server-df5dd726/elements', async (c) => {
  try {
    const elements = await kv.getByPrefix('element:');
    return c.json(elements);
  } catch (e: any) {
    console.error('Error fetching elements:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.post('/make-server-df5dd726/element', async (c) => {
  try {
    const data = await c.req.json();
    const { id } = data;
    if (!id) return c.json({ error: 'Missing id' }, 400);
    
    await kv.set(`element:${id}`, data);
    return c.json({ success: true });
  } catch (e: any) {
    console.error('Error saving element:', e);
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/make-server-df5dd726/elements/:id', async (c) => {
  const id = c.req.param('id');
  await kv.del(`element:${id}`);
  return c.json({ success: true });
});

app.delete('/make-server-df5dd726/elements', async (c) => {
  try {
    const elements = await kv.getByPrefix('element:');
    const keys = elements.map((e: any) => `element:${e.id}`);
    if (keys.length > 0) {
      await kv.mdel(keys);
    }
    return c.json({ success: true });
  } catch (e: any) {
    console.error('Error clearing elements:', e);
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);