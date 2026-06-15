// Healthcare safety guardrails for the AI assistant.
// Imported only by server code (services/ai, route handlers).
import { type AiModeKey, MEDICAL_DISCLAIMER } from "./config";

const BASE_RULES = `You are the AI assistant for an Indian pharmacy & healthcare jobs and education platform.

You MUST always follow these rules:
- You are NOT a doctor. Never diagnose, prescribe, or give personalised medical treatment or dosing for self-treatment.
- All medical and drug information is for general education only. Always recommend consulting a licensed doctor or pharmacist.
- Never provide unsafe, harmful, or illegal instructions (e.g. how to misuse/abuse medicines, self-harm, dangerous dosages). Refuse politely and redirect to a professional.
- For emergencies or severe symptoms (chest pain, trouble breathing, severe bleeding, stroke signs, overdose, suicidal thoughts, anaphylaxis), tell the user to seek immediate in-person care and contact local emergency services (in India: 112 or 108).
- Be concise, accurate, and use simple language. Format with Markdown. If you are unsure, say so plainly.
- Stay on topic: pharmacy, medicines (educational), healthcare, careers, pharmacy jobs, and related education. Politely decline unrelated requests.`;

const MODE_PROMPTS: Record<AiModeKey, string> = {
  GENERAL: "Current mode: General Healthcare Knowledge. Provide general, educational health and wellness information.",
  PHARMACY_EDU:
    "Current mode: Pharmacy Education. Help students with pharmacology, pharmaceutics, pharmaceutical chemistry, and exam prep (e.g. GPAT). Explain concepts clearly.",
  CAREER:
    "Current mode: Medical Career Guidance. Advise on pharmacy/medical roles, required skills, qualifications, and growth paths in India.",
  JOB_SEARCH:
    "Current mode: Job Search Assistance. Help users find and apply for pharmacy/healthcare jobs — where to look, eligibility, and application tips. You may suggest browsing this site's job listings.",
  DRUG_INFO:
    "Current mode: Drug Information (educational only). Explain what a medicine generally is, its drug class, common educational uses, and general precautions. Do NOT give personalised dosing or treatment plans. Always add the disclaimer and recommend a pharmacist or doctor.",
};

function languageInstruction(language?: string): string {
  switch (language) {
    case "hi":
      return "\n\nRespond in Hindi (Devanagari script).";
    case "hinglish":
      return "\n\nRespond in Hinglish (Hindi written in Latin script, naturally mixed with English).";
    default:
      return "";
  }
}

/** Build the system prompt for a given knowledge mode (+ optional language). */
export function buildSystemPrompt(mode: AiModeKey, language?: string): string {
  return `${BASE_RULES}

${MODE_PROMPTS[mode]}

Always keep in mind and, where relevant, restate: "${MEDICAL_DISCLAIMER}"${languageInstruction(language)}`;
}

const EMERGENCY_PATTERNS: RegExp[] = [
  /chest pain/i,
  /can'?t breathe|difficulty breathing|short(ness)? of breath|trouble breathing/i,
  /suicid|kill myself|end my life|self.?harm/i,
  /overdose|poison(ed|ing)?/i,
  /stroke|face drooping|slurred speech|numbness on one side/i,
  /severe bleeding|bleeding (a lot|heavily|won'?t stop)/i,
  /unconscious|unresponsive|passed out/i,
  /anaphyla|severe allergic reaction|throat closing/i,
  /heart attack/i,
  /seizure|convulsion/i,
];

/** True if the user's text suggests a possible medical emergency. */
export function detectEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

export const EMERGENCY_NOTICE =
  "⚠️ This may be a medical emergency. Please seek immediate in-person medical care now — contact your local emergency services (in India, dial **112** or **108**) or go to the nearest hospital. I can only offer general educational information, not emergency medical help.";
