# API Health Check MCP Server — Usage

## Tools

### test_all_endpoints
Run smoke tests against all 66 API endpoints.

```
test_all_endpoints
test_all_endpoints { "skipMutating": true }
```

- Default: tests all endpoints including POST/PUT/DELETE
- `skipMutating: true`: only runs GET endpoints (safe mode)

### test_endpoint_group
Test a single endpoint group.

```
test_endpoint_group { "group": "auth" }
test_endpoint_group { "group": "vehicles", "skipMutating": true }
```

Available groups:
`auth`, `countries`, `tax-rates`, `exchange-rates`, `galleries`, `audit-logs`, `notifications`, `vehicles`, `calculator`, `products`, `customers`, `sales`, `stock-movements`, `stock-alerts`, `stock-count`, `dashboard`, `reports`

### list_endpoints
List all registered endpoints with method, path, auth level, and group.

```
list_endpoints
list_endpoints { "group": "calculator" }
```

## Prerequisites

1. API server running: `cd apps/api && pnpm dev`
2. DB seeded: `npx prisma db seed`
3. MCP server registered in `.mcp.json`
