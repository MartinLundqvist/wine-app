import { useEffect } from "react";

const APP_TITLE = "Wine App";

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
