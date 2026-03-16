import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Non authentifié");

    const { receipt, transaction_id, product_id } = await req.json();

    // Activer le premium
    await supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);

    // Enregistrer la souscription
    const expires_at = new Date();
    expires_at.setMonth(expires_at.getMonth() + 1);

    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      apple_product_id: product_id,
      apple_transaction_id: transaction_id,
      status: "active",
      expires_at: expires_at.toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
