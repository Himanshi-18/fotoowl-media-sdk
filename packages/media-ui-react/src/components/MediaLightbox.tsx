import { useEffect, type MouseEvent, type ReactNode } from "react";
import type { MediaItem } from "../types";
import { useFocusTrap } from "../internal/useFocusTrap";

export interface MediaLightboxProps<T extends MediaItem = MediaItem> {
  /** Item to display. Ignored while `open` is false. */
  item: T | null | undefined;
  /** Open/close is fully controlled by the caller — this component holds no visibility state. */
  open: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  /** Custom content renderer. Defaults to a bare `<img>`/`<video>` based on `item.type`. */
  renderContent?: (item: T) => ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  backdropClassName?: string;
}

function defaultContent(item: MediaItem): ReactNode {
  if (item.type === "photo") {
    return <img src={item.src.large} alt={item.alt ?? ""} />;
  }
  const file = item.videoFiles[0];
  // `muted` is required alongside `autoPlay` — browsers block unmuted
  // autoplay, so without it the video simply wouldn't start on its own.
  return file ? <video src={file.link} controls autoPlay muted /> : null;
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}

/**
 * Headless, controlled lightbox: renders nothing unless `open` is true.
 * Handles focus trapping, focus restoration, and Escape/Arrow keyboard
 * navigation for web accessibility. Has no knowledge of any API.
 */
export function MediaLightbox<T extends MediaItem = MediaItem>({
  item,
  open,
  onClose,
  onNext,
  onPrevious,
  renderContent,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  labelledBy,
  describedBy,
  className,
  backdropClassName,
}: MediaLightboxProps<T>) {
  const containerRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
        return;
      }
      // Let arrow keys behave normally (text caret movement, select options,
      // etc.) when focus is inside interactive content from `renderContent`.
      if (isTextEntryTarget(event.target)) return;
      if (event.key === "ArrowRight") {
        onNext?.();
      } else if (event.key === "ArrowLeft") {
        onPrevious?.();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onClose, onNext, onPrevious]);

  if (!open || !item) return null;

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  }

  return (
    <div className={backdropClassName} data-media-lightbox-backdrop="" onClick={handleBackdropClick}>
      <div
        ref={containerRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        data-media-lightbox=""
      >
        {renderContent ? renderContent(item) : defaultContent(item)}
      </div>
    </div>
  );
}
