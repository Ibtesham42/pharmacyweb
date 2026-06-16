import { getSetting, setSetting } from "@/services/settings";
import {
  DEFAULT_MARKETPLACE_SETTINGS,
  type MarketplaceSettings,
} from "@/lib/marketplace/config";

const KEY = "marketplace";

export async function getMarketplaceSettings(): Promise<MarketplaceSettings> {
  const stored = await getSetting<Partial<MarketplaceSettings>>(KEY);
  return { ...DEFAULT_MARKETPLACE_SETTINGS, ...(stored ?? {}) };
}

export async function setMarketplaceSettings(value: MarketplaceSettings): Promise<void> {
  await setSetting(KEY, value);
}
