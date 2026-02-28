// supabase/functions/process-storage-billing/index.ts
// Scheduled monthly: charges storage fees for all active vault holdings

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const GRACE_PERIOD_DAYS = parseInt(Deno.env.get("GRACE_PERIOD_DAYS") ?? "14");

serve(async (req) => {
  // Allow manual trigger via POST or scheduled cron
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Optional: verify secret header for manual triggers
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now      = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log(`[storage-billing] Processing for period: ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);

  // ── 1. Fetch all active holdings ────────────────────────────────────────────
  const { data: holdings, error: holdErr } = await supabase
    .from("vault_holdings")
    .select("id, customer_id, storage_fee, plutox_ref, customers(full_name, email, stripe_customer_id, account_status)")
    .eq("status", "active");

  if (holdErr) {
    console.error("[storage-billing] Failed to fetch holdings:", holdErr.message);
    return new Response(JSON.stringify({ error: holdErr.message }), { status: 500 });
  }

  if (!holdings || holdings.length === 0) {
    return new Response(JSON.stringify({ message: "No active holdings found", processed: 0 }), { status: 200 });
  }

  // ── 2. Group by customer ─────────────────────────────────────────────────────
  const byCustomer: Record<string, typeof holdings> = {};
  for (const h of holdings) {
    if (!byCustomer[h.customer_id]) byCustomer[h.customer_id] = [];
    byCustomer[h.customer_id].push(h);
  }

  const results = { success: 0, failed: 0, skipped: 0, errors: [] as string[] };

  // ── 3. Process each customer ─────────────────────────────────────────────────
  for (const [customerId, customerHoldings] of Object.entries(byCustomer)) {
    const customer = customerHoldings[0].customers as any;
    const totalFee = customerHoldings.reduce((sum, h) => sum + Number(h.storage_fee), 0);

    if (totalFee <= 0) {
      results.skipped++;
      continue;
    }

    try {
      // ── 3a. Ensure Stripe customer exists ──────────────────────────────────
      let stripeCustomerId = customer.stripe_customer_id;
      if (!stripeCustomerId) {
        const sc = await stripe.customers.create({
          email: customer.email,
          name:  customer.full_name,
          metadata: { supabase_id: customerId },
        });
        stripeCustomerId = sc.id;
        await supabase
          .from("customers")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", customerId);
      }

      // ── 3b. Create Stripe invoice ──────────────────────────────────────────
      const invoice = await stripe.invoices.create({
        customer:          stripeCustomerId,
        auto_advance:      true,
        collection_method: "charge_automatically",
        description: `Plutox storage billing — ${periodStart.toLocaleString("default", { month: "long", year: "numeric" })}`,
        metadata: { customer_id: customerId, period: periodStart.toISOString() },
      });

      // ── 3c. Add line items per holding ────────────────────────────────────
      for (const h of customerHoldings) {
        await stripe.invoiceItems.create({
          customer:   stripeCustomerId,
          invoice:    invoice.id,
          amount:     Math.round(Number(h.storage_fee) * 100), // pence
          currency:   "gbp",
          description: `Storage: ${h.plutox_ref} (${periodStart.toLocaleString("default", { month: "long" })})`,
        });
      }

      // ── 3d. Finalise & pay ────────────────────────────────────────────────
      const finalised = await stripe.invoices.finalizeInvoice(invoice.id);
      let   paid      = false;
      let   paidAt: string | null = null;

      if (finalised.status === "open") {
        try {
          const paid_inv = await stripe.invoices.pay(invoice.id);
          paid   = paid_inv.status === "paid";
          paidAt = paid ? new Date(paid_inv.status_transitions.paid_at! * 1000).toISOString() : null;
        } catch (payErr: any) {
          console.warn(`[storage-billing] Payment failed for ${customerId}: ${payErr.message}`);
        }
      }

      // ── 3e. Record billing rows in Supabase ───────────────────────────────
      const billingRows = customerHoldings.map(h => ({
        customer_id:          customerId,
        holding_id:           h.id,
        amount:               Number(h.storage_fee),
        status:               paid ? "paid" : "failed",
        stripe_invoice_id:    invoice.id,
        billing_period_start: periodStart.toISOString(),
        billing_period_end:   periodEnd.toISOString(),
        paid_at:              paidAt,
      }));

      await supabase.from("storage_billing").insert(billingRows);

      // ── 3f. Handle failed payments → grace period / suspend ───────────────
      if (!paid) {
        const gracePeriodEnds = new Date(now);
        gracePeriodEnds.setDate(gracePeriodEnds.getDate() + GRACE_PERIOD_DAYS);

        const currentStatus = customer.account_status;
        const newStatus = currentStatus === "grace_period" ? "suspended" : "grace_period";

        await supabase
          .from("customers")
          .update({
            account_status:    newStatus,
            grace_period_ends: newStatus === "grace_period" ? gracePeriodEnds.toISOString() : null,
            overdue_amount:    totalFee,
          })
          .eq("id", customerId);

        console.warn(`[storage-billing] Customer ${customerId} → ${newStatus} (owed: £${totalFee.toFixed(2)})`);
      } else {
        // Clear any previous overdue state
        await supabase
          .from("customers")
          .update({ account_status: "active", grace_period_ends: null, overdue_amount: 0 })
          .eq("id", customerId);
      }

      results.success++;
    } catch (err: any) {
      console.error(`[storage-billing] Error for customer ${customerId}:`, err.message);
      results.failed++;
      results.errors.push(`${customerId}: ${err.message}`);
    }
  }

  // ── 4. Update current_value on all active holdings (using latest gold price) ─
  try {
    const { data: latestPrice } = await supabase
      .from("gold_price_history")
      .select("price_per_g")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (latestPrice) {
      const { data: activeHoldings } = await supabase
        .from("vault_holdings")
        .select("id, products(weight_g, purity)")
        .eq("status", "active");

      if (activeHoldings) {
        for (const h of activeHoldings) {
          const product = h.products as any;
          const value   = latestPrice.price_per_g * product.weight_g * product.purity;
          await supabase
            .from("vault_holdings")
            .update({ current_value: value.toFixed(2) })
            .eq("id", h.id);
        }
        console.log(`[storage-billing] Updated current_value for ${activeHoldings.length} holdings`);
      }
    }
  } catch (valErr: any) {
    console.warn("[storage-billing] Failed to update holding values:", valErr.message);
  }

  console.log("[storage-billing] Done:", results);
  return new Response(JSON.stringify(results), {
    status:  200,
    headers: { "Content-Type": "application/json" },
  });
});
