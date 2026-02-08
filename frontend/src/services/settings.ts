import api from "./api";

export type SettingItem = { key: string; value: string };

export const settingsService = {
  async getAll(): Promise<SettingItem[]> {
    const res = await api.get<SettingItem[]>("/settings");
    return res.data || [];
  },
  async upsert(items: SettingItem[]): Promise<{ updated: number; items: SettingItem[] }> {
    const res = await api.put("/settings", { items });
    return res.data || { updated: 0, items: [] };
  },
};
