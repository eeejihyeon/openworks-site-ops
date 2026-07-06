import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { useAuthStore } from "./store/authStore";

// 앱 시작 시 zustand persist에 저장된 토큰을 localStorage에 복원
// (이미 localStorage에 저장되어 있으므로 http.ts의 interceptor가 바로 읽을 수 있음)
const { token } = useAuthStore.getState();
if (token) {
  localStorage.setItem("access_token", token);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
