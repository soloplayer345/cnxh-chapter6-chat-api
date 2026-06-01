import fs from "fs/promises";
import { DatasetRecord } from "../types/ai.types";
import { countKeywordMatches, extractKeywords } from "../utils/text.util";
import { getDataFilePath } from "../utils/path.util";

const DATASET_FILE = "chuong_6_dan_toc_ton_giao_dataset.json";

let cachedDataset: DatasetRecord[] | null = null;

type DatasetFile =
  | DatasetRecord[]
  | {
      records: DatasetRecord[];
    };

function normalizeRecord(raw: DatasetRecord): DatasetRecord {
  return {
    id: raw.id,
    instruction: raw.instruction?.trim() ?? "",
    input: raw.input?.trim() || undefined,
    output: raw.output?.trim() ?? "",
    tags: raw.tags,
  };
}

function recordSearchText(record: DatasetRecord): string {
  const parts = [record.instruction, record.input ?? "", record.output];
  if (record.tags?.length) {
    parts.push(record.tags.join(" "));
  }
  return parts.join(" ");
}

/** Load dataset JSON từ file */
export async function loadDataset(): Promise<DatasetRecord[]> {
  if (cachedDataset) {
    return cachedDataset;
  }

  const filePath = getDataFilePath(DATASET_FILE);
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as DatasetFile;

  const records = Array.isArray(data) ? data : data.records;
  cachedDataset = records
    .map(normalizeRecord)
    .filter((r) => r.instruction && r.output);

  return cachedDataset;
}

/** Điểm tối thiểu để coi câu hỏi thuộc phạm vi Chương 6 (keyword matching) */
export const MIN_RELEVANCE_SCORE = 2;

export interface RelevantRecordsResult {
  records: DatasetRecord[];
  bestScore: number;
  isRelevant: boolean;
}

function scoreRecord(
  record: DatasetRecord,
  keywords: string[]
): number {
  const text = recordSearchText(record);
  const totalScore = countKeywordMatches(text, keywords);
  const instructionScore = countKeywordMatches(record.instruction, keywords);
  return totalScore + instructionScore;
}

/** Tìm record liên quan + đánh giá có thuộc phạm vi dataset hay không */
export async function findRelevantRecordsWithScore(
  question: string,
  limit: number = 5
): Promise<RelevantRecordsResult> {
  const dataset = await loadDataset();
  const keywords = extractKeywords(question);

  if (keywords.length === 0) {
    return { records: [], bestScore: 0, isRelevant: false };
  }

  const scored = dataset
    .map((record) => ({
      record,
      score: scoreRecord(record, keywords),
    }))
    .sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score ?? 0;
  const isRelevant = bestScore >= MIN_RELEVANCE_SCORE;

  if (!isRelevant) {
    return { records: [], bestScore, isRelevant: false };
  }

  return {
    records: scored
      .filter((item) => item.score > 0)
      .slice(0, limit)
      .map((item) => item.record),
    bestScore,
    isRelevant: true,
  };
}

/** Tìm các record liên quan nhất theo keyword matching */
export async function findRelevantRecords(
  question: string,
  limit: number = 5
): Promise<DatasetRecord[]> {
  const { records } = await findRelevantRecordsWithScore(question, limit);
  return records;
}

/** Format context từ các record cho prompt */
export function formatRecordsAsContext(records: DatasetRecord[]): string {
  return records
    .map((r, i) => {
      const question = r.input
        ? `${r.instruction}\n(Bổ sung: ${r.input})`
        : r.instruction;
      return `[${i + 1}] Câu hỏi mẫu: ${question}\nTrả lời: ${r.output}`;
    })
    .join("\n\n");
}
