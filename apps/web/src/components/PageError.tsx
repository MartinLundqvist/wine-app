type PageErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function PageError({ message = "Something went wrong.", onRetry }: PageErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      <p className="text-muted-foreground font-sans mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}
