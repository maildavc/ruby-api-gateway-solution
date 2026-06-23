#!/usr/bin/env python3
"""Fetch Swagger JSON specs and generate SQL to seed products/services/endpoints."""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any
from urllib.request import Request, urlopen
from urllib.parse import urlparse

SWAGGER_URLS = [
    "https://test-gateway.seabaas.co/gateway/customermanagement-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-accountenquiries-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-accountfundsmanagement-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-accountmanagement-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-accountopening-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-centraljournalposting-smartadapter/swagger",
    "https://test-gateway.seabaas.co/gateway/seabaas-transactionenquiries-smartadapter/swagger",
]


def to_swagger_json_url(url: str) -> str:
    return url.rstrip("/") + "/v1/swagger.json"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def pick_service_name(info_title: str, fallback: str) -> str:
    title = info_title or fallback
    title = title.replace("Middleware", "").strip()
    title = title.replace("SeaBaas.SmartAdapter.", "")
    title = title.replace("SeaBaas.SmartAdapter", "")
    title = title.replace("SeaBaas.", "")
    title = title.replace("SmartAdapter", "")
    title = re.sub(r"\s+", " ", title).strip()
    return title or fallback


def parse_base_path(swagger_url: str, servers: list[dict[str, Any]] | None) -> str:
    if servers:
        server_url = servers[0].get("url", "")
        if server_url:
            return urlparse(server_url).path or "/"
    parsed = urlparse(swagger_url)
    path = parsed.path
    if path.endswith("/swagger/v1/swagger.json"):
        path = path[: -len("/swagger/v1/swagger.json")]
    return path or "/"


def parse_destination(swagger_url: str, servers: list[dict[str, Any]] | None) -> str:
    if servers:
        server_url = servers[0].get("url", "")
        if server_url:
            return server_url
    parsed = urlparse(swagger_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    return origin + parse_base_path(swagger_url, servers)


def fetch_json(url: str) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def build_endpoints(paths: dict[str, Any]) -> list[dict[str, str]]:
    endpoints: list[dict[str, str]] = []
    name_counts: dict[str, int] = {}

    for path, methods in paths.items():
        for method, spec in methods.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "head", "options"}:
                continue
            method_upper = method.upper()
            operation_id = (spec or {}).get("operationId") or ""
            summary = (spec or {}).get("summary") or ""
            base_name = operation_id or summary or f"{method_upper} {path}"
            name = slugify(base_name)
            if not name:
                name = slugify(f"{method_upper} {path}")
            count = name_counts.get(name, 0) + 1
            name_counts[name] = count
            if count > 1:
                name = f"{name}-{count}"

            endpoints.append(
                {
                    "endpoint_name": name[:100],
                    "http_method": method_upper,
                    "relative_path": path,
                    "upstream_path_template": path,
                }
            )

    return endpoints


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--product-name", required=True)
    parser.add_argument("--product-description", required=True)
    parser.add_argument("--owner-team", required=True)
    parser.add_argument("--environment", required=True)
    args = parser.parse_args()

    services: list[dict[str, Any]] = []

    for url in SWAGGER_URLS:
        swagger_json_url = to_swagger_json_url(url)
        spec = fetch_json(swagger_json_url)
        info = spec.get("info", {})
        title = info.get("title", "")
        version = info.get("version", "v1")
        service_name = pick_service_name(title, slugify(urlparse(url).path))
        base_path = parse_base_path(swagger_json_url, spec.get("servers"))
        destination = parse_destination(swagger_json_url, spec.get("servers"))
        endpoints = build_endpoints(spec.get("paths", {}))

        services.append(
            {
                "service_name": service_name,
                "description": title or service_name,
                "version": version,
                "base_path": base_path,
                "cluster_id": slugify(service_name) + "-cluster",
                "destination": destination,
                "endpoints": endpoints,
            }
        )

    lines: list[str] = []
    header_lines = [
        "SET search_path TO \"SeaBaasAPIGateway-Core\";",
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
        "",
        "INSERT INTO products (id, name, description, owner_team, is_enabled)",
        "VALUES (gen_random_uuid(), {name}, {desc}, {owner}, true)",
        "ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, owner_team = EXCLUDED.owner_team;",
        "",
    ]

    lines.extend(
        line.format(
            name=sql_quote(args.product_name),
            desc=sql_quote(args.product_description),
            owner=sql_quote(args.owner_team),
        )
        for line in header_lines
    )

    for service in services:
        service_lines_pre: list[str] = []
        service_lines_pre.append("WITH product AS (")
        service_lines_pre.append("  SELECT id FROM products WHERE name = {name} LIMIT 1")
        service_lines_pre.append("), upsert_service AS (")
        service_lines_pre.append("  INSERT INTO services (")
        service_lines_pre.append("    id, product_id, service_name, base_path, version, description, owner_team,")
        service_lines_pre.append("    is_enabled, environment, cluster_id, destinations, load_balancing_policy,")
        service_lines_pre.append("    health_check_enabled, health_check_path, health_check_interval_seconds,")
        service_lines_pre.append("    enable_tracing, enable_metrics, log_sampling,")
        service_lines_pre.append("    requires_jwt, required_scopes,")
        service_lines_pre.append("    cache_enabled, cache_ttl_seconds,")
        service_lines_pre.append("    emit_events, topic_prefix, event_schema_version,")
        service_lines_pre.append("    default_crypto_algorithm, default_key_source, default_iv_source,")
        service_lines_pre.append("    default_encoding, default_require_iv")
        service_lines_pre.append("  )")
        service_lines_pre.append("  SELECT")
        service_lines_pre.append("    gen_random_uuid(),")
        service_lines_pre.append("    product.id,")
        service_lines_pre.append("    {service_name},")
        service_lines_pre.append("    {base_path},")
        service_lines_pre.append("    {version},")
        service_lines_pre.append("    {description},")
        service_lines_pre.append("    {owner},")
        service_lines_pre.append("    true,")
        service_lines_pre.append("    {environment},")
        service_lines_pre.append("    {cluster_id},")
        service_lines_pre.append("    {destinations}::jsonb,")
        service_lines_pre.append("    'RoundRobin',")
        service_lines_pre.append("    false, NULL, 30,")
        service_lines_pre.append("    true, true, 1.0,")
        service_lines_pre.append("    true, NULL,")
        service_lines_pre.append("    false, 60,")
        service_lines_pre.append("    false, NULL, NULL,")
        service_lines_pre.append("    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',")
        service_lines_pre.append("    'Base64', true")
        service_lines_pre.append("  FROM product")
        service_lines_pre.append("  ON CONFLICT (product_id, service_name, version) DO UPDATE SET")
        service_lines_pre.append("    base_path = EXCLUDED.base_path,")
        service_lines_pre.append("    description = EXCLUDED.description,")
        service_lines_pre.append("    owner_team = EXCLUDED.owner_team,")
        service_lines_pre.append("    environment = EXCLUDED.environment,")
        service_lines_pre.append("    cluster_id = EXCLUDED.cluster_id,")
        service_lines_pre.append("    destinations = EXCLUDED.destinations")
        service_lines_pre.append("  RETURNING id")
        service_lines_pre.append(")")

        value_lines: list[str] = []
        service_lines_post: list[str] = []

        if service["endpoints"]:
            service_lines_post.append("INSERT INTO endpoints (")
            service_lines_post.append("  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled")
            service_lines_post.append(")")
            service_lines_post.append("SELECT")
            service_lines_post.append("  gen_random_uuid(),")
            service_lines_post.append("  upsert_service.id,")
            service_lines_post.append("  data.endpoint_name,")
            service_lines_post.append("  data.http_method,")
            service_lines_post.append("  data.relative_path,")
            service_lines_post.append("  data.upstream_path_template,")
            service_lines_post.append("  true")
            service_lines_post.append("FROM upsert_service")
            service_lines_post.append("CROSS JOIN (VALUES")

            for endpoint in service["endpoints"]:
                value_lines.append(
                    f"  ({sql_quote(endpoint['endpoint_name'])}, {sql_quote(endpoint['http_method'])},"
                    f" {sql_quote(endpoint['relative_path'])}, {sql_quote(endpoint['upstream_path_template'])})"
                )

            service_lines_post.append(",\n".join(value_lines))
            service_lines_post.append(") AS data(endpoint_name, http_method, relative_path, upstream_path_template)")
            service_lines_post.append("ON CONFLICT (service_id, endpoint_name) DO UPDATE SET")
            service_lines_post.append("  http_method = EXCLUDED.http_method,")
            service_lines_post.append("  relative_path = EXCLUDED.relative_path,")
            service_lines_post.append("  upstream_path_template = EXCLUDED.upstream_path_template,")
            service_lines_post.append("  is_enabled = true;")
        else:
            service_lines_post.append("SELECT 1;")

        service_lines_post.append("")

        lines.extend(
            line.format(
                name=sql_quote(args.product_name),
                owner=sql_quote(args.owner_team),
                environment=sql_quote(args.environment),
                service_name=sql_quote(service["service_name"]),
                base_path=sql_quote(service["base_path"]),
                version=sql_quote(service["version"]),
                description=sql_quote(service["description"]),
                cluster_id=sql_quote(service["cluster_id"]),
                destinations=sql_quote(json.dumps([service["destination"]])),
            )
            for line in service_lines_pre
        )
        lines.extend(service_lines_post)

    out_path = args.out
    with open(out_path, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))

    print(f"Wrote SQL to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
