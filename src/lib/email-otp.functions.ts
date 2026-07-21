import { createServerFn } from "@tanstack/react-start";
import { createHash, randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s between sends
const MAX_ATTEMPTS = 5;

const hashCode = (code: string, email: string) =>
  createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function renderEmail(code: string) {
  return `<!doctype html><html><body style="margin:0;padding:32px;background:#F2E8D5;font-family:Inter,Arial,sans-serif;color:#1E2A2F;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <tr><td>
      <div style="font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:700;color:#2A6F77;">Local Shore</div>
      <h1 style="font-family:Fraunces,Georgia,serif;font-size:26px;margin:24px 0 8px;">Your login code</h1>
      <p style="margin:0 0 20px;color:#4b5560;font-size:14px;">Use the code below to finish signing in. It expires in 10 minutes.</p>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:38px;letter-spacing:12px;font-weight:700;background:#F2E8D5;color:#2A6F77;padding:20px 24px;border-radius:12px;text-align:center;">${code}</div>
      <p style="margin:24px 0 0;color:#8a94a1;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </td></tr>
  </table></body></html>`;
}

export const sendResendEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; name?: string }) => {
    if (!data?.email || !isValidEmail(data.email)) throw new Error("Invalid email");
    return { email: data.email.trim().toLowerCase(), name: data.name?.trim() ?? "" };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Cooldown check
    const { data: recent } = await supabaseAdmin
      .from("email_otps")
      .select("created_at")
      .eq("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      const age = Date.now() - new Date(recent.created_at as string).getTime();
      if (age < RESEND_COOLDOWN_MS) {
        throw new Error(
          `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - age) / 1000)}s before requesting a new code.`,
        );
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const code_hash = hashCode(code, data.email);
    const expires_at = new Date(Date.now() + OTP_TTL_MS).toISOString();

    // Clear old codes and insert the fresh one.
    await supabaseAdmin.from("email_otps").delete().eq("email", data.email);
    const { error: insertErr } = await supabaseAdmin
      .from("email_otps")
      .insert({ email: data.email, code_hash, expires_at });
    if (insertErr) throw new Error("Could not create login code. Try again.");

    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) throw new Error("Email service not configured.");

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "Local Shore <onboarding@resend.dev>",
        to: [data.email],
        subject: `${code} is your Local Shore login code`,
        html: renderEmail(code),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend send failed [${res.status}]: ${body}`);
      let detail = "";
      try {
        detail = JSON.parse(body)?.message ?? "";
      } catch {
        /* ignore */
      }
      throw new Error(detail || "Could not send the code right now. Try again in a moment.");
    }
    return { sent: true };
  });

export const verifyResendEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; code: string; name?: string }) => {
    if (!data?.email || !isValidEmail(data.email)) throw new Error("Invalid email");
    if (!data?.code || !/^\d{6}$/.test(data.code)) throw new Error("Enter the 6-digit code.");
    return {
      email: data.email.trim().toLowerCase(),
      code: data.code,
      name: data.name?.trim() ?? "",
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("email_otps")
      .select("id, code_hash, expires_at, attempts")
      .eq("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("No code found. Please request a new one.");
    if (new Date(row.expires_at as string).getTime() < Date.now()) {
      await supabaseAdmin.from("email_otps").delete().eq("id", row.id);
      throw new Error("This code has expired. Request a new one.");
    }
    if ((row.attempts as number) >= MAX_ATTEMPTS) {
      await supabaseAdmin.from("email_otps").delete().eq("id", row.id);
      throw new Error("Too many attempts. Request a new code.");
    }
    const expected = hashCode(data.code, data.email);
    if (expected !== row.code_hash) {
      await supabaseAdmin
        .from("email_otps")
        .update({ attempts: (row.attempts as number) + 1 })
        .eq("id", row.id);
      throw new Error("That code is incorrect. Please try again.");
    }

    // Consume the OTP
    await supabaseAdmin.from("email_otps").delete().eq("id", row.id);

    // Ensure a Supabase user exists so we can mint a session for them.
    // Best-effort create; ignore "already exists" errors.
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: data.name ? { name: data.name } : undefined,
    });

    // Generate a magic-link token the client can exchange for a session
    // without Supabase sending any email itself.
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error("Could not complete sign-in. Please try again.");
    }

    return {
      email: data.email,
      token_hash: linkData.properties.hashed_token as string,
    };
  });
