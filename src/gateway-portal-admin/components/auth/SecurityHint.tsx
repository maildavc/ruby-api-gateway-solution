import { Info } from "lucide-react";

export function SecurityHint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4" />
      <span>{text}</span>
    </div>
  );
}
