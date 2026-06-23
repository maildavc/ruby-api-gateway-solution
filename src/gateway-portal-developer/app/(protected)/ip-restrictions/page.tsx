"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { orgApi } from "@/lib/api/org";
import type { OrgEndpointApproval } from "@/lib/api/org";
import { useTenant } from "@/lib/hooks/useTenant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Shield } from "lucide-react";

interface EndpointApproval {
  id: string;
  endpointId: string;
  endpointPath: string;
  serviceName: string;
  adminIpEnforced: boolean;
  adminIpAllowlist?: string[];
  approvedAt: string;
}

const ipRestrictionSchema = z.object({
  ipAddresses: z.string(),
  enforceRestrictions: z.boolean(),
});

type IPRestrictionFormValues = z.infer<typeof ipRestrictionSchema>;

export default function IpRestrictionsPage() {
  const [approvals, setApprovals] = useState<EndpointApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<EndpointApproval | null>(null);
  const [newIp, setNewIp] = useState("");
  const tenant = useTenant();

  const { register, handleSubmit, formState, watch } =
    useForm<IPRestrictionFormValues>({
      resolver: zodResolver(ipRestrictionSchema),
      defaultValues: {
        enforceRestrictions: false,
      },
    });

  const enforceRestrictions = watch("enforceRestrictions");

  useEffect(() => {
    fetchApprovals();
  }, [tenant?.tenantId]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      if (!tenant?.tenantId) {
        setApprovals([]);
        return;
      }
      const data = await orgApi.getApprovalsByTenant(tenant.tenantId);
      setApprovals(
        data.map((approval: OrgEndpointApproval) => ({
          id: approval.id,
          endpointId: approval.endpointId,
          endpointPath: approval.endpointId,
          serviceName: "SeaBaasAPIGateway",
          adminIpEnforced: approval.adminIpEnforced,
          adminIpAllowlist: approval.adminIpAllowlist ?? undefined,
          approvedAt: approval.approvedAt,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: IPRestrictionFormValues) => {
    if (!selectedApproval) return;

    try {
      const ipList = values.ipAddresses
        .split("\n")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

      // TODO: Call API to update IP restrictions
      // await fetch(`/api/approvals/${selectedApproval.id}`, {
      //   method: "PUT",
      //   body: JSON.stringify({
      //     adminIpAllowlist: ipList,
      //     adminIpEnforced: values.enforceRestrictions,
      //   }),
      // });

      setOpen(false);
      setSelectedApproval(null);
      fetchApprovals();
    } catch (error) {
      console.error("Failed to update IP restrictions:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading approvals...</p>
      </div>
    );
  }

  const approvedEndpoints = approvals.filter((a) => a.id); // All approvals are approved

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">IP Restrictions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manage IP allowlists for your approved endpoints
        </p>
      </div>

      {approvedEndpoints.length === 0 ? (
        <Card className="border-amber-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="pt-16 pb-16">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20">
                <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Approved Endpoints</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Request endpoint access first to set up IP restrictions
                </p>
              </div>
              <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                <Link href="/endpoint-requests">View Requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 border border-amber-100 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>IP Enforcement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedEndpoints.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {approval.endpointPath}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">{approval.serviceName}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        approval.adminIpEnforced
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {approval.adminIpEnforced ? "Enforced" : "Disabled"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={open && selectedApproval?.id === approval.id} 
                            onOpenChange={(newOpen) => {
                              setOpen(newOpen);
                              if (newOpen) setSelectedApproval(approval);
                            }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300">
                          Configure
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 shadow-lg">
                        <DialogHeader className="space-y-3">
                          <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">
                            IP Restrictions: {approval.endpointPath}
                          </DialogTitle>
                          <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Configure IP allowlist for this endpoint
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="enforce" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Enable IP Restrictions
                              </Label>
                              <Switch
                                id="enforce"
                                {...register("enforceRestrictions")}
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              When enabled, only requests from allowed IP addresses
                              will be accepted
                            </p>
                          </div>

                          {enforceRestrictions && (
                            <div className="space-y-3">
                              <Label htmlFor="ipAddresses" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Allowed IP Addresses / CIDR Ranges
                              </Label>
                              <textarea
                                id="ipAddresses"
                                placeholder="192.168.1.0/24&#10;10.0.0.0/8&#10;203.0.113.5"
                                className="w-full h-32 px-3 py-2 text-sm bg-white dark:bg-slate-800 border-2 border-amber-100 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-gray-100"
                                {...register("ipAddresses")}
                              />
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Enter one IP address or CIDR range per line. Example:
                                192.168.1.0/24, 10.0.0.0/8, 203.0.113.5
                              </p>
                            </div>
                          )}

                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm space-y-2">
                            <p className="font-semibold text-amber-900 dark:text-amber-100">
                              How it works:
                            </p>
                            <ul className="text-amber-800 dark:text-amber-200 space-y-1 text-xs">
                              <li>• If enforcement is disabled, all IPs can access</li>
                              <li>• If enforcement is enabled, only listed IPs can access</li>
                              <li>• Use CIDR notation for ranges (e.g., 192.168.1.0/24)</li>
                            </ul>
                          </div>

                          <Button type="submit" className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md">
                            Save IP Restrictions
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-50 border-2 border-amber-200 shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-amber-900">Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 space-y-3">
          <div className="flex gap-3">
            <span className="font-bold text-amber-700 flex-shrink-0">•</span>
            <p>Use IP restrictions for production environments to limit access to trusted networks</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-amber-700 flex-shrink-0">•</span>
            <p>Combine IP restrictions with API client credentials for defense in depth</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-amber-700 flex-shrink-0">•</span>
            <p>Use CIDR notation for IP ranges instead of individual IPs when possible</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-amber-700 flex-shrink-0">•</span>
            <p>Review and update your IP allowlist regularly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
