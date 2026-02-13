import api from "./axios";
import type { RouterEvent } from "@/types/router-event";

export const routerEventsApi = {
  getRecent: async (limit: number = 20): Promise<RouterEvent[]> => {
    const { data } = await api.get(`/router-events/recent?limit=${limit}`);
    return data;
  },
};
