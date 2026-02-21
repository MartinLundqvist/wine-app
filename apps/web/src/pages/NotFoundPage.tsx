import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
        404
      </h1>
      <p className="text-muted-foreground font-sans mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium no-underline"
      >
        Go home
      </Link>
    </div>
  );
}
