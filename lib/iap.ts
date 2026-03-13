import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  type SubscriptionPurchase,
  type ProductPurchase,
} from "react-native-iap";
import { supabase } from "./supabase";
import { useStore } from "./store";

export const SKU_MONTHLY = "premium_monthly";
export const SKU_YEARLY  = "premium_yearly";

const isExpoGo = Constants.appOwnership === "expo";

const SKUS = [SKU_MONTHLY, SKU_YEARLY];

// Store offer tokens for Android (Google Play Billing 5+)
let offerTokens: Record<string, string> = {};

export function useIAP() {
  const { profile, setProfile } = useStore();
  const [connected, setConnected]       = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);
  const [yearlyPrice, setYearlyPrice]   = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const activatePremium = useCallback(async (purchase: SubscriptionPurchase | ProductPurchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
      if (profile) {
        await supabase.from("profiles").update({ is_premium: true }).eq("id", profile.id);
        setProfile({ ...profile, is_premium: true });
      }
    } catch {
      setError("Achat réussi mais activation échouée. Contacte le support.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    let purchaseListener: ReturnType<typeof purchaseUpdatedListener>;
    let errorListener:    ReturnType<typeof purchaseErrorListener>;

    const setup = async () => {
      if (isExpoGo) return; // Nitro Modules not supported in Expo Go
      try {
        await initConnection();
        setConnected(true);

        const subs = await fetchProducts({ skus: SKUS });
        subs.forEach((s) => {
          const price = (s as any).localizedPrice ?? "";
          if (s.productId === SKU_MONTHLY) setMonthlyPrice(price);
          if (s.productId === SKU_YEARLY)  setYearlyPrice(price);

          // Store offer tokens for Android (v13 requirement)
          if (Platform.OS === "android") {
            const offerDetails = (s as any).subscriptionOfferDetails;
            if (offerDetails?.length > 0) {
              offerTokens[s.productId] = offerDetails[0].offerToken ?? "";
            }
          }
        });

        purchaseListener = purchaseUpdatedListener(async (purchase) => {
          if (purchase.transactionReceipt) {
            await activatePremium(purchase);
          }
        });

        errorListener = purchaseErrorListener((err) => {
          if ((err as any).code !== "E_USER_CANCELLED") {
            setError("L'achat a échoué. Réessaie.");
          }
          setLoading(false);
        });

      } catch {
        setConnected(false);
      }
    };

    setup();

    return () => {
      purchaseListener?.remove();
      errorListener?.remove();
      try { endConnection(); } catch { /* not available in Expo Go */ }
    };
  }, [activatePremium]);

  const purchase = useCallback(async (sku: string) => {
    setLoading(true);
    setError(null);
    try {
      await requestSubscription({
        sku,
        // Android (Google Play Billing 5+) requires subscriptionOffers with offerToken
        ...(Platform.OS === "android" && {
          subscriptionOffers: [{ sku, offerToken: offerTokens[sku] ?? "" }],
        }),
      });
    } catch (e: any) {
      if (e?.code !== "E_USER_CANCELLED") {
        setError("L'achat a échoué. Réessaie.");
      }
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const purchases = await getAvailablePurchases();
      const hasPremium = purchases.some(
        (p) => p.productId === SKU_MONTHLY || p.productId === SKU_YEARLY
      );
      if (hasPremium) {
        await supabase.from("profiles").update({ is_premium: true }).eq("id", profile.id);
        setProfile({ ...profile, is_premium: true });
      } else {
        setError("Aucun achat Premium trouvé.");
      }
    } catch {
      setError("Impossible de restaurer les achats.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return { connected, monthlyPrice, yearlyPrice, loading, error, purchase, restore };
}
