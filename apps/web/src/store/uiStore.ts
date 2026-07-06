import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  /** 현장 관리 -> 시스템 요구사항/관리 화면으로 이동할 때 유지되는 컨텍스트 현장 */
  activeSiteId: string | null;
  setActiveSiteId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activeSiteId: null,
  setActiveSiteId: (id) => set({ activeSiteId: id }),
}));
