import { useEffect } from "react";

let lockCount = 0;
let prevBodyOverflow = "";
let prevHtmlOverflow = "";

const handleTouchMove = (e: TouchEvent) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const scrollable = target.closest(
    ".settings-modal, .settings-modal-content, .auth-modal, .avatar-modal, .post-detail-modal, .story-modal, .create-post-modal, .visited-places-modal, .onboarding-modal, .chat-select-modal, .edit-post-modal, [data-scrollable='true']"
  );
  if (!scrollable && e.cancelable) {
    e.preventDefault();
  }
};

/**
 * Custom hook to lock body and document scrolling when a modal or dialog is open,
 * preventing any background movement or scrollbar bleeding.
 * Supports nested modals via reference counting.
 */
export function useModalScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      prevBodyOverflow = document.body.style.overflow;
      prevHtmlOverflow = document.documentElement.style.overflow;

      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      document.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;

        document.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [active]);
}
