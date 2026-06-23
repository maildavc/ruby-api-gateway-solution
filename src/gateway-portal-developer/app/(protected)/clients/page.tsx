"use client";

import { useEffect, useState } from "react";
import { orgApi } from "@/lib/api/org";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Copy, Trash2, Settings } from "lucide-react";

interface OrgClient {
  id: string;
  clientId: string;
  clientName: string;
  clientSecret: string;
  isEnabled: boolean;
  createdAt: string;
  approvedEndpointsCount?: number;
}

const createClientSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<OrgClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<OrgClient | null>(null);
  const tenant = useTenant();

  const { register, handleSubmit, formState, reset } =
    useForm<CreateClientFormValues>({
      resolver: zodResolver(createClientSchema),
    });

  useEffect(() => {
    fetchClients();
  }, [tenant?.tenantId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      if (!tenant?.tenantId) {
        setClients([]);
        return;
      }
      const data = await orgApi.getClientsByTenant(tenant.tenantId);
      setClients(data as OrgClient[]);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: CreateClientFormValues) => {
    try {
      // TODO: Call API to create client for the organization
      // await fetch(`/api/clients`, { method: "POST", body: JSON.stringify(values) })
      reset();
      setOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Failed to create client:", error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      // TODO: Call API to delete client
      fetchClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">API Clients</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Create and manage your API clients for secure access
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 shadow-md">
              <Plus className="h-5 w-5 mr-2" />
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 shadow-lg">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">Create New API Client</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Set up a new client to securely access approved API endpoints
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="clientName" className="text-base font-semibold text-gray-900 dark:text-gray-100">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., Mobile App, Backend Service, Web Dashboard"
                  className="h-11 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100"
                  {...register("clientName")}
                />
                {formState.errors.clientName && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {formState.errors.clientName.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">Choose a descriptive name to identify this client</p>
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md">
                Create Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="pt-16 pb-16">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <Plus className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Clients Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first API client to start requesting endpoint access
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 shadow-lg">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">Create New API Client</DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      Set up a new client to securely access approved API endpoints
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="clientName2" className="text-base font-semibold text-gray-900 dark:text-gray-100">Client Name</Label>
                      <Input
                        id="clientName2"
                        placeholder="e.g., Mobile App, Backend Service, Web Dashboard"
                        className="h-11 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100"
                        {...register("clientName")}
                      />
                      {formState.errors.clientName && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          {formState.errors.clientName.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">Choose a descriptive name to identify this client</p>
                    </div>
                    <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md">
                      Create Client
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="border-emerald-100 bg-white hover:shadow-xl transition-shadow duration-200 hover:border-emerald-300 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg text-gray-900">{client.clientName}</CardTitle>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      client.isEnabled 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}>
                      {client.isEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Client ID</p>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                        {client.clientId.substring(0, 16)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(client.clientId)}
                        className="text-gray-500 hover:text-emerald-600 transition-colors"
                        title="Copy full Client ID"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Approved Endpoints</p>
                    <div className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                      <span className="text-sm font-bold text-blue-700">{client.approvedEndpointsCount || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 shadow-lg">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">{selectedClient.clientName}</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Manage your client credentials and configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Client Credentials</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client ID</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg flex-1 font-mono text-gray-800 dark:text-gray-200 break-all">
                        {selectedClient.clientId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedClient.clientId)}
                        className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                        title="Copy Client ID"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Client Secret
                    </Label>
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                      <code className="text-sm font-mono text-gray-600 dark:text-gray-400 flex-1">
                        ••••••••••••••••
                      </code>
                      <span className="text-xs text-red-700 dark:text-red-400 font-medium">Hidden for security</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Approved Endpoints</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.approvedEndpointsCount || 0} endpoints</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Endpoints
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
