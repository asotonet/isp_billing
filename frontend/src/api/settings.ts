import api from "./axios";
import type { Settings, SettingsUpdate } from "@/types/settings";

export const settingsApi = {
  getSettings: async (): Promise<Settings> => {
    const { data } = await api.get("/settings");
    return data;
  },

  updateSettings: async (settingsData: SettingsUpdate): Promise<Settings> => {
    const { data } = await api.put("/settings", settingsData);
    return data;
  },
};
