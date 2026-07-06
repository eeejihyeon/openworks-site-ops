import { http } from "@/lib/http";
import type { CurrentUser } from "@/store/authStore";

export interface LoginResponse {
  token: string;
  user: CurrentUser;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await http.post<LoginResponse>("/auth/login", { email, password });
    return data;
  },
  me: async (): Promise<CurrentUser> => {
    const { data } = await http.get<CurrentUser>("/auth/me");
    return data;
  },
};
