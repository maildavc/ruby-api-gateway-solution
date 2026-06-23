import { PlusCircle } from "lucide-react";

import { SecurityHint } from "@/components/auth/SecurityHint";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/ui/button";
import { KeyTable } from "@/components/keys/KeyTable";
import { ApiKey } from "@/types/api";

const keys: ApiKey[] = [
  {
    id: "key_1",
    label: "Primary Sandbox",
    environment: "Sandbox",
    scopes: ["read", "write"],
    lastUsedAt: "2026-02-08T08:12:00Z",
    expiresAt: "2026-08-01T00:00:00Z",
    status: "active",
    keyPreview: "sk_live_****91ab",
  },
  {
    id: "key_2",
    label: "Production Transfer",
    environment: "Production",
    scopes: ["read", "transfer"],
    lastUsedAt: "2026-02-06T14:01:00Z",
    expiresAt: "2026-06-01T00:00:00Z",
    status: "active",
    keyPreview: "sk_live_****1d9f",
  },
];

export default function AppKeysPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="API keys"
        description="Rotate and scope keys per environment."
        action={
          <Button>
            <PlusCircle className="h-4 w-4" />
            Generate key
          </Button>
        }
      />
      <SecurityHint text="Copy keys once. After closing this dialog, keys are hidden permanently." />
      <KeyTable keys={keys} />
    </div>
  );
}
