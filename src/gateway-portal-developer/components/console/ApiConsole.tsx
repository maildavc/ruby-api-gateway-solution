"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const endpoints = [
  { label: "GET /health", method: "GET", path: "/health" },
  { label: "POST /transfer", method: "POST", path: "/transfer" },
  { label: "GET /accounts", method: "GET", path: "/accounts" },
];

export function ApiConsole() {
  const [response, setResponse] = useState<string>("{");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Request builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground">App</label>
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                <option>Sandbox Payments</option>
                <option>Production Transfers</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground">Environment</label>
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                <option>Sandbox</option>
                <option>Staging</option>
                <option>Production</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground">Endpoint</label>
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                {endpoints.map((endpoint) => (
                  <option key={endpoint.label}>{endpoint.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground">Headers</label>
              <Input placeholder="x-api-key: sk_live_***" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase text-muted-foreground">Body</label>
              <Textarea defaultValue={`{
  "amount": 1200,
  "currency": "USD",
  "destination": "acct_123"
}`} />
            </div>
            <Button type="button" onClick={() => setResponse(`{\n  "status": 200,\n  "traceId": "tr_98ad2",\n  "latencyMs": 182\n}`)}>
              <Play className="h-4 w-4" />
              Send request
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Response viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-success">200 OK</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium text-foreground">182 ms</span>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4 text-xs text-muted-foreground">
              <pre className="whitespace-pre-wrap">{response}</pre>
            </div>
            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              Curl snippet ready. Save this request for reuse.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
