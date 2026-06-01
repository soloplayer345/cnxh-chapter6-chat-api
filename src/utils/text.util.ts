/** Chuẩn hóa văn bản để so khớp từ khóa đơn giản */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()"'\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tách câu hỏi thành danh sách từ khóa (bỏ từ quá ngắn) */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(" ").filter((w) => w.length > 1);
  return [...new Set(words)];
}

/** Đếm số keyword xuất hiện trong một đoạn văn */
export function countKeywordMatches(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  return keywords.reduce((score, keyword) => {
    return normalized.includes(keyword) ? score + 1 : score;
  }, 0);
}
