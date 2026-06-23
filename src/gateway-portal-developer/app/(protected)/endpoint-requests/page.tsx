"use client";

import { useEffect, useState } from "react";
import { orgApi } from "@/lib/api/org";
import type { OrgEndpointRequest } from "@/lib/api/org";
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
  Badge,
  BadgeProps,
} from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";

interface EndpointRequest {
  id: string;
  endpointId: string;
  endpointPath: string;
  serviceName: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reason?: string;
}

const requestSchema = z.object({
  endpointId: z.string(),
  reason: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function EndpointRequestsPage() {
  const [requests, setRequests] = useState<EndpointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const tenant = useTenant();

  const { register, handleSubmit, formState, reset } =
    useForm<RequestFormValues>({
      resolver: zodResolver(requestSchema),
    });

  useEffect(() => {
    fetchRequests();
  }, [tenant?.tenantId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (!tenant?.tenantId) {
        setRequests([]);
        return;
      }
      const data = await orgApi.getEndpointRequestsByTenant(tenant.tenantId);
      setRequests(
        data.map((request: OrgEndpointRequest) => ({
          id: request.id,
          endpointId: request.endpointId,
          endpointPath: request.endpointId,
          serviceName: "SeaBaasAPIGateway",
          status: request.status,
          requestedAt: request.requestedAt,
          reviewedAt: request.reviewedAt,
          reason: request.reviewReason,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: RequestFormValues) => {
    try {
      // TODO: Call API to create endpoint request
      reset();
      setOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Failed to request access:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeProps["variant"] => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "warning";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Endpoint Requests</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Track your endpoint access requests and approval status
        </p>
      </div>

      {/* Request Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {requests.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {requests.filter((r) => r.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {requests.filter((r) => r.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      {requests.length === 0 ? (
        <Card className="border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No endpoint requests yet. Go to the{" "}
                <a href="/apis" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  APIs
                </a>{" "}
                page to request access.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-blue-100 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {request.endpointPath}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.serviceName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {request.reviewedAt
                      ? new Date(request.reviewedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info */}
      <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 border-2 border-blue-200 shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Request Approval Process</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-3">
          <div className="flex gap-3">
            <span className="font-bold text-blue-700 flex-shrink-0">1.</span>
            <p>Go to the <a href="/apis" className="font-semibold text-blue-700 hover:text-blue-900 hover:underline">APIs</a> page and click "Request Access"</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-700 flex-shrink-0">2.</span>
            <p>The portal admin will review your request</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-700 flex-shrink-0">3.</span>
            <p>Once approved, the endpoint will be available for your clients to use</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-blue-700 flex-shrink-0">4.</span>
            <p>You can assign approved endpoints to your API clients</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
