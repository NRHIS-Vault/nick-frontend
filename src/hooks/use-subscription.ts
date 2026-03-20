import { useAuth } from "@/hooks/use-auth";

export const useSubscription = () => {
  const { subscriptionStatus } = useAuth();

  // Treat every non-`active` status as paywalled so the route guard has a single,
  // explicit source of truth for access decisions.
  return subscriptionStatus === "active";
};
