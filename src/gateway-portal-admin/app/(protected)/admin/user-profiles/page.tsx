"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FormDialog } from "@/components/common/FormDialog";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { createUserProfile, getServices, getUserProfiles } from "@/lib/api/admin";
import type { ManagementService, ManagementUserProfile } from "@/types/management";

export default function UserProfilesPage() {
  const [profiles, setProfiles] = useState<ManagementUserProfile[]>([]);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState({
    userId: "",
    serviceId: "",
    encryptionKey: "",
    encryptionIv: "",
    isEnabled: true,
  });

  const serviceLookup = useMemo(() => {
    return services.reduce<Record<string, string>>((acc, service) => {
      acc[service.id] = service.serviceName;
      return acc;
    }, {});
  }, [services]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [profilesData, servicesData] = await Promise.all([getUserProfiles(), getServices({ enabledOnly: false })]);
        if (!mounted) return;
        setProfiles(profilesData);
        setServices(servicesData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load user profiles.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createUserProfile({
        userId: formState.userId.trim(),
        serviceId: formState.serviceId || undefined,
        encryptionKey: formState.encryptionKey.trim(),
        encryptionIv: formState.encryptionIv.trim() || undefined,
        isEnabled: formState.isEnabled,
      });
      setProfiles((prev) => [created, ...prev]);
      setFormState({ userId: "", serviceId: "", encryptionKey: "", encryptionIv: "", isEnabled: true });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="User profiles"
        description="Store per-user crypto keys and optional service scoping."
        action={
          <PermissionGate permission="user.profile.manage">
            <FormDialog
              title="Create user profile"
              description="Add a user profile and crypto keys."
              trigger={<Button>Create profile</Button>}
              open={isOpen}
              onOpenChange={setIsOpen}
              submitLabel={submitting ? "Creating..." : "Create profile"}
              submitDisabled={submitting}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-user">User ID</Label>
                  <Input
                    id="profile-user"
                    value={formState.userId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, userId: event.target.value }))}
                    placeholder="client_payhub"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-service">Service (optional)</Label>
                  <select
                    id="profile-service"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={formState.serviceId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, serviceId: event.target.value }))}
                  >
                    <option value="">All services</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profile-key">Encryption key (Base64)</Label>
                  <Input
                    id="profile-key"
                    value={formState.encryptionKey}
                    onChange={(event) => setFormState((prev) => ({ ...prev, encryptionKey: event.target.value }))}
                    placeholder="Base64 encoded key"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profile-iv">Encryption IV (Base64, optional)</Label>
                  <Input
                    id="profile-iv"
                    value={formState.encryptionIv}
                    onChange={(event) => setFormState((prev) => ({ ...prev, encryptionIv: event.target.value }))}
                    placeholder="Base64 encoded IV"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="profile-enabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={formState.isEnabled}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                  />
                  <Label htmlFor="profile-enabled">Enabled</Label>
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </FormDialog>
          </PermissionGate>
        }
      />
      {error && !isOpen && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  Loading user profiles...
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                  No profiles yet. Create one above.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{profile.userId}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {profile.serviceId ? serviceLookup[profile.serviceId] ?? profile.serviceId : "All services"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={profile.isEnabled ? "success" : "neutral"}>{profile.isEnabled ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
