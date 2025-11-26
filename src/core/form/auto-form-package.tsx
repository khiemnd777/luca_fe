import { camelToSnake } from "@root/shared/utils/string.utils";

export type MetaBlock = {
  meta: {
    prop?: string;
    metadata?: { collection: string };
  };
  fields: { name: string }[];
};

/* ======================================================
   PACKAGE DATA — FULL & FINAL
   ====================================================== */
export function packageData(metaBlocks: MetaBlock[], values: any) {
  // -----------------------------------------------------
  // 1) BUILD dto (root + nested)
  // -----------------------------------------------------
  const flat: Record<string, any> = { ...values };
  const nested = buildNestedPayload(flat);
  const dto: any = { ...extractRoot(flat), ...nested };

  // normalize toàn bộ
  normalizeObject(dto);

  // -----------------------------------------------------
  // 2) PREPARE OUTPUT
  // -----------------------------------------------------
  const output: {
    dto: Record<string, any>;
    collections: string[];
  } = {
    dto: {},
    collections: [],
  };

  const nestedOut: Record<
    string,
    { dto: Record<string, any>; collections: string[] }
  > = {};

  // collect root / nested collections
  for (const b of metaBlocks) {
    const coll = b.meta.metadata?.collection;
    if (!coll) continue;

    if (!b.meta.prop) {
      output.collections.push(coll);
    } else {
      if (!nestedOut[b.meta.prop]) {
        nestedOut[b.meta.prop] = { dto: {}, collections: [] };
      }
      nestedOut[b.meta.prop].collections.push(coll);
    }
  }

  // -----------------------------------------------------
  // 3) ROOT DTO (snake keys)
  // -----------------------------------------------------
  for (const [k, v] of Object.entries(dto)) {
    const isNestedProp = metaBlocks.some((b) => b.meta.prop === k);
    if (!isNestedProp) {
      output.dto[camelToSnake(k)] = v;
    }
  }

  // -----------------------------------------------------
  // 4) ATTACH NESTED DTOs (snake prop)
  // -----------------------------------------------------
  for (const [prop, obj] of Object.entries(nestedOut)) {
    obj.dto = dto[prop] ?? {};

    const upsertProp = camelToSnake(prop + "Upsert");
    output.dto[upsertProp] = {
      dto: obj.dto,
      collections: obj.collections,
    };

  }

  return output;
}

/* ======================================================
   HELPERS — EXACT SERVER NORMALIZATION
   ====================================================== */

function extractRoot(flat: Record<string, any>) {
  const out: any = {};
  for (const [k, v] of Object.entries(flat)) {
    if (!k.includes(".")) out[k] = v;
  }
  return out;
}

function buildNestedPayload(flat: Record<string, any>) {
  const out: any = {};
  for (const [k, v] of Object.entries(flat)) {
    if (!k.includes(".")) continue;

    const parts = k.split(".");
    let cur = out;

    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!(p in cur)) cur[p] = {};
      cur = cur[p];
    }

    cur[parts[parts.length - 1]] = v;
  }
  return out;
}

function normalizeObject(obj: any) {
  if (!obj || typeof obj !== "object") return;

  // -------------------------------------------------
  // customFields → custom_fields (snake keys)
  // -------------------------------------------------
  if (obj.customFields && typeof obj.customFields === "object") {
    obj.custom_fields = {};
    for (const [k, v] of Object.entries(obj.customFields)) {
      obj.custom_fields[camelToSnake(k)] = v;
    }
    delete obj.customFields;
  }

  // -------------------------------------------------
  // relationFields → core + custom_fields (snake keys)
  // XÓA relation_fields KHÔNG GỬI LÊN SERVER
  // -------------------------------------------------
  const rel = obj.relationFields ?? obj.relation_fields;
  if (rel && typeof rel === "object") {
    for (const [k, v] of Object.entries(rel)) {
      const sk = camelToSnake(k);

      // core snake
      obj[sk] = v;

      // custom_fields snake
      if (!obj.custom_fields) obj.custom_fields = {};
      obj.custom_fields[sk] = v;
    }

    // DELETE relation fields hoàn toàn
    delete obj.relationFields;
    delete obj.relation_fields;
  }

  // -------------------------------------------------
  // recursion
  // -------------------------------------------------
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") normalizeObject(v);
  }
}
