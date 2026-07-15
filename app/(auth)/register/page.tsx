import { getEnabledOAuthProviders } from "@/lib/auth";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  const enabledProviders = getEnabledOAuthProviders();
  return <RegisterForm enabledProviders={enabledProviders} />;
}
