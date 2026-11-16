import { difficultyKeys, type TranslationKey } from "@/i18n";
import type { CsvLabels } from "@/utils/exportImport";

/** Translated column headers and difficulty names for CSV exports. */
export function csvLabels(t: (key: TranslationKey) => string): CsvLabels {
  return {
    date: t("csv.date"),
    ritual: t("csv.ritual"),
    difficulty: t("csv.difficulty"),
    essence: t("csv.essence"),
    unknown: t("csv.unknown"),
    difficultyName: (difficulty) => t(difficultyKeys[difficulty]),
  };
}
