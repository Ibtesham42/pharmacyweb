// Server-only document text extraction for the AI assistant.
// PDF via unpdf (bundles pdf.js), DOCX via mammoth, TXT directly. No storage.
import mammoth from "mammoth";

// pdf.js (used by unpdf) calls Promise.withResolvers, added in Node 22. Polyfill
// for older runtimes so PDF extraction works locally and on Vercel.
type PromiseWithResolvers = {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
  };
};
const PromiseCtor = Promise as unknown as PromiseWithResolvers;
if (typeof PromiseCtor.withResolvers !== "function") {
  PromiseCtor.withResolvers = function <T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const MAX_CHARS = 24_000;

/** Extract plain text from a PDF/DOCX/TXT buffer, capped to a token-safe length. */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; truncated: boolean }> {
  let text = "";

  if (mimeType === "application/pdf") {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const res = await pdfExtract(pdf, { mergePages: true });
    text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const res = await mammoth.extractRawText({ buffer });
    text = res.value;
  } else if (mimeType === "text/plain") {
    text = buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported document type");
  }

  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const truncated = text.length > MAX_CHARS;
  return { text: truncated ? text.slice(0, MAX_CHARS) : text, truncated };
}
