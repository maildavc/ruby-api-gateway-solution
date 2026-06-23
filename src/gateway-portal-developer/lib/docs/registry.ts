export const docsRegistry = {
  "getting-started": () => import("@/content/docs/getting-started.mdx"),
  authentication: () => import("@/content/docs/authentication.mdx"),
  "rate-limits": () => import("@/content/docs/rate-limits.mdx"),
  errors: () => import("@/content/docs/errors.mdx"),
  changelog: () => import("@/content/docs/changelog.mdx"),
};

export type DocSlug = keyof typeof docsRegistry;
