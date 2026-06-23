export type LogsFilter = {
  window: "15m" | "1h" | "24h";
  status?: number;
  environment?: "Sandbox" | "Staging" | "Production";
};
