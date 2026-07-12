import {
  replaceState,
  replaceStateFromJsonText,
  requireSession,
  response,
  stateStore,
} from "./_shared.mjs";

const IMPORT_PREFIX = "state-import";
const MAX_CHUNKS = 2000;
const MAX_CHUNK_CHARS = 750_000;

function validImportId(value) {
  return typeof value === "string" && /^[a-z0-9-]{8,80}$/i.test(value);
}

function validChunkTotal(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_CHUNKS;
}

function metaKey(importId) {
  return `${IMPORT_PREFIX}-${importId}-meta`;
}

function chunkKey(importId, index) {
  return `${IMPORT_PREFIX}-${importId}-${String(index).padStart(5, "0")}`;
}

function badRequest(message) {
  return response({ ok: false, error: message }, 400);
}

async function cleanupImport(store, importId, totalChunks) {
  const deletes = [store.delete(metaKey(importId))];
  for (let index = 0; index < totalChunks; index += 1) {
    deletes.push(store.delete(chunkKey(importId, index)));
  }
  await Promise.allSettled(deletes);
}

async function handleChunkedImport(body) {
  const store = stateStore();
  const action = body?.action;
  const importId = body?.importId;
  const totalChunks = Number(body?.totalChunks);

  if (!validImportId(importId)) return badRequest("Importacion invalida: id de respaldo incorrecto.");
  if (!validChunkTotal(totalChunks)) return badRequest("Importacion invalida: cantidad de partes incorrecta.");

  if (action === "start") {
    await cleanupImport(store, importId, totalChunks);
    await store.setJSON(metaKey(importId), {
      totalChunks,
      byteLength: Number(body?.byteLength) || 0,
      createdAt: new Date().toISOString(),
    });
    return response({ ok: true });
  }

  const meta = await store.get(metaKey(importId), { type: "json", consistency: "strong" });
  if (!meta || meta.totalChunks !== totalChunks) {
    return badRequest("Importacion invalida: primero inicia la carga del respaldo.");
  }

  if (action === "chunk") {
    const index = Number(body?.index);
    const chunk = body?.chunk;
    if (!Number.isInteger(index) || index < 0 || index >= totalChunks) {
      return badRequest("Importacion invalida: parte fuera de rango.");
    }
    if (typeof chunk !== "string" || chunk.length > MAX_CHUNK_CHARS) {
      return badRequest("Importacion invalida: parte demasiado grande.");
    }
    await store.set(chunkKey(importId, index), chunk);
    return response({ ok: true, index });
  }

  if (action === "finish") {
    const chunks = [];
    for (let index = 0; index < totalChunks; index += 1) {
      const chunk = await store.get(chunkKey(importId, index), { type: "text", consistency: "strong" });
      if (typeof chunk !== "string") {
        return badRequest(`Importacion incompleta: falta la parte ${index + 1}/${totalChunks}.`);
      }
      chunks.push(chunk);
    }

    await replaceStateFromJsonText(chunks.join(""));
    await cleanupImport(store, importId, totalChunks);
    return response({ ok: true });
  }

  return badRequest("Importacion invalida: accion desconocida.");
}

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;

  if (request.method !== "PUT" && request.method !== "POST") {
    return response({ ok: false, error: "Metodo no permitido." }, 405);
  }

  try {
    const body = await request.json();

    if (body?.action) {
      return await handleChunkedImport(body);
    }

    const nextState = body?.state;
    if (!nextState || typeof nextState !== "object") {
      return response({ ok: false, error: "Estado invalido." }, 400);
    }
    await replaceState(nextState);
    return response({ ok: true });
  } catch (error) {
    return response({
      ok: false,
      error: error.message || "No se pudo guardar el respaldo en Netlify.",
    }, 500);
  }
};
