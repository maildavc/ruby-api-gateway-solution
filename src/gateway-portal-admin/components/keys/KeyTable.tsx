import { Copy, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiKey } from "@/types/api";

export function KeyTable({ keys }: { keys: ApiKey[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Environment</th>
            <th className="px-4 py-3">Scopes</th>
            <th className="px-4 py-3">Last used</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-t border-border hover:bg-muted/40">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{key.label}</div>
                <div className="text-xs text-muted-foreground">{key.keyPreview}</div>
              </td>
              <td className="px-4 py-3">{key.environment}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} variant="neutral">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</td>
              <td className="px-4 py-3">
                <Badge variant={key.status === "active" ? "success" : key.status === "expired" ? "warning" : "danger"}>
                  {key.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" type="button">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" type="button">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" type="button">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" type="button">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
