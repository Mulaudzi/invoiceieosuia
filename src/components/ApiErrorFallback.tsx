import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

interface ApiErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ApiErrorFallback = ({
  error,
  onRetry,
  title = "Failed to load data",
  description = "There was a problem connecting to the server. Please check your connection and try again.",
}: ApiErrorFallbackProps) => {
  const isNetworkError = error?.message?.includes("Network") || error?.message?.includes("fetch");

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          {isNetworkError ? (
            <WifiOff className="w-6 h-6 text-destructive" />
          ) : (
            <AlertCircle className="w-6 h-6 text-destructive" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {error?.message && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
            {error.message}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApiErrorFallback;
