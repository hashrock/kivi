/* eslint-disable @typescript-eslint/naming-convention */
// @ts-nocheck

import "https://deno.land/std@0.203.0/dotenv/load.ts";
import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";
import superjson from "npm:superjson";

let db = await Deno.openKv();

// DB can take URL:
// https://api.deno.com/databases/[UUID]/connect

type MessageType = "list" | "changeDatabase" | "get" | "set" | "delete";

interface RequestJson {
  type: MessageType;
  key?: Deno.KvKey;
  value?: unknown;
  database?: string;
}

const handler = async (request: Request): Promise<Response> => {
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (method !== "POST") {
    return new Response("Only POST is supported", { status: 400 });
  }

  const url = new URL(request.url);
  const body = await request.text();

  const { type, key, value, database } = superjson.parse<RequestJson>(body);

  if (type === "list") {
    try {
      const keys = db.list({
        prefix: key ?? [],
      }, {
        limit: 100,
      });

      const result = [];
      for await (const key of keys) {
        result.push(key);
      }

      return new Response(superjson.stringify(result), { status: 200 });
    } catch (e) {
      return new Response(
        "Failed to list items: " + e.message,
        { status: 500 },
      );
    }
  }
  // http://localhost:8080/?type=set&key=foo,bar&value=hello
  if (type === "set" && key) {
    try {
      await db.set(key, value);
      const result = {
        result: "OK",
      };
      return new Response(superjson.stringify(result), { status: 200 });
    } catch (e) {
      return new Response(
        "Failed to set item: " + e.message,
        { status: 500 },
      );
    }
  }

  // http://localhost:8080/?type=get&key=foo,bar
  if (type === "get" && key) {
    try {
      const value = await db.get(key);
      return new Response(superjson.stringify(value), { status: 200 });
    } catch (e) {
      return new Response(
        "Failed to get item: " + e.message,
        { status: 500 },
      );
    }
  }

  if (type === "delete" && key) {
    try {
      await db.delete(key);
      const result = {
        result: "OK",
      };
      return new Response(superjson.stringify(result), { status: 200 });
    } catch (e) {
      return new Response(
        "Failed to delete item: " + e.message,
        { status: 500 },
      );
    }
  }

  if (type === "changeDatabase") {
    // Reload .env to get latest DENO_KV_ACCESS_TOKEN
    load();

    try {
      if (database) {
        db = await Deno.openKv(database);
      } else {
        db = await Deno.openKv();
      }
    } catch (e) {
      return new Response(
        "Failed to change database: " + e.message,
        { status: 500 },
      );
    }

    const result = {
      result: "OK",
      database: database,
    };
    return new Response(JSON.stringify(result), { status: 200 });
  }

  return new Response(`KV Viewer Server`, { status: 200 });
};

Deno.serve({
  port: 0,
  onListen(s) {
    console.log(`Listening on port ${s.port}`);
  },
}, handler);
