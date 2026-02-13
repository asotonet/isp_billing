import { useQuery } from "@tanstack/react-query";
import { routerEventsApi } from "@/api/router-events";

export function useRouterEvents(limit: number = 20) {
  return useQuery({
    queryKey: ["router-events", "recent", limit],
    queryFn: () => routerEventsApi.getRecent(limit),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}
