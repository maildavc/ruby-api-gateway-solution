"use client";

import { useEffect, useState } from "react";
import { Activity, Boxes, Users, Wrench, KeyRound } from "lucide-react";

import { SectionHeader } from "@/components/common/SectionHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import {
  getClients,
  getEndpoints,
  getProducts,
  getServiceDestinations,
  getServices,
  getUserProfiles,
} from "@/lib/api/admin";
import type {
  ManagementClient,
  ManagementEndpoint,
  ManagementProduct,
  ManagementService,
  ManagementServiceDestination,
  ManagementUserProfile,
} from "@/types/management";

const recentChanges = [
  {
    id: "chg_1",
    summary: "Updated global rate limits for production",
    author: "A. Johnson",
    timestamp: "2026-02-08T08:12:00Z",
  },
  {
    id: "chg_2",
    summary: "Published PayHub v2 endpoint policies",
    author: "L. Chen",
    timestamp: "2026-02-08T07:40:00Z",
  },
  {
    id: "chg_3",
    summary: "Disabled stale destination in staging",
    author: "S. Rivera",
    timestamp: "2026-02-08T07:05:00Z",
  },
];

export default function DashboardPage() {
  const [products, setProducts] = useState<ManagementProduct[]>([]);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [endpoints, setEndpoints] = useState<ManagementEndpoint[]>([]);
  const [clients, setClients] = useState<ManagementClient[]>([]);
  const [profiles, setProfiles] = useState<ManagementUserProfile[]>([]);
  const [destinations, setDestinations] = useState<ManagementServiceDestination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [productsData, servicesData, endpointsData, clientsData, profilesData] = await Promise.all([
          getProducts(false),
          getServices({ enabledOnly: false }),
          getEndpoints({ enabledOnly: false }),
          getClients(false),
          getUserProfiles(),
        ]);

        const destinationsData = await Promise.all(
          servicesData.map((service) => getServiceDestinations(service.id).catch(() => [])),
        );

        if (!mounted) return;
        setProducts(productsData);
        setServices(servicesData);
        setEndpoints(endpointsData);
        setClients(clientsData);
        setProfiles(profilesData);
        setDestinations(destinationsData.flat());
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProducts = products.filter((product) => product.isEnabled).length;
  const activeServices = services.filter((service) => service.isEnabled).length;
  const activeEndpoints = endpoints.filter((endpoint) => endpoint.isEnabled).length;
  const activeDestinations = destinations.filter((destination) => destination.isEnabled).length;
  const activeProfiles = profiles.filter((profile) => profile.isEnabled).length;
  const activeClients = clients.filter((client) => client.isEnabled).length;

  return (
    <div className="space-y-6">
      <SectionHeader title="Gateway overview" description="Control plane status and recent governance activity." />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          title="Products"
          value={loading ? "..." : products.length.toString()}
          description={loading ? "Loading" : `${activeProducts} active`}
          icon={<Boxes className="h-5 w-5 text-success" />}
          href="/admin/products"
        />
        <StatCard
          title="Services"
          value={loading ? "..." : services.length.toString()}
          description={loading ? "Loading" : `${activeServices} active`}
          icon={<Wrench className="h-5 w-5 text-warning" />}
          href="/admin/services"
        />
        <StatCard
          title="Endpoints"
          value={loading ? "..." : endpoints.length.toString()}
          description={loading ? "Loading" : `${activeEndpoints} active`}
          icon={<Activity className="h-5 w-5 text-accent" />}
          href="/admin/endpoints"
        />
        <StatCard
          title="Users"
          value={loading ? "..." : profiles.length.toString()}
          description={loading ? "Loading" : `${activeProfiles} enabled`}
          icon={<Users className="h-5 w-5 text-info" />}
          href="/admin/users"
        />
        <StatCard
          title="Destinations"
          value={loading ? "..." : destinations.length.toString()}
          description={loading ? "Loading" : `${activeDestinations} active`}
          icon={<Activity className="h-5 w-5 text-warning" />}
          href="/admin/services"
        />
        <StatCard
          title="Keys"
          value={loading ? "..." : clients.length.toString()}
          description={loading ? "Loading" : `${activeClients} active`}
          icon={<KeyRound className="h-5 w-5 text-accent" />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{change.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {change.author} · {formatDate(change.timestamp)}
                    </p>
                  </div>
                  <Badge variant="info">Change</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Control plane health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Config sync</span>
                <span className="font-medium text-foreground">Healthy</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Policy engine</span>
                <span className="font-medium text-foreground">Synchronized</span>
              </div>
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                0 blocked deployments. Last refresh 2m ago.
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active keys</span>
                <span className="font-medium text-foreground">1,284</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security posture</span>
                <Badge variant="success">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
