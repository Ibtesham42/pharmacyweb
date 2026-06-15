// AI module configuration — shared, client-safe constants and types.
// No secrets here. The Groq API key lives only in env (GROQ_API_KEY), server-side.

export type AiModeKey =
  | "GENERAL"
  | "PHARMACY_EDU"
  | "CAREER"
  | "JOB_SEARCH"
  | "DRUG_INFO"
  | "PLANT_ID"
  | "MEDICAL_DEVICE"
  | "STUDENT";

export const MEDICAL_DISCLAIMER =
  "AI information is for educational purposes only and should not replace professional medical advice.";

export interface AiSettings {
  enabled: boolean;
  maintenanceMode: boolean;
  model: string;
  fastModel: string;
  visionModel: string;
  imageAnalysisEnabled: boolean;
  documentAnalysisEnabled: boolean;
  temperature: number;
  maxOutputTokens: number;
  /** Requests per IP per minute (burst). */
  perMinuteLimit: number;
  /** Total requests allowed per calendar day (global). */
  dailyLimit: number;
  /** Requests per anonymous clientId per calendar day. */
  perUserDailyLimit: number;
  /** Uploads (image/doc turns) per clientId per calendar day. */
  maxUploadsPerDay: number;
  maxImageMB: number;
  maxDocMB: number;
  /** Which knowledge modes are available to users. */
  modes: Record<AiModeKey, boolean>;
}

// Disabled by default — admin must enable AND a GROQ_API_KEY must be configured.
export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  maintenanceMode: false,
  model: "llama-3.3-70b-versatile",
  fastModel: "llama-3.1-8b-instant",
  visionModel: "meta-llama/llama-4-scout-17b-16e-instruct",
  imageAnalysisEnabled: true,
  documentAnalysisEnabled: true,
  temperature: 0.4,
  maxOutputTokens: 1024,
  perMinuteLimit: 8,
  dailyLimit: 2000,
  perUserDailyLimit: 50,
  maxUploadsPerDay: 30,
  maxImageMB: 8,
  maxDocMB: 15,
  modes: {
    GENERAL: true,
    PHARMACY_EDU: true,
    CAREER: true,
    JOB_SEARCH: true,
    DRUG_INFO: true,
    PLANT_ID: true,
    MEDICAL_DEVICE: true,
    STUDENT: true,
  },
};

// Curated subset of Groq's free/open models (ids validated against @ai-sdk/groq).
export const AI_MODELS: { id: string; label: string }[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — versatile (recommended)" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B — fast" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B" },
];

// Multimodal (vision-capable) Groq models for image understanding.
export const AI_VISION_MODELS: { id: string; label: string }[] = [
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout — vision (recommended)" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick — vision (larger)" },
];

export const AI_MODE_LABELS: Record<AiModeKey, string> = {
  GENERAL: "General Healthcare",
  PHARMACY_EDU: "Pharmacy Education",
  CAREER: "Medical Career Guidance",
  JOB_SEARCH: "Job Search Assistance",
  DRUG_INFO: "Drug Information (educational)",
  PLANT_ID: "Medicinal Plant ID",
  MEDICAL_DEVICE: "Medical Device Help",
  STUDENT: "Pharmacy Student",
};

export const AI_MODE_KEYS: AiModeKey[] = [
  "GENERAL",
  "PHARMACY_EDU",
  "CAREER",
  "JOB_SEARCH",
  "DRUG_INFO",
  "PLANT_ID",
  "MEDICAL_DEVICE",
  "STUDENT",
];

export const SUGGESTED_PROMPTS: Record<AiModeKey, string[]> = {
  GENERAL: [
    "What does a pharmacist do day to day?",
    "Explain the difference between B.Pharm and D.Pharm.",
    "What are common types of healthcare jobs in India?",
  ],
  PHARMACY_EDU: [
    "Explain the mechanism of action of beta blockers (educational).",
    "Give me a GPAT preparation study plan.",
    "What is pharmacokinetics vs pharmacodynamics?",
  ],
  CAREER: [
    "How do I become a clinical pharmacist in India?",
    "What skills make a strong medical representative?",
    "Career growth paths for a hospital pharmacist?",
  ],
  JOB_SEARCH: [
    "How do I find government pharmacist jobs?",
    "Tips to apply for pharmacy jobs as a fresher.",
    "What eligibility is needed for MR roles?",
  ],
  DRUG_INFO: [
    "What is paracetamol used for? (educational)",
    "What class of drug is metformin?",
    "General precautions for antibiotics (educational).",
  ],
  PLANT_ID: [
    "What medicinal plant might this be? (educational)",
    "What are the traditional uses of this plant?",
    "Any safety warnings for this plant?",
  ],
  MEDICAL_DEVICE: [
    "What is this device used for?",
    "Explain the visible controls.",
    "How is this device generally used?",
  ],
  STUDENT: [
    "Summarize my uploaded notes.",
    "Create 5 MCQs from this document.",
    "Make flashcards for the key terms.",
  ],
};

// Allowed upload types for the public AI assistant.
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
export const ACCEPT_AI_UPLOAD = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES].join(",");
