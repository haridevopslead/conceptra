import { getEnabledOAuthProviders } from "@/lib/auth";
import LoginForm from "./login-form";

export default function LoginPage() {
  const enabledProviders = getEnabledOAuthProviders();
  return <LoginForm enabledProviders={enabledProviders} />;
}
