import { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import type { OAuthConfig } from "next-auth/providers/oauth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// A blank string is a common misconfiguration (e.g. an env var declared but
// never filled in on the hosting dashboard) — treat it the same as unset.
function isSet(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const hasGoogle = isSet(process.env.GOOGLE_CLIENT_ID) && isSet(process.env.GOOGLE_CLIENT_SECRET);
const hasGitHub = isSet(process.env.GITHUB_CLIENT_ID) && isSet(process.env.GITHUB_CLIENT_SECRET);
const hasLinkedIn = isSet(process.env.LINKEDIN_CLIENT_ID) && isSet(process.env.LINKEDIN_CLIENT_SECRET);

// Single source of truth for which OAuth providers are actually usable —
// read by the providers array below, and by the login/register server
// components deciding which buttons to render. Adding a fourth provider
// later only means adding one line here, not touching the frontend.
export function getEnabledOAuthProviders(): Array<"google" | "github" | "linkedin"> {
  const enabled: Array<"google" | "github" | "linkedin"> = [];
  if (hasGoogle) enabled.push("google");
  if (hasGitHub) enabled.push("github");
  if (hasLinkedIn) enabled.push("linkedin");
  return enabled;
}

// next-auth's bundled `next-auth/providers/linkedin` (still on 4.24.14) targets
// LinkedIn's deprecated r_liteprofile REST API (`/v2/me` + `/v2/emailAddress`),
// which new LinkedIn apps can no longer request. LinkedIn's current product,
// "Sign In with LinkedIn using OpenID Connect", exposes a standard OIDC
// `/v2/userinfo` endpoint instead (sub, name, email, email_verified, picture).
// We talk to that endpoint directly rather than the stale built-in provider.
interface LinkedInOIDCProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
}

function LinkedInProvider(config: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<LinkedInOIDCProfile> {
  return {
    id: "linkedin",
    name: "LinkedIn",
    type: "oauth",
    authorization: {
      url: "https://www.linkedin.com/oauth/v2/authorization",
      params: { scope: "openid profile email" },
    },
    token: "https://www.linkedin.com/oauth/v2/accessToken",
    userinfo: "https://api.linkedin.com/v2/userinfo",
    client: { token_endpoint_auth_method: "client_secret_post" },
    checks: ["state"],
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        // Placeholders only — Prisma's schema `@default`s (role: USER,
        // plan: FREE) are what actually apply when the adapter creates the
        // row; the augmented `User` type just requires these fields present.
        role: "USER",
        plan: "FREE",
      };
    },
    style: { logo: "/linkedin.svg", bg: "#0A66C2", text: "#fff" },
    allowDangerousEmailAccountLinking: true,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        };
      },
    }),

    // Only registered when real credentials are configured — an OAuth
    // provider with a blank clientId/clientSecret still renders a working
    // "Continue with X" button that fails on click, and some providers
    // (LinkedIn's discovery-less config here) can throw during request
    // handling if clientId is empty. Conditionally building this array is
    // also what getEnabledOAuthProviders() mirrors for the frontend, so a
    // provider only ever appears once its env vars are actually set.
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    ...(hasGitHub
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    ...(hasLinkedIn
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          }),
        ]
      : []),
  ] as Provider[],

  callbacks: {
    // Gate OAuth sign-ins so account linking only ever happens between two
    // sides we can actually trust: an email the provider has itself verified,
    // matched against an existing Conceptra account whose email is already
    // verified too. Without this, someone could register tes1@conceptra.in
    // with a password (never verifying it), and later have the real owner's
    // "Sign in with Google" silently absorbed into that pre-existing,
    // attacker-controlled row. Providers that only ever hand back verified
    // emails (Google, LinkedIn OIDC) are cheap to check; GitHub allows an
    // unverified primary email, so it gets a real lookup against its API.
    async signIn({ account, profile }) {
      if (!account || account.type !== "oauth") return true;

      const rawProfile = profile as
        | (LinkedInOIDCProfile & { email_verified?: boolean })
        | undefined;
      const email = rawProfile?.email?.toLowerCase();
      if (!email) return false;

      let providerVerifiedEmail = false;

      if (account.provider === "google" || account.provider === "linkedin") {
        providerVerifiedEmail = rawProfile?.email_verified === true;
      } else if (account.provider === "github") {
        const res = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        if (res.ok) {
          const emails: { email: string; verified: boolean }[] = await res.json();
          const match = emails.find((e) => e.email.toLowerCase() === email);
          providerVerifiedEmail = Boolean(match?.verified);
        }
      }

      if (!providerVerifiedEmail) {
        return "/login?error=OAuthEmailNotVerified";
      }

      const existingUser = await db.user.findUnique({ where: { email } });

      if (existingUser) {
        const alreadyLinked = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!alreadyLinked && existingUser.hashedPassword && !existingUser.emailVerified) {
          return "/login?error=OAuthAccountNotLinked";
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },

  events: {
    // NextAuth's default adapter flow always creates brand-new OAuth users
    // with emailVerified: null (see callback-handler.js), even though the
    // signIn callback above already confirmed the provider verified this
    // email. Stamp it here so OAuth users never hit the email-verification
    // gate that /api/interview/* routes enforce.
    async signIn({ user, account }) {
      if (account?.type === "oauth" && user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true },
        });
        if (dbUser && !dbUser.emailVerified) {
          await db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
      }
    },
  },
};
