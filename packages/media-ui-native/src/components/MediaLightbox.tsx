import { type ReactElement } from "react";
import { Image, Modal, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { MediaItem } from "../types";

// Minimal functional styles only — no color/typography/spacing decisions.
// `flex: 1` is required so the backdrop/content actually fill the Modal.
const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  content: { flex: 1 },
  media: { flex: 1 },
});

export interface MediaLightboxProps<T extends MediaItem = MediaItem> {
  /** Item to display. Ignored while `open` is false. */
  item: T | null | undefined;
  /** Open/close is fully controlled by the caller — this component holds no visibility state. */
  open: boolean;
  onClose: () => void;
  /**
   * Custom content renderer. Defaults to a bare `Image` for photos. RN has
   * no built-in video component — for video items, pass `renderContent` using
   * whichever video library your app already depends on (react-native-video,
   * expo-av, etc.); this package intentionally doesn't bundle one.
   */
  renderContent?: (item: T) => ReactElement | null;
  closeOnBackdropPress?: boolean;
  /** Passed straight through to RN's `Modal`. Defaults to "fade" (a neutral, non-opinionated choice) — override or set "none" freely. */
  animationType?: "none" | "slide" | "fade";
  statusBarTranslucent?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

function defaultContent(item: MediaItem): ReactElement | null {
  if (item.type === "photo") {
    return <Image source={{ uri: item.src.large }} accessibilityLabel={item.alt} style={styles.media} resizeMode="contain" />;
  }
  return null;
}

/**
 * Headless, controlled lightbox built on RN's `Modal`. Renders nothing
 * unless `open` is true. Uses `Modal`'s `onRequestClose` for the Android
 * hardware back button (RN's documented mechanism — no `document`/`window`
 * involved) and `accessibilityViewIsModal` for screen-reader containment,
 * the RN equivalent of a web focus trap. Has no knowledge of any API.
 */
export function MediaLightbox<T extends MediaItem = MediaItem>({
  item,
  open,
  onClose,
  renderContent,
  closeOnBackdropPress = true,
  animationType = "fade",
  statusBarTranslucent,
  accessibilityLabel,
  containerStyle,
  backdropStyle,
  testID,
}: MediaLightboxProps<T>) {
  if (!open || !item) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType={animationType}
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable
        style={[styles.backdrop, backdropStyle]}
        onPress={closeOnBackdropPress ? onClose : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? "Close"}
      >
        {/* No-op onPress swallows the touch so tapping the content doesn't
            also fire the backdrop's onPress — RN has no stopPropagation for
            Pressable, so an inner Pressable claiming the touch is the
            idiomatic way to achieve this. */}
        <Pressable style={[styles.content, containerStyle]} onPress={() => {}} accessibilityViewIsModal>
          {renderContent ? renderContent(item) : defaultContent(item)}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
