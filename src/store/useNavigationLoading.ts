import { create } from 'zustand';

interface NavigationLoadingState {
  isNavigating: boolean;
  targetScreen: string;
  startNavigation: (screenName: string) => void;
  finishNavigation: () => void;
}

export const useNavigationLoading = create<NavigationLoadingState>((set) => ({
  isNavigating: false,
  targetScreen: '',
  startNavigation: (screenName: string) =>
    set({
      isNavigating: true,
      targetScreen: screenName,
    }),
  finishNavigation: () =>
    set({
      isNavigating: false,
      targetScreen: '',
    }),
}));

export default useNavigationLoading;
