import { getSetting, setSetting } from "@/services/settings";
import { DEFAULT_AI_SETTINGS, type AiSettings } from "@/lib/ai/config";

const KEY = "ai";

/** Read AI settings from SiteSetting, merged over defaults (forward-compatible). */
export async function getAiSettings(): Promise<AiSettings> {
  const stored = await getSetting<Partial<AiSettings>>(KEY);
  return {
    ...DEFAULT_AI_SETTINGS,
    ...(stored ?? {}),
    modes: { ...DEFAULT_AI_SETTINGS.modes, ...(stored?.modes ?? {}) },
  };
}

export async function setAiSettings(value: AiSettings): Promise<void> {
  await setSetting(KEY, value);
}
