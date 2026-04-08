import { type FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { saveTradingExchangeKeys } from "@/lib/api";
import { type SupportedTradingExchangeId, type TradingExchangeKeyInput } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExchangeCredentialState = Record<
  SupportedTradingExchangeId,
  {
    apiKey: string;
    secret: string;
  }
>;

const supportedExchanges: Array<{
  id: SupportedTradingExchangeId;
  name: string;
  helpText: string;
}> = [
  { id: "binance", name: "Binance", helpText: "Spot or sandbox key pair." },
  { id: "coinbase", name: "Coinbase", helpText: "Advanced Trade API key pair." },
  { id: "kraken", name: "Kraken", helpText: "API key with account read access." },
  { id: "kucoin", name: "KuCoin", helpText: "API key pair without withdrawals." },
  { id: "okx", name: "OKX", helpText: "API key pair without trading withdrawals." },
];

const createInitialCredentials = () =>
  supportedExchanges.reduce((credentials, exchange) => {
    credentials[exchange.id] = {
      apiKey: "",
      secret: "",
    };

    return credentials;
  }, {} as ExchangeCredentialState);

const getExchangeName = (exchangeId: SupportedTradingExchangeId) =>
  supportedExchanges.find((exchange) => exchange.id === exchangeId)?.name ?? exchangeId;

export default function SettingsPanel() {
  const { session, user } = useAuth();
  const [credentials, setCredentials] = useState<ExchangeCredentialState>(() =>
    createInitialCredentials()
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [savedExchanges, setSavedExchanges] = useState<SupportedTradingExchangeId[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocalDevSession = user?.id === "local-dev-user";
  const isSubmitDisabled = isSubmitting || !session?.access_token || isLocalDevSession;

  const updateCredential = (
    exchangeId: SupportedTradingExchangeId,
    field: keyof ExchangeCredentialState[SupportedTradingExchangeId],
    value: string
  ) => {
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [exchangeId]: {
        ...currentCredentials[exchangeId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSavedExchanges([]);

    if (isLocalDevSession) {
      setFormError("Sign in with a real Supabase account before saving exchange credentials.");
      return;
    }

    if (!session?.access_token) {
      setFormError("Sign in again before saving exchange credentials.");
      return;
    }

    // Blank exchange rows are ignored so a user can rotate one venue without re-entering
    // every saved credential. Partial rows are rejected to avoid storing unusable keys.
    const requestedCredentials = supportedExchanges.map((exchange) => ({
      exchangeId: exchange.id,
      apiKey: credentials[exchange.id].apiKey.trim(),
      secret: credentials[exchange.id].secret.trim(),
    }));
    const partialCredential = requestedCredentials.find(
      (credential) =>
        (credential.apiKey && !credential.secret) || (!credential.apiKey && credential.secret)
    );

    if (partialCredential) {
      setFormError(`Enter both API key and secret for ${getExchangeName(partialCredential.exchangeId)}.`);
      return;
    }

    const completeCredentials: TradingExchangeKeyInput[] = requestedCredentials.filter(
      (credential) => credential.apiKey && credential.secret
    );

    if (!completeCredentials.length) {
      setFormError("Enter at least one complete exchange API key and secret.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await saveTradingExchangeKeys({
        accessToken: session.access_token,
        exchanges: completeCredentials,
      });

      setSavedExchanges(response.saved);
      setCredentials(createInitialCredentials());
      toast({
        title: "Trading keys saved",
        description: `${response.saved.map(getExchangeName).join(", ")} credentials were encrypted and stored.`,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save exchange credentials right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage account-level preferences and encrypted trading credentials.
        </p>
      </div>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security warning</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Use read-only exchange keys whenever possible. Disable withdrawals, restrict keys by
            IP address if the exchange supports it, and rotate keys on a regular schedule.
          </p>
          <p>
            Credentials go to <code>/trading/save-keys</code> over HTTPS, are encrypted in the
            worker, and are stored encrypted in Supabase. Never place exchange secrets in a
            <code>VITE_</code> environment variable or browser-accessible config.
          </p>
        </AlertDescription>
      </Alert>

      {isLocalDevSession ? (
        <Alert variant="info">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Real Supabase session required</AlertTitle>
          <AlertDescription>
            The local dev fallback account cannot write encrypted exchange keys. Sign in with a
            Supabase-backed account to save credentials.
          </AlertDescription>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trading keys were not saved</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {savedExchanges.length ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Encrypted credentials saved</AlertTitle>
          <AlertDescription>
            Saved credentials for {savedExchanges.map(getExchangeName).join(", ")}.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Trading Settings
          </CardTitle>
          <CardDescription>
            Leave an exchange blank to keep its current saved credentials unchanged. Fill both
            fields to save or rotate that exchange.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {supportedExchanges.map((exchange) => (
                <section key={exchange.id} className="space-y-4 rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{exchange.name}</h3>
                    <p className="text-sm text-muted-foreground">{exchange.helpText}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${exchange.id}-api-key`}>API key</Label>
                    <Input
                      id={`${exchange.id}-api-key`}
                      type="password"
                      autoComplete="off"
                      value={credentials[exchange.id].apiKey}
                      onChange={(event) =>
                        updateCredential(exchange.id, "apiKey", event.target.value)
                      }
                      placeholder={`${exchange.name} API key`}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${exchange.id}-secret`}>API secret</Label>
                    <Input
                      id={`${exchange.id}-secret`}
                      type="password"
                      autoComplete="off"
                      value={credentials[exchange.id].secret}
                      onChange={(event) =>
                        updateCredential(exchange.id, "secret", event.target.value)
                      }
                      placeholder={`${exchange.name} API secret`}
                      disabled={isSubmitting}
                    />
                  </div>
                </section>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Existing encrypted keys are not displayed again after saving.
              </p>
              <Button type="submit" disabled={isSubmitDisabled} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving keys
                  </>
                ) : (
                  "Save encrypted keys"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
