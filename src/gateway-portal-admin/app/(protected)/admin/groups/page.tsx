import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Group } from "@/types/admin";

const groups: Group[] = [
  {
    id: "group_platform_ops",
    name: "Platform Ops",
    members: 6,
    mappedRoles: ["Admin", "Owner"],
  },
  {
    id: "group_security",
    name: "Security",
    members: 4,
    mappedRoles: ["Auditor"],
  },
  {
    id: "group_support",
    name: "Support",
    members: 8,
    mappedRoles: ["Admin"],
  },
];

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Groups"
        description="Map identity provider groups to gateway roles and permissions."
        action={
          <PermissionGate permission="group.manage">
            <Button>Create group</Button>
          </PermissionGate>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Mapped roles</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{group.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="info">{group.members} members</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {group.mappedRoles.map((role) => (
                      <Badge key={role} variant="neutral">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
