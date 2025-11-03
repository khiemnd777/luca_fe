// Lightweight AutoMapper for TS

export type ConvertFn<S = any, T = any> = (value: any, source: S) => T;

export type FieldRule =
  | { kind: "map"; from: string; to: string }
  | { kind: "ignore"; prop: string }
  | { kind: "convert"; from: string; to: string; convert: ConvertFn }
  | { kind: "const"; to: string; value: any };

export type NamingStrategy = "snake_to_camel" | "camel_to_snake" | "none";

export interface Profile {
  name: string;
  // default naming strategies when no explicit rule:
  dtoToModelNaming?: NamingStrategy; // e.g. snake_to_camel
  modelToDtoNaming?: NamingStrategy; // e.g. camel_to_snake
  // field-level overrides:
  rules?: FieldRule[];
}

type Profiles = Record<string, Profile>;

export class AutoMapper {
  private profiles: Profiles = {};

  register(profile: Profile) {
    this.profiles[profile.name] = profile;
    return this;
  }

  map<S, T>(profileName: string, src: S, direction: "dto_to_model" | "model_to_dto" = "dto_to_model"): T {
    const profile = this.profiles[profileName];
    if (!profile) throw new Error(`Profile '${profileName}' not found`);

    const naming: NamingStrategy =
      direction === "dto_to_model"
        ? profile.dtoToModelNaming ?? "none"
        : profile.modelToDtoNaming ?? "none";

    const rules = profile.rules ?? [];

    const mapOne = (obj: any): any => {
      if (obj == null) return obj;
      if (Array.isArray(obj)) return obj.map(mapOne);
      if (typeof obj !== "object") return obj;

      const srcKeys = Object.keys(obj);
      const ignored = new Set(
        rules
          .filter((r): r is Extract<FieldRule, { kind: "ignore" }> => r.kind === "ignore")
          .map((r) => r.prop)
      );

      const explicitMaps = rules.filter((r): r is Extract<FieldRule, { kind: "map" | "convert" | "const" }> => r.kind !== "ignore");

      const out: any = {};

      // 1) explicit const
      for (const r of explicitMaps) {
        if (r.kind === "const") {
          out[r.to] = (r as any).value;
        }
      }

      // 2) explicit map/convert
      for (const r of explicitMaps) {
        if (r.kind === "map") {
          const v = (obj as any)[r.from];
          out[r.to] = mapOne(v);
        } else if (r.kind === "convert") {
          const v = (obj as any)[r.from];
          out[r.to] = r.convert(mapOne(v), obj);
        }
      }

      // 3) implicit by naming strategy
      for (const k of srcKeys) {
        if (ignored.has(k)) continue;
        // if already covered by explicit rule, skip
        const already = explicitMaps.some((r) => (r.kind === "map" || r.kind === "convert") && r.from === k);
        if (already) continue;

        const destKey = applyNaming(k, naming);
        out[destKey] = mapOne((obj as any)[k]);
      }

      return out;
    };

    return mapOne(src);
  }
}

/* ---------- helpers ---------- */

export function snakeToCamel(s: string) {
  return s.replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}
export function camelToSnake(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}
function applyNaming(key: string, strategy: NamingStrategy) {
  switch (strategy) {
    case "snake_to_camel": return snakeToCamel(key);
    case "camel_to_snake": return camelToSnake(key);
    default: return key;
  }
}

// Factory singleton
export const mapper = new AutoMapper();

// Convenience rule builders
export const map = (from: string, to: string): FieldRule => ({ kind: "map", from, to });
export const ignore = (prop: string): FieldRule => ({ kind: "ignore", prop });
export const convert = (from: string, to: string, fn: ConvertFn): FieldRule => ({ kind: "convert", from, to, convert: fn });
export const konst = (to: string, value: any): FieldRule => ({ kind: "const", to, value });
