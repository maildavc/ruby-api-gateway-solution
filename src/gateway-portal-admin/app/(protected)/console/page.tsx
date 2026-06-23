import { SectionHeader } from "@/components/common/SectionHeader";
import { ApiConsole } from "@/components/console/ApiConsole";

export default function ConsolePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="API console" description="Test endpoints with admin-only headers and policies." />
      <ApiConsole />
    </div>
  );
}
