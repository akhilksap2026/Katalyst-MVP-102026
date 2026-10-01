export interface DictionaryColumn {
  name: string;
  oracleDataType: string;
  nullable: boolean;
  description: string;
}

export interface DictionaryForeignKey {
  columns: string[];
  references: {
    table: string;
    columns: string[];
  };
}

export interface DictionaryTable {
  alias: string;
  description: string;
  primaryKey: string[];
  foreignKeys: DictionaryForeignKey[];
  columns: DictionaryColumn[];
}

export interface DictionaryRelease {
  label: string;
  release: string;
  description: string;
  tables: Record<string, DictionaryTable>;
}

export interface DictionaryManifestEntry {
  id: string;
  file: string;
  label: string;
  status: "current" | "preview" | string;
}

export interface DictionaryManifest {
  label: string;
  description: string;
  releases: DictionaryManifestEntry[];
}

/** Columns every OTM table carries. */
export const FOOTPRINT_COLUMNS = [
  "INSERT_USER",
  "INSERT_DATE",
  "UPDATE_USER",
  "UPDATE_DATE",
] as const;

export function isFootprintColumn(name: string): boolean {
  return (FOOTPRINT_COLUMNS as readonly string[]).includes(name);
}

/** Flex field families: ATTRIBUTE1-20, ATTRIBUTE_NUMBER1-10, ATTRIBUTE_DATE1-10. */
export function isFlexColumn(name: string): boolean {
  return (
    /^ATTRIBUTE([1-9]|1[0-9]|20)$/.test(name) ||
    /^ATTRIBUTE_NUMBER([1-9]|10)$/.test(name) ||
    /^ATTRIBUTE_DATE([1-9]|10)$/.test(name)
  );
}

export type ColumnFamily = "core" | "flex" | "footprint";

export function columnFamily(name: string): ColumnFamily {
  if (isFootprintColumn(name)) return "footprint";
  if (isFlexColumn(name)) return "flex";
  return "core";
}
