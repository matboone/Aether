import type { NormalizedBillCategory } from "@/src/types/domain";

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, "_");
}

export function inferCategory(label: string): NormalizedBillCategory {
  const normalized = normalizeText(label);

  if (/(ct|mri|ultrasound|x ray|xray|imaging)/.test(normalized)) {
    return "imaging";
  }

  if (/(lab|panel|blood|test)/.test(normalized)) {
    return "lab";
  }

  if (/(physician|consult|doctor)/.test(normalized)) {
    return "physician";
  }

  if (/(iv|medication|drug|saline)/.test(normalized)) {
    return "medication";
  }

  if (/(facility|er|emergency|visit|room)/.test(normalized)) {
    return "facility";
  }

  return "other";
}
