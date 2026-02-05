import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

export function useLogin() {
  const { setTokens } = useAuth();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
