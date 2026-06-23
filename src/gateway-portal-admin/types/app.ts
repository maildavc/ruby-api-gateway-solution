export type DeveloperApp = {
  id: string;
  name: string;
  description: string;
  environment: "Sandbox" | "Staging" | "Production";
  createdAt: string;
  owner: string;
};
