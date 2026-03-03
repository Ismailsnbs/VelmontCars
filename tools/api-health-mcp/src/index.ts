import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { runTests, listEndpoints } from './runner.js';
import { ENDPOINT_GROUPS } from './config.js';
import type { EndpointGroup } from './types.js';

const server = new Server(
  { name: 'api-health', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'test_all_endpoints',
      description:
        'Run smoke tests against all API endpoints. Returns pass/fail report with response times and errors. Use skipMutating=true to only test GET endpoints.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          skipMutating: {
            type: 'boolean',
            description: 'Skip POST/PUT/DELETE endpoints that modify data (default: false)',
            default: false,
          },
        },
      },
    },
    {
      name: 'test_endpoint_group',
      description: `Test endpoints in a specific group. Available groups: ${ENDPOINT_GROUPS.join(', ')}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          group: {
            type: 'string',
            description: 'Endpoint group to test',
            enum: ENDPOINT_GROUPS,
          },
          skipMutating: {
            type: 'boolean',
            description: 'Skip mutating endpoints (default: false)',
            default: false,
          },
        },
        required: ['group'],
      },
    },
    {
      name: 'list_endpoints',
      description: 'List all registered API endpoints with method, path, auth level, and group.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          group: {
            type: 'string',
            description: 'Filter by group (optional)',
            enum: ENDPOINT_GROUPS,
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'test_all_endpoints': {
      const skipMutating = (args as { skipMutating?: boolean })?.skipMutating ?? false;
      const report = await runTests({ skipMutating });

      const summary = [
        `# API Health Check Report`,
        `**Time:** ${report.timestamp}`,
        `**Base URL:** ${report.baseUrl}`,
        `**Duration:** ${report.durationMs}ms`,
        '',
        `## Summary`,
        `| Metric | Count |`,
        `|--------|-------|`,
        `| Total | ${report.totalEndpoints} |`,
        `| Passed | ${report.passed} |`,
        `| Failed | ${report.failed} |`,
        `| Skipped | ${report.skipped} |`,
        `| Errors | ${report.errors} |`,
      ];

      if (report.failedDetails.length > 0) {
        summary.push('', '## Failed Endpoints');
        for (const f of report.failedDetails) {
          summary.push(
            `- **${f.method} ${f.resolvedPath}** (${f.name})`,
            `  Expected: ${f.expectedStatus}, Got: ${f.actualStatus}`,
            f.error ? `  Error: ${f.error}` : '',
          );
        }
      }

      summary.push('', '## All Results');
      for (const r of report.results) {
        const icon = r.skipped ? '⏭️' : r.passed ? '✅' : '❌';
        summary.push(
          `${icon} ${r.method} ${r.resolvedPath} → ${r.skipped ? 'SKIP' : r.actualStatus} (${r.responseTime}ms) — ${r.name}`
        );
      }

      return { content: [{ type: 'text', text: summary.join('\n') }] };
    }

    case 'test_endpoint_group': {
      const { group, skipMutating = false } = args as { group: string; skipMutating?: boolean };

      if (!ENDPOINT_GROUPS.includes(group as EndpointGroup)) {
        return {
          content: [{ type: 'text', text: `Invalid group: ${group}. Available: ${ENDPOINT_GROUPS.join(', ')}` }],
          isError: true,
        };
      }

      const report = await runTests({ group: group as EndpointGroup, skipMutating });

      const lines = [
        `# Group Test: ${group}`,
        `**Duration:** ${report.durationMs}ms | **Passed:** ${report.passed} | **Failed:** ${report.failed} | **Skipped:** ${report.skipped}`,
        '',
      ];

      for (const r of report.results) {
        const icon = r.skipped ? '⏭️' : r.passed ? '✅' : '❌';
        lines.push(`${icon} ${r.method} ${r.resolvedPath} → ${r.skipped ? 'SKIP' : r.actualStatus} (${r.responseTime}ms)`);
        if (r.error) lines.push(`   Error: ${r.error}`);
      }

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    case 'list_endpoints': {
      const group = (args as { group?: string })?.group as EndpointGroup | undefined;
      const list = listEndpoints(group);

      const lines = [
        `# API Endpoints${group ? ` (${group})` : ''}`,
        `**Total:** ${list.length}`,
        '',
        '| Method | Path | Auth | Group | Mutating |',
        '|--------|------|------|-------|----------|',
        ...list.map(
          (e) => `| ${e.method} | ${e.path} | ${e.auth} | ${e.group} | ${e.mutating ? 'Yes' : 'No'} |`
        ),
      ];

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
