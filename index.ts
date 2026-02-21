import { MCPServer, object, text, error, completable } from "mcp-use/server";
import { z } from "zod";

// Create MCP server instance
const server = new MCPServer({
  name: "mcp-orchestrator",
  title: "MCP Orchestrator",
  version: "1.0.0",
  description:
    "A custom MCP orchestrator that aggregates multiple MCP servers into one unified gateway",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// ============================================
// Tool 1: Greet someone
// ============================================
server.tool(
  {
    name: "greet",
    description: "Greet someone by name with a friendly welcome message",
    schema: z.object({
      name: z.string().describe("The name of the person to greet"),
    }),
    readOnlyHint: true,
  },
  async ({ name }) => {
    return text(`Hello, ${name}! Welcome to the MCP Orchestrator.`);
  }
);

// ============================================
// Tool 2: Get current date and time
// ============================================
server.tool(
  {
    name: "get-time",
    description: "Get the current date and time in ISO format",
    schema: z.object({}),
    readOnlyHint: true,
  },
  async () => {
    return object({
      iso: new Date().toISOString(),
      readable: new Date().toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }
);

// ============================================
// Tool 3: Calculator
// ============================================
server.tool(
  {
    name: "calculate",
    description: "Perform a basic math operation on two numbers",
    schema: z.object({
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
      operation: z
        .enum(["add", "subtract", "multiply", "divide"])
        .describe("The math operation to perform"),
    }),
    readOnlyHint: true,
  },
  async ({ a, b, operation }) => {
    if (operation === "divide" && b === 0) {
      return error("Cannot divide by zero");
    }

    const ops: Record<string, number> = {
      add: a + b,
      subtract: a - b,
      multiply: a * b,
      divide: a / b,
    };

    return object({
      expression: `${a} ${operation} ${b}`,
      result: ops[operation],
    });
  }
);

// ============================================
// Tool 4: Fetch weather (mock data for now)
// ============================================
const mockWeather: Record<string, { temp: number; conditions: string }> = {
  "New York": { temp: 22, conditions: "Partly Cloudy" },
  London: { temp: 15, conditions: "Rainy" },
  Tokyo: { temp: 28, conditions: "Sunny" },
  Paris: { temp: 18, conditions: "Overcast" },
  Sydney: { temp: 25, conditions: "Clear" },
};

server.tool(
  {
    name: "fetch-weather",
    description:
      "Fetch the current weather for a city. Available cities: New York, London, Tokyo, Paris, Sydney",
    schema: z.object({
      city: z.string().describe("The city to fetch the weather for"),
    }),
    readOnlyHint: true,
  },
  async ({ city }) => {
    const weather = mockWeather[city];
    if (!weather) {
      return error(`No weather data available for "${city}". Available cities: ${Object.keys(mockWeather).join(", ")}`);
    }

    return object({
      city,
      temperature: `${weather.temp}°C`,
      conditions: weather.conditions,
    });
  }
);

// ============================================
// Resource: Server config and status
// ============================================
server.resource(
  {
    name: "config",
    uri: "config://settings",
    title: "Server Configuration",
    description: "Current server configuration and status",
    mimeType: "application/json",
  },
  async () =>
    object({
      name: "MCP Orchestrator",
      version: "1.0.0",
      status: "running",
      connectedServers: 0, // Will increase in Phase 4
    })
);

// ============================================
// Resource: Available cities for weather
// ============================================
server.resource(
  {
    name: "available-cities",
    uri: "weather://available-cities",
    title: "Available Cities",
    description: "List of cities with weather data available",
    mimeType: "application/json",
  },
  async () => object({ cities: Object.keys(mockWeather) })
);

// ============================================
// Prompt: Code review
// ============================================
server.prompt(
  {
    name: "review-code",
    description: "Review code for best practices and potential issues",
    schema: z.object({
      language: completable(z.string(), [
        "python",
        "javascript",
        "typescript",
        "java",
        "go",
        "rust",
      ]).describe("The programming language of the code"),
      code: z.string().describe("The code snippet to review"),
    }),
  },
  async ({ language, code }) => {
    return text(
      `Please review the following ${language} code for best practices, potential bugs, and improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``
    );
  }
);

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
server.listen(PORT);
