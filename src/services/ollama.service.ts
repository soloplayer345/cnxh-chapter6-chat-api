import axios from "axios";
import { OllamaGenerateResponse } from "../types/ai.types";

const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:0.8b";

/** Gọi Ollama generate API, trả về text answer */
export async function generateAnswer(prompt: string): Promise<string> {
  try {
    const { data } = await axios.post<OllamaGenerateResponse>(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        think: false,
        options: { num_predict: 512 },
      },
      {
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return (data.response ?? "").trim();
  } catch (error) {
    const err = new Error(
      "Cannot connect to Ollama. Please make sure Ollama is running."
    ) as Error & { isOllamaError: boolean };
    err.isOllamaError = true;
    throw err;
  }
}
