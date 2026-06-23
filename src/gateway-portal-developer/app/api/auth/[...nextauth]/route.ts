import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import Apple from "next-auth/providers/apple";
import { NextResponse } from "next/server";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const azureClientId = process.env.AZURE_AD_CLIENT_ID;
const azureClientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const azureTenantId = process.env.AZURE_AD_TENANT_ID;
const appleClientId = process.env.APPLE_CLIENT_ID;
const appleClientSecret = process.env.APPLE_CLIENT_SECRET;

const missingProviders = [
  !githubClientId || !githubClientSecret ? "GitHub" : null,
  !googleClientId || !googleClientSecret ? "Google" : null,
  !azureClientId || !azureClientSecret || !azureTenantId ? "Azure AD" : null,
  !appleClientId || !appleClientSecret ? "Apple" : null,
].filter(Boolean) as string[];

const handler = NextAuth({
  providers: [
    ...(githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(azureClientId && azureClientSecret && azureTenantId
      ? [
          AzureAD({
            clientId: azureClientId,
            clientSecret: azureClientSecret,
            tenantId: azureTenantId,
          }),
        ]
      : []),
    ...(appleClientId && appleClientSecret
      ? [
          Apple({
            clientId: appleClientId,
            clientSecret: appleClientSecret,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const profileId = (profile as { id?: string | number; sub?: string }).id ??
          (profile as { sub?: string }).sub ??
          token.sub;
        token.id = profileId ? String(profileId) : undefined;
        token.role = "developer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string; lastLoginAt?: string }).id =
          (token.id as string) ?? token.sub ?? session.user.email ?? "oauth-user";
        (session.user as { role?: string }).role = (token.role as string) ?? "developer";
        (session.user as { lastLoginAt?: string }).lastLoginAt = new Date().toISOString();
      }
      return session;
    },
  },
});

export async function GET(request: Request) {
  if (missingProviders.length) {
    return NextResponse.json(
      { error: `Missing ${missingProviders.join(" and ")} OAuth environment variables.` },
      { status: 500 },
    );
  }
  return handler(request as never);
}

export async function POST(request: Request) {
  if (missingProviders.length) {
    return NextResponse.json(
      { error: `Missing ${missingProviders.join(" and ")} OAuth environment variables.` },
      { status: 500 },
    );
  }
  return handler(request as never);
}
