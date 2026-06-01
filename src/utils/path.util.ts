import path from "path";

/** Đường dẫn thư mục data (luôn trỏ tới src/data từ project root) */
export function getDataFilePath(filename: string): string {
  return path.join(process.cwd(), "src", "data", filename);
}
