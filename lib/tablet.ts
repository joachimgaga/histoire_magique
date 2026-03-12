import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;

export function useTablet() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const contentWidth = isTablet ? Math.min(width * 0.68, MAX_CONTENT_WIDTH) : undefined;
  return { isTablet, contentWidth };
}
