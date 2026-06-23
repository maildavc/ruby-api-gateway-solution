"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Search, Lock, Send, Package } from "lucide-react";

interface PublicEndpoint {
  id: string;
  productName: string;
  serviceName: string;
  httpMethod: string;
  relativePath: string;
  description?: string;
  requiresJwt: boolean;
  payloadExpectation?: string;
}

interface ServiceInfo {
  serviceName: string;
  productName: string;
  endpointCount: number;
  requiresJwt: boolean;
  description?: string;
}

export default function ApisPage() {
  const [endpoints, setEndpoints] = useState<PublicEndpoint[]>([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState<PublicEndpoint[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"services" | "endpoints">("services");
  const [requestedEndpoints, setRequestedEndpoints] = useState<Set<string>>(
    new Set()
  );
  const [requestedServices, setRequestedServices] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    filterEndpoints();
    buildServicesFromEndpoints();
  }, [endpoints, searchTerm, selectedProduct, selectedService, viewMode]);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || "http://localhost:5003";
      const response = await fetch(`${baseUrl}/public/endpoints`);
      if (response.ok) {
        const data = await response.json();
        setEndpoints(data);
      }
    } catch (error) {
      console.error("Failed to fetch endpoints:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEndpoints = () => {
    let filtered = endpoints;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.productName.toLowerCase().includes(term) ||
          e.serviceName.toLowerCase().includes(term) ||
          e.relativePath.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term)
      );
    }

    if (selectedProduct) {
      filtered = filtered.filter((e) => e.productName === selectedProduct);
    }

    if (selectedService) {
      filtered = filtered.filter((e) => e.serviceName === selectedService);
    }

    setFilteredEndpoints(filtered);
  };

  const buildServicesFromEndpoints = () => {
    const servicesMap = new Map<string, ServiceInfo>();

    endpoints.forEach((endpoint) => {
      const key = `${endpoint.productName}|${endpoint.serviceName}`;
      if (!servicesMap.has(key)) {
        servicesMap.set(key, {
          serviceName: endpoint.serviceName,
          productName: endpoint.productName,
          endpointCount: 0,
          requiresJwt: endpoint.requiresJwt,
          description: `Service providing ${endpoint.serviceName} functionality`,
        });
      }
      const service = servicesMap.get(key)!;
      service.endpointCount += 1;
    });

    let servicesList = Array.from(servicesMap.values());

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      servicesList = servicesList.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(term) ||
          s.productName.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
      );
    }

    // Filter by product
    if (selectedProduct) {
      servicesList = servicesList.filter((s) => s.productName === selectedProduct);
    }

    setServices(servicesList);
    setFilteredServices(servicesList);
  };

  const handleRequestAccess = (endpointId: string) => {
    // TODO: Implement request access logic
    setRequestedEndpoints(new Set([...requestedEndpoints, endpointId]));
  };

  const handleRequestServiceAccess = (serviceName: string) => {
    // TODO: Implement service request access logic
    setRequestedServices(new Set([...requestedServices, serviceName]));
  };

  const getMethodBadgeVariant = (method: string): BadgeProps["variant"] => {
    const variants: Record<string, BadgeProps["variant"]> = {
      GET: "neutral",
      POST: "success",
      PUT: "info",
      DELETE: "danger",
      PATCH: "warning",
    };
    return variants[method] || "neutral";
  };

  const products = [...new Set(endpoints.map((e) => e.productName))];
  const servicesForFilter = [
    ...new Set(
      endpoints
        .filter((e) => (selectedProduct ? e.productName === selectedProduct : true))
        .map((e) => e.serviceName)
    ),
  ];
  const groupedEndpoints = filteredEndpoints.reduce(
    (acc, endpoint) => {
      const key = `${endpoint.productName}||${endpoint.serviceName}`;
      if (!acc[key]) {
        acc[key] = {
          productName: endpoint.productName,
          serviceName: endpoint.serviceName,
          endpoints: [],
        };
      }
      acc[key].endpoints.push(endpoint);
      return acc;
    },
    {} as Record<
      string,
      { productName: string; serviceName: string; endpoints: PublicEndpoint[] }
    >
  );
  const groupedEndpointEntries = Object.values(groupedEndpoints).sort((a, b) =>
    `${a.productName}|${a.serviceName}`.localeCompare(
      `${b.productName}|${b.serviceName}`
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading APIs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Available APIs</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Request access to services or individual endpoints to integrate with our platform
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setViewMode("services")}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
            viewMode === "services"
              ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Package className="inline h-4 w-4 mr-2" />
          Services ({services.length})
        </button>
        <button
          onClick={() => setViewMode("endpoints")}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 ${
            viewMode === "endpoints"
              ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Send className="inline h-4 w-4 mr-2" />
          Individual Endpoints ({endpoints.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder={viewMode === "services" ? "Search services..." : "Search endpoints..."}
            className="pl-10 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 shadow-sm text-gray-900 dark:text-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={selectedProduct === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedProduct(null);
              setSelectedService(null);
            }}
            className={selectedProduct === null ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}
          >
            All Products ({viewMode === "services" ? services.length : endpoints.length})
          </Button>
          {products.map((product) => (
            <Button
              key={product}
              variant={selectedProduct === product ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedProduct(product);
                setSelectedService(null);
              }}
              className={selectedProduct === product ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}
            >
              {product} (
              {viewMode === "services" 
                ? services.filter((s) => s.productName === product).length
                : endpoints.filter((e) => e.productName === product).length})
            </Button>
          ))}
        </div>

        {viewMode === "endpoints" && (
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={selectedService === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedService(null)}
              className={selectedService === null ? "bg-slate-700 hover:bg-slate-600 text-white shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}
            >
              All Services ({filteredEndpoints.length})
            </Button>
            {servicesForFilter.map((service) => (
              <Button
                key={service}
                variant={selectedService === service ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedService(service)}
                className={selectedService === service ? "bg-slate-700 hover:bg-slate-600 text-white shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}
              >
                {service} (
                {endpoints.filter((e) =>
                  (selectedProduct ? e.productName === selectedProduct : true) &&
                  e.serviceName === service
                ).length})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Services View */}
      {viewMode === "services" && (
        <div className="space-y-3">
          {filteredServices.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-12 pb-12">
                <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
                  No services found matching your criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => {
                const serviceKey = `${service.productName}|${service.serviceName}`;
                const isRequested = requestedServices.has(serviceKey);
                return (
                  <Card 
                    key={serviceKey} 
                    className="hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
                  >
                    <CardHeader className="pb-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                              {service.serviceName}
                            </CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-1">
                              {service.productName}
                            </p>
                          </div>
                          <Package className="h-5 w-5 text-slate-600 dark:text-slate-300 flex-shrink-0" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Endpoints</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {service.endpointCount}
                          </p>
                        </div>
                        {service.requiresJwt && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                            <Lock className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">JWT</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRequestServiceAccess(serviceKey)}
                        disabled={isRequested}
                        className={isRequested 
                          ? "w-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm" 
                          : "w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm"}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isRequested ? "✓ Requested" : "Request Service"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Endpoints View */}
      {viewMode === "endpoints" && (
        <div className="space-y-3">
          {filteredEndpoints.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-12 pb-12">
                <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
                  No endpoints found matching your criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedEndpointEntries.map((group) => (
              <Card
                key={`${group.productName}|${group.serviceName}`}
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                        {group.serviceName}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
                        {group.productName}
                      </CardDescription>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {group.endpoints.length} endpoints
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.endpoints.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                              variant={getMethodBadgeVariant(endpoint.httpMethod)}
                              className="text-xs font-bold shadow-sm"
                            >
                              {endpoint.httpMethod}
                            </Badge>
                            <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                              {endpoint.relativePath}
                            </code>
                          </div>
                          {endpoint.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {endpoint.description}
                            </p>
                          )}
                        </div>
                        {endpoint.requiresJwt && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm">
                            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">JWT Required</span>
                          </div>
                        )}
                      </div>

                      {endpoint.payloadExpectation && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mt-3">
                          <p className="font-semibold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Expected Payload:</p>
                          <pre className="overflow-auto text-xs text-gray-700 dark:text-gray-300 font-mono">
                            {endpoint.payloadExpectation}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-2 pt-3">
                        <Button
                          size="sm"
                          onClick={() => handleRequestAccess(endpoint.id)}
                          disabled={requestedEndpoints.has(endpoint.id)}
                          className={requestedEndpoints.has(endpoint.id)
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm"
                            : "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm"}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {requestedEndpoints.has(endpoint.id)
                            ? "✓ Access Requested"
                            : "Request Access"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Service-Level Requests (Recommended)</h3>
            <div className="space-y-2 ml-4">
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">1.</span>
                <p>Go to the <strong>Services</strong> tab to see all available services</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">2.</span>
                <p>Click "Request Service" to request the entire service (all routes/endpoints)</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">3.</span>
                <p>Once approved, your clients can access <strong>all endpoints</strong> within that service</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">4.</span>
                <p>No need to request individual endpoints - everything in the service is available</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Individual Endpoint Requests</h3>
            <div className="space-y-2 ml-4">
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">1.</span>
                <p>Go to the <strong>Endpoints</strong> tab for granular control</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">2.</span>
                <p>Request specific endpoints you need</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">3.</span>
                <p>Useful when you only need a few specific routes from a service</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
