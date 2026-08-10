/**
 * CodePad — Live HTML/CSS/JS Code Editor (Combined Worker)
 *
 * SETUP STEPS:
 * 1. Cloudflare dashboard -> Workers & Pages -> Create Worker
 * 2. Create a KV namespace (e.g. CODEPAD_KV) and bind it here as: CODEPAD_KV
 * 3. Add a Secret env var: ADMIN_PASSWORD
 * 4. Edit PAYMENT_CONFIG below with your real payment details.
 * 5. Paste this whole file into the Worker editor and Deploy.
 *
 * URLS after deploy:
 *   https://your-worker.workers.dev/        -> editor + live preview
 *   https://your-worker.workers.dev/admin   -> admin panel (approve subscriptions)
 */

// ===== EDIT YOUR PAYMENT DETAILS HERE =====
const PAYMENT_CONFIG = {
  monthlyFeeINR: 49,
  yearlyFeeINR: 399,
};
// ============================================

const DAY_MS = 24 * 60 * 60 * 1000;

const ICON_192_B64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAPOElEQVR4nO2da1AT1x7ASQhYg1IFUcTOtCoqFoRyUUAgyiMkEdhNdu016tz2jjNtxxms99Xb2w+1D2dqtXbm3tveL452uFM+2rpLNoJJ5CEPkcedtjw64Cji7QNibbREeXUScj/kjnU2CSR79hX4/4Yvnsme89+zP89rz+4qnkxKiAIArqi8Xq/UMQARjFLqAIDIBgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJldQBBGXj53+XOgR5Mfrbv0gdQgAU8WtWSx3Dr4A0ISIfmeQiEKjDATloJLFA4A0vSGiSlINosIcvJKxJaVogUEcgxG+KJBAodHvk0MfLBNlWmiI+cZWY5W384h/z/2D0+T+LE0nkIqs6FFWg+c8c1AkLmVSmeALNc8KgDmckr1WRBAp2nqAOL0hYvWJM48EeoQlWkwuOltARXCCwRxykckixUsgubFOQ6G+BPcIgfoVLsBIN9giH+HUroEAB/zeAPUITsIaDtUzoCCUQ2CMhYjoEOxIBJMQTCJofMRGttgURSLgeF0BBiOsiUgsEzY/4iFPn/AsEzY+c4f3qiNECQfMjFSLUPMzCACRAIAAJngWCAZD84fcaCd4CwQBIWoSuf+jCACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJEAhAAgQCkACBACRAIAAJlVQBBAAAAABJRU5ErkJggg==";
const ICON_512_B64 = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAp4klEQVR4nO3deXxV9Zn/8XshGCAJIIGAgFoIIouCsSxhCUsSkpDk3txztTp1HKe2depD+7NWf7W2al1qndqprf5+HbV2HkXn0al0LOfknpM9IYGQhJ0oW0Bkk31JAEMggSy/P+KPViZkOffce5bv6/mvXPKRnO/3fb7fe8734x46crgLACCeiI6ODrNrAACYoJ/ZBQAAzEEAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABCUMwPgM+mJvn5kovJ/QlEJAAvSMd51zCrW58wAAAD0iAAAAEERAAAgKAIAAARFAPwN3wMDImCkX0UAAICgHBsAjnxmC4ApnDqfRJhdABBu+/5z+vX+U/xD28JZCWAux64A9GFz0Nn2/ef0bmb/3vwB2B1j/O+xAoAQ+jStd/5hVgNwPCevAJy6bYc+0X1Tz2oAnRw8kzg5AIDgZ3AyAA5GAFyLLULHMGruJgMcg9F9DQIAzmTsrE0GwJEcHgD6Nu+4TbC7UMzXZIDd6RvXDv4CwOX4AAAAXA8BAKcJ3a06iwA4jPMDgF0gAOz/dMn5AQChhPomnUUAnIQAuC4WAYAzMJavR4gAcPw6Dp3Cc3vOIkAQIswbQgSAbtw4AHbHKO6GKAEgQpgDMIogM4YoAaAbtw+AfTF+u0cA9IxrCLAjRm6PBAoAQdZ0AIIkzlwhUAAEg1sJwF4Ys70hVgAEE+xcT4BdBDNaxbn9d4kWAACAq4QLABYBDhaeLr70CrY4bv97T7gAcJEBgHMx+/eJiAEQJDLAykJ9e87tv5UxNvtK0AAQMOoBdEPMOUHQAAgSNxpWFrqbdG7/rYxRqYO4ARBk4HO1AdYR5HgU8/bfJXIAuMgA5wrFrTq3/5bF7K+b0AEQPDLAsoydr5n9LYsxGAzRAyD48Of6syyjZm1mf8sKfvSJfPvvIgBcZICjBT93M/tbFrN/8NxRw2LMrsESuJicTUcfR6Z+K2PAGiKiw+wKHKPzitzLVWVJEx7a5nK59vcuBiYw9VvYbQYtuJn6XC6XezArgP/PqAuLDLC4bmKAqd/iGKTGIgC+gssLsCyGp+EIgGsZdZG5uM4AgzAqQ4SngK5l4PVh4FULCIvZP3RYAXTN2Lmbyw7QgWEYaqwAwoGlANBXjJowYAVwXaG4/rgHAXrE0AsbAqA7IboH4VoEusSICzMCoAehW4dyUQJXMdBMQQD0Ski3I7lAISxGlrkIgN4K9VdSXKwQCgPKCgiAPgjbYwlcu3AkRpDVEAB9E/5H07iUYWsMGSsjAPrM3MeTubhhcQwQGyEAdOItFcBSmPp14E1gnbjaAOtgPOrjHjw02uwabOy23P9rdgmA6Pb6/pfZJdgVAWAAYgAwBVN/kNgCMgBXIRB+jLvgsQIwEksBIAyY+o1CABiPGABChKnfWGwBGY9rFAgFRpbhWAGEEEsBwBBM/SFCAIQcMQDoxtQfUgRA+JAEQC8x74cHARBuxADQDab+cCIATEMSAFcx75uCADAfSQBhMe+biwCwFsIAjsekbx0EgHURBnAMJn1rIgBshlSAxTHX2wgBAACC4igIABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEERAAAgKAIAAARFAACAoAgAABAUAQAAgiIAAEBQBAAACIoAAABBEQAAICgCAAAERQAAgKAIAAAQFAEAAIIiAABAUAQAAAiKAAAAQREAACAoAgAABEUAAICgCAAAEBQBAACCIgAAQFAEAAAIigAAAEH9P+jhf6HCp4mTAAAAAElFTkSuQmCC";


export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // =========================================================
    // PUBLIC API
    // =========================================================

    if (path === "/api/payment-config" && request.method === "GET") {
      return json(PAYMENT_CONFIG);
    }

    // Free 3-day trial — one per phone number
    if (path === "/api/start-trial" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.name || !body.phone) return json({ error: "Missing fields" }, 400);

      const phone = body.phone.replace(/[^\d+]/g, "");
      const trialMarkerKey = `trial-used:${phone}`;
      const alreadyUsed = await env.KV_BINDING.get(trialMarkerKey);
      if (alreadyUsed) {
        return json({ error: "This phone number has already used its free trial." }, 400);
      }

      const subId = crypto.randomUUID();
      const licenseKey = genLicenseKey();
      const sub = {
        id: subId,
        name: body.name.trim(),
        phone,
        plan: "trial",
        planDays: 3,
        status: "approved",
        createdAt: Date.now(),
        approvedAt: Date.now(),
        expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        licenseKey,
        isTrial: true,
      };
      await env.KV_BINDING.put(`sub:${subId}`, JSON.stringify(sub));
      await env.KV_BINDING.put(`license:${licenseKey}`, JSON.stringify(sub));
      await env.KV_BINDING.put(trialMarkerKey, "1");

      return json({ success: true, licenseKey });
    }

    // Submit a subscription request (name/whatsapp/txnId) -> pending approval
    if (path === "/api/razorpay/create-link" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.plan || !body.name || !body.phone) return json({ error: "Missing fields" }, 400);

      const amountINR = body.plan === "yearly" ? PAYMENT_CONFIG.yearlyFeeINR : PAYMENT_CONFIG.monthlyFeeINR;
      const subId = crypto.randomUUID();
      const planDays = body.plan === "yearly" ? 365 : 30;

      const pendingSub = {
        id: subId,
        name: body.name.trim(),
        phone: body.phone.replace(/[^\d+]/g, ""),
        plan: body.plan,
        planDays,
        status: "awaiting_payment",
        createdAt: Date.now(),
      };
      await env.KV_BINDING.put(`sub:${subId}`, JSON.stringify(pendingSub));

      const auth = "Basic " + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
      const callbackUrl = `${url.origin}/payment-return?subId=${subId}`;

      const rzpRes = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": auth },
        body: JSON.stringify({
          amount: amountINR * 100,
          currency: "INR",
          accept_partial: false,
          description: `CodePad Pro — ${body.plan} plan`,
          reference_id: subId,
          customer: { name: pendingSub.name, contact: pendingSub.phone || undefined },
          notify: { sms: false, email: false },
          callback_url: callbackUrl,
          callback_method: "get",
        }),
      });

      const rzpRawText = await rzpRes.text();
      let rzpData = null;
      try { rzpData = JSON.parse(rzpRawText); } catch (e) {}

      if (!rzpRes.ok || !rzpData || !rzpData.short_url) {
        return json({ error: "Could not create payment link", status: rzpRes.status, raw: rzpRawText.slice(0, 500) }, 500);
      }

      pendingSub.paymentLinkId = rzpData.id;
      await env.KV_BINDING.put(`sub:${subId}`, JSON.stringify(pendingSub));

      return json({ success: true, paymentUrl: rzpData.short_url, subId });
    }

    if (path === "/api/razorpay/verify" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.subId) return json({ error: "Missing subId" }, 400);

      const raw = await env.KV_BINDING.get(`sub:${body.subId}`);
      if (!raw) return json({ error: "Not found" }, 404);
      const pending = JSON.parse(raw);
      if (!pending.paymentLinkId) return json({ error: "No payment link" }, 400);

      const auth = "Basic " + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payment_links/${pending.paymentLinkId}`, {
        headers: { "Authorization": auth },
      });
      const rzpData = await rzpRes.json().catch(() => null);
      if (!rzpRes.ok || !rzpData) return json({ paid: false });

      if (rzpData.status === "paid") {
        const existing = await env.KV_BINDING.get(`sub:${pending.id}`);
        const sub = existing ? JSON.parse(existing) : pending;
        if (sub.status !== "approved") {
          sub.status = "approved";
          sub.approvedAt = Date.now();
          sub.expiresAt = Date.now() + (sub.planDays || 30) * 24 * 60 * 60 * 1000;
          sub.txnId = rzpData.id;
          sub.paymentVerified = true;
          if (!sub.licenseKey) sub.licenseKey = genLicenseKey();
          await env.KV_BINDING.put(`sub:${sub.id}`, JSON.stringify(sub));
          await env.KV_BINDING.put(`license:${sub.licenseKey}`, JSON.stringify(sub));
        }
        return json({ paid: true, licenseKey: sub.licenseKey });
      }

      return json({ paid: false, status: rzpData.status });
    }

    // Check a license key -> returns valid true/false + expiry
    if (path === "/api/check-license" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key) return json({ valid: false });
      const raw = await env.KV_BINDING.get(`license:${body.key}`);
      if (!raw) return json({ valid: false });
      const sub = JSON.parse(raw);
      const valid = sub.status === "approved" && sub.expiresAt > Date.now();
      return json({ valid, expiresAt: sub.expiresAt || null, name: sub.name || null });
    }

    // Save a project under a license key (cloud save, paid feature)
    if (path === "/api/project/save" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key || !body.name) return json({ error: "Missing data" }, 400);
      const raw = await env.KV_BINDING.get(`license:${body.key}`);
      if (!raw) return json({ error: "Invalid license" }, 401);
      const sub = JSON.parse(raw);
      if (sub.status !== "approved" || sub.expiresAt < Date.now()) return json({ error: "Subscription expired" }, 401);

      const projectId = body.id || crypto.randomUUID();
      const project = {
        id: projectId,
        name: body.name,
        html: body.html || "",
        css: body.css || "",
        js: body.js || "",
        updatedAt: Date.now(),
      };
      await env.KV_BINDING.put(`project:${body.key}:${projectId}`, JSON.stringify(project));
      return json({ success: true, id: projectId });
    }

    // List projects for a license key
    if (path === "/api/project/list" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key) return json({ error: "Missing key" }, 400);
      const list = await env.KV_BINDING.list({ prefix: `project:${body.key}:` });
      const all = await Promise.all(
        list.keys.map(async (k) => {
          const v = await env.KV_BINDING.get(k.name);
          return v ? JSON.parse(v) : null;
        })
      );
      return json(all.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt));
    }

    // Delete a project
    if (path === "/api/project/delete" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key || !body.id) return json({ error: "Missing data" }, 400);
      await env.KV_BINDING.delete(`project:${body.key}:${body.id}`);
      return json({ success: true });
    }

    // =========================================================
    // ADMIN API (password protected)
    // =========================================================

    if (path === "/api/admin/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (body.password === env.ADMIN_PASSWORD) return json({ success: true });
      return json({ success: false, error: "Wrong password" }, 401);
    }

    if (path.startsWith("/api/admin/") && path !== "/api/admin/login") {
      const authHeader = request.headers.get("x-admin-password") || "";
      if (authHeader !== env.ADMIN_PASSWORD) return json({ error: "Unauthorized" }, 401);
    }

    if (path === "/api/admin/subs" && request.method === "GET") {
      const list = await env.KV_BINDING.list({ prefix: "sub:" });
      const all = await Promise.all(
        list.keys.map(async (k) => {
          const v = await env.KV_BINDING.get(k.name);
          return v ? JSON.parse(v) : null;
        })
      );
      return json(all.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt));
    }

    if (path === "/api/admin/approve" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.id) return json({ error: "Missing id" }, 400);
      const key = `sub:${body.id}`;
      const existing = await env.KV_BINDING.get(key);
      if (!existing) return json({ error: "Not found" }, 404);
      const sub = JSON.parse(existing);
      sub.status = "approved";
      sub.approvedAt = Date.now();
      sub.expiresAt = Date.now() + (sub.planDays || 30) * DAY_MS;
      if (!sub.licenseKey) sub.licenseKey = genLicenseKey();
      await env.KV_BINDING.put(key, JSON.stringify(sub));
      await env.KV_BINDING.put(`license:${sub.licenseKey}`, JSON.stringify(sub));
      return json({ success: true, sub });
    }

    if (path === "/api/admin/reject" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.id) return json({ error: "Missing id" }, 400);
      const key = `sub:${body.id}`;
      const existing = await env.KV_BINDING.get(key);
      if (!existing) return json({ error: "Not found" }, 404);
      const sub = JSON.parse(existing);
      sub.status = "rejected";
      await env.KV_BINDING.put(key, JSON.stringify(sub));
      return json({ success: true });
    }

    if (path === "/api/admin/renew" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.id) return json({ error: "Missing id" }, 400);
      const key = `sub:${body.id}`;
      const existing = await env.KV_BINDING.get(key);
      if (!existing) return json({ error: "Not found" }, 404);
      const sub = JSON.parse(existing);
      const base = sub.expiresAt && sub.expiresAt > Date.now() ? sub.expiresAt : Date.now();
      sub.expiresAt = base + (sub.planDays || 30) * DAY_MS;
      sub.status = "approved";
      if (!sub.licenseKey) sub.licenseKey = genLicenseKey();
      await env.KV_BINDING.put(key, JSON.stringify(sub));
      await env.KV_BINDING.put(`license:${sub.licenseKey}`, JSON.stringify(sub));
      return json({ success: true, sub });
    }

    if (path === "/api/admin/delete" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.id) return json({ error: "Missing id" }, 400);
      await env.KV_BINDING.delete(`sub:${body.id}`);
      return json({ success: true });
    }

    // =========================================================
    // PWA: MANIFEST, ICONS, SERVICE WORKER
    // =========================================================

    if (path === "/manifest.json") {
      const manifest = {
        name: "CodePad",
        short_name: "CodePad",
        description: "Write and preview HTML, CSS, and JS live — anywhere.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0F1512",
        theme_color: "#0F1512",
        orientation: "portrait",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        headers: { "content-type": "application/manifest+json" },
      });
    }

    if (path === "/icon-192.png") {
      return new Response(base64ToBytes(ICON_192_B64), {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
      });
    }

    if (path === "/icon-512.png") {
      return new Response(base64ToBytes(ICON_512_B64), {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
      });
    }

    if (path === "/sw.js") {
      return new Response(SERVICE_WORKER_JS, {
        headers: { "content-type": "application/javascript" },
      });
    }

    // =========================================================
    // FRONTEND PAGES
    // =========================================================

    if (path === "/payment-return") {
      const subId = url.searchParams.get("subId") || "";
      return new Response(PAYMENT_RETURN_HTML.replace("__SUB_ID__", subId), {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    if (path === "/admin" || path === "/admin/") {
      return new Response(ADMIN_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    if (path === "/" || path === "") {
      return new Response(EDITOR_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    return new Response("Not found", { status: 404 });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const SERVICE_WORKER_JS = `
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => { /* network-first, no offline caching needed */ });
`;

function genLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) out += "-";
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// =========================================================
// EDITOR PAGE HTML
// =========================================================
// =========================================================
// PAYMENT RETURN PAGE — verifies Razorpay payment, shows license key
// =========================================================
const PAYMENT_RETURN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verifying payment — CodePad</title>
<style>
  body{ font-family:sans-serif; background:#0F1512; color:#EDF2EE; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center; padding:20px; }
  .box{ max-width:420px; }
  h2{ color:#2FBF9F; }
  .spinner{ width:36px; height:36px; border:4px solid #2A342E; border-top-color:#2FBF9F; border-radius:50%; margin:20px auto; animation:spin 0.8s linear infinite; }
  @keyframes spin{ to{ transform:rotate(360deg); } }
  a{ color:#2FBF9F; font-weight:600; }
  .fail{ color:#E17C6E; }
  .key-box{ background:#1D2620; border:1.5px solid #2FBF9F; border-radius:10px; padding:16px; margin-top:16px; font-family:monospace; font-size:18px; letter-spacing:1px; color:#E8B23B; }
</style>
</head>
<body>
<div class="box">
  <h2 id="title">Verifying your payment...</h2>
  <div class="spinner" id="spinner"></div>
  <p id="msg">Please wait a moment.</p>
  <div id="keyBox" style="display:none;">
    <div class="key-box" id="keyText"></div>
    <p style="font-size:12px;color:#8FA098;margin-top:10px;">Save this license key — you'll need it to activate Pro in the app.</p>
  </div>
  <p><a href="/">Back to CodePad</a></p>
</div>
<script>
  const subId = "__SUB_ID__";
  async function verify(){
    try{
      const res = await fetch('/api/razorpay/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({subId}) });
      const data = await res.json();
      document.getElementById('spinner').style.display='none';
      if(data.paid){
        document.getElementById('title').textContent = '✓ Payment successful!';
        document.getElementById('msg').textContent = 'Your CodePad Pro license is ready:';
        document.getElementById('keyBox').style.display = 'block';
        document.getElementById('keyText').textContent = data.licenseKey;
      } else {
        document.getElementById('title').textContent = 'Payment not completed';
        document.getElementById('title').className = 'fail';
        document.getElementById('msg').textContent = 'If you completed the payment, please wait a minute and refresh this page.';
      }
    }catch(e){
      document.getElementById('spinner').style.display='none';
      document.getElementById('title').textContent = 'Something went wrong';
      document.getElementById('msg').textContent = 'Please contact support if the amount was deducted.';
    }
  }
  verify();
</script>
</body>
</html>`;

const EDITOR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CodePad — HTML/CSS/JS Live Editor</title>
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0F1512">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/xml/xml.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/css/css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/htmlmixed/htmlmixed.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<style>
  :root{
    --bg:#0F1512; --panel:#161D19; --panel2:#1D2620; --ink:#EDF2EE;
    --teal:#2FBF9F; --amber:#E8B23B; --line:#2A342E; --muted:#8FA098;
  }
  body.light-theme{
    --bg:#F7F4EC; --panel:#FFFDF8; --panel2:#F1E9D8; --ink:#16211F;
    --teal:#0F7A5F; --amber:#C9971B; --line:#DCD5C2; --muted:#6A756F;
  }
  body.light-theme .CodeMirror{ background:#FFFDF8 !important; }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{ background:var(--bg); color:var(--ink); font-family:'IBM Plex Sans', sans-serif; height:100vh; overflow:hidden; }
  .mono{ font-family:'IBM Plex Mono', monospace; }

  header{ background:var(--panel); border-bottom:1px solid var(--line); padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .logo{ font-family:'Fraunces'; font-weight:700; font-size:17px; display:flex; align-items:center; gap:7px; }
  .logo .dot{ width:8px; height:8px; background:var(--teal); border-radius:50%; }
  .header-actions{ display:flex; gap:6px; align-items:center; }
  .icon-btn{ background:var(--panel2); border:1px solid var(--line); color:var(--ink); padding:7px 10px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; }
  .icon-btn:hover{ border-color:var(--teal); }
  .icon-btn.primary{ background:var(--teal); color:#0A2B22; border-color:var(--teal); }
  .badge{ font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; background:var(--amber); color:#3A2C05; }
  .badge.free{ background:var(--panel2); color:var(--muted); border:1px solid var(--line); }

  .tabs{ display:flex; background:var(--panel); border-bottom:1px solid var(--line); }
  .tab{ padding:9px 18px; font-size:12.5px; font-weight:600; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; }
  .tab.active{ color:var(--ink); border-bottom-color:var(--teal); }

  .layout{ display:flex; height:calc(100vh - 168px); flex-direction:column; }
  @media(min-width:860px){ .layout{ flex-direction:row; } }

  .editor-pane{ flex:1; display:flex; flex-direction:column; min-height:0; }
  .code-area{ flex:1; background:var(--panel); }
  textarea.code{ width:100%; height:100%; background:var(--panel); color:var(--ink); border:none; outline:none; resize:none; font-family:'IBM Plex Mono', monospace; font-size:13.5px; padding:14px; line-height:1.6; }
  .code-area, textarea.code{ display:none; }
  .code-area.active{ display:block; height:100%; }
  .CodeMirror{ height:100% !important; font-family:'IBM Plex Mono', monospace; font-size:13.5px; }

  .console-panel{ background:#0A0F0C; border-top:1px solid var(--line); height:120px; display:flex; flex-direction:column; }
  .console-header{ padding:6px 12px; font-size:11px; color:var(--muted); display:flex; justify-content:space-between; border-bottom:1px solid var(--line); }
  .console-clear{ cursor:pointer; color:var(--teal); }
  .console-body{ flex:1; overflow-y:auto; padding:6px 12px; font-family:'IBM Plex Mono', monospace; font-size:11.5px; }
  .console-line{ padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.04); word-break:break-word; }
  .console-line.error{ color:#F27C6E; }
  .console-line.warn{ color:var(--amber); }

  .preview-pane{ flex:1; border-top:1px solid var(--line); display:flex; flex-direction:column; min-height:0; }
  @media(min-width:860px){ .preview-pane{ border-top:none; border-left:1px solid var(--line); } }
  .preview-bar{ background:var(--panel); padding:8px 14px; font-size:11.5px; color:var(--muted); display:flex; justify-content:space-between; align-items:center; }
  iframe{ flex:1; border:none; background:#fff; width:100%; }

  .modal-overlay{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:200; align-items:flex-end; justify-content:center; }
  .modal-overlay.open{ display:flex; }
  .modal{ background:var(--panel); width:100%; max-width:480px; border-radius:16px 16px 0 0; padding:22px 20px 30px; max-height:88vh; overflow-y:auto; }
  .modal h2{ font-family:'Fraunces'; font-size:19px; margin-bottom:14px; }
  .field{ margin-top:12px; }
  .field label{ font-size:11.5px; font-weight:600; color:var(--muted); display:block; margin-bottom:5px; }
  .field input, .field select{ width:100%; padding:11px 12px; border-radius:8px; border:1.5px solid var(--line); background:var(--panel2); color:var(--ink); font-size:14px; }
  .btn-full{ width:100%; margin-top:16px; background:var(--teal); color:#0A2B22; border:none; padding:12px; border-radius:9px; font-weight:700; font-size:14px; cursor:pointer; }
  .plan-toggle{ display:flex; gap:8px; margin-top:6px; }
  .plan-btn{ flex:1; padding:11px; border-radius:9px; border:1.5px solid var(--line); background:var(--panel2); text-align:center; cursor:pointer; font-size:12.5px; }
  .plan-btn.active{ border-color:var(--teal); background:rgba(47,191,159,0.12); }
  .pay-box{ margin-top:14px; background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:14px; font-size:12.5px; color:var(--muted); line-height:1.6; }
  .pay-box b{ color:var(--ink); }
  .success-msg{ display:none; background:rgba(47,191,159,0.12); border:1px solid var(--teal); color:var(--teal); padding:12px; border-radius:9px; font-size:12.5px; margin-top:12px; }
  .success-msg.show{ display:block; }
  .proj-list{ margin-top:10px; }
  .proj-item{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--panel2); border-radius:8px; margin-top:8px; font-size:13px; }
  .proj-item button{ background:transparent; border:1px solid var(--line); color:var(--muted); padding:5px 10px; border-radius:6px; font-size:11px; cursor:pointer; }
  .lock-note{ font-size:11.5px; color:var(--muted); margin-top:14px; text-align:center; line-height:1.6; }
</style>
</head>
<body>

<header>
  <div class="logo"><span class="dot"></span>CodePad</div>
  <div class="header-actions">
    <span class="badge free" id="planBadge">Free</span>
    <button class="icon-btn" onclick="toggleTheme()" id="themeBtn" title="Toggle theme">☀️</button>
    <button class="icon-btn" onclick="openModal('templates')">Templates</button>
    <button class="icon-btn" onclick="shareCode()">Share</button>
    <button class="icon-btn" onclick="exportZip()">Export</button>
    <button class="icon-btn" onclick="openModal('projects')">Projects</button>
    <button class="icon-btn primary" onclick="openModal('upgrade')">Upgrade</button>
  </div>
</header>

<div id="aboutBar" style="background:#161D19;border-bottom:1px solid #2A342E;padding:8px 14px;font-size:11.5px;color:#8FA098;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
  <span>CodePad is a browser-based HTML/CSS/JS code editor with live preview, templates, auto-save, and share links. Free to use — upgrade to <b style="color:#E8B23B;">Pro (₹49/mo or ₹399/yr)</b> for unlimited cloud-saved projects.</span>
  <a href="#" onclick="openModal('about'); return false;" style="color:#2FBF9F; white-space:nowrap;">Learn more</a>
</div>

<div class="tabs">
  <div class="tab active" data-tab="html" onclick="switchTab('html')">HTML</div>
  <div class="tab" data-tab="css" onclick="switchTab('css')">CSS</div>
  <div class="tab" data-tab="js" onclick="switchTab('js')">JS</div>
  <div style="margin-left:auto; display:flex; align-items:center; padding-right:10px;">
    <label style="font-size:10px; color:#8FA098; display:flex; align-items:center; gap:4px; cursor:pointer;">
      <input type="file" id="imageUploadInput" accept="image/*" style="display:none;" onchange="handleImageUpload(event)">
      <button class="icon-btn" onclick="document.getElementById('imageUploadInput').click()" style="padding:4px 8px; font-size:10px;">🖼️ Image</button>
    </label>
  </div>
</div>

<div id="symbolToolbar" style="display:flex; gap:6px; overflow-x:auto; padding:6px 10px; background:#161D19; border-bottom:1px solid #2A342E;">
</div>

<div class="layout">
  <div class="editor-pane">
    <div class="code-area active" id="area-html"><div id="cm-html"></div></div>
    <div class="code-area" id="area-css"><div id="cm-css"></div></div>
    <div class="code-area" id="area-js"><div id="cm-js"></div></div>
  </div>
  <div class="preview-pane">
    <div class="preview-bar"><span>Live Preview</span><span id="previewStatus">●</span></div>
    <iframe id="previewFrame"></iframe>
    <div class="console-panel">
      <div class="console-header"><span>Console</span><span class="console-clear" onclick="clearConsole()">Clear</span></div>
      <div class="console-body" id="consoleBody"></div>
    </div>
  </div>
</div>

<!-- UPGRADE MODAL -->
<div class="modal-overlay" id="modalUpgrade">
  <div class="modal">
    <h2>Upgrade to CodePad Pro</h2>
    <div class="plan-toggle">
      <div class="plan-btn active" id="planMonthly" onclick="selectPlan('monthly')">
        <div style="font-weight:700;">Monthly</div>
        <div id="monthlyLabel" style="color:var(--muted); margin-top:2px;">Loading...</div>
      </div>
      <div class="plan-btn" id="planYearly" onclick="selectPlan('yearly')">
        <div style="font-weight:700;">Yearly</div>
        <div id="yearlyLabel" style="color:var(--muted); margin-top:2px;">Loading...</div>
      </div>
    </div>
    <div class="pay-box" id="payBox">Loading payment details...</div>
    <div class="field"><label>Your name</label><input type="text" id="subName" placeholder="Full name"></div>
    <div class="field"><label>WhatsApp number (with country code)</label><input type="tel" id="subPhone" placeholder="+91XXXXXXXXXX"></div>
    <button class="btn-full" onclick="submitSubscription()">Pay with Razorpay</button>
    <button class="btn-full" onclick="startFreeTrial()" style="background:transparent; border:1.5px solid var(--teal); color:var(--teal); margin-top:8px;">Start 3-Day Free Trial</button>
    <div class="success-msg" id="subSuccess">✓ Redirecting to payment...</div>
    <div class="success-msg" id="trialSuccess"></div>
    <div class="lock-note">Already have a license key? <a href="#" onclick="openModal('license'); return false;" style="color:var(--teal);">Enter it here</a></div>
  </div>
</div>

<!-- LICENSE MODAL -->
<div class="modal-overlay" id="modalLicense">
  <div class="modal">
    <h2>Enter License Key</h2>
    <div class="field"><label>License key</label><input type="text" id="licenseInput" placeholder="XXXX-XXXX-XXXX"></div>
    <button class="btn-full" onclick="activateLicense()">Activate</button>
    <div class="success-msg" id="licenseMsg"></div>
  </div>
</div>

<div class="modal-overlay" id="modalAbout">
  <div class="modal">
    <h2>About CodePad</h2>
    <div style="font-size:13.5px; color:var(--muted); line-height:1.7; margin-top:10px; max-height:60vh; overflow-y:auto;">
      <p><b style="color:var(--ink);">What CodePad offers:</b> CodePad is a software-as-a-service (SaaS) web application that lets users write, test, and preview HTML, CSS, and JavaScript code directly in their browser — no installation required.</p>
      <p style="margin-top:10px;"><b style="color:var(--ink);">Features:</b><br>
      💻 Live preview — see changes update in real time<br>
      🎨 Syntax highlighting with Dark and Light theme options<br>
      🖥️ Built-in console for logs, warnings, and errors<br>
      📚 Starter templates — Landing Page, Contact Form, Card Layout, To-Do List, and more<br>
      💾 Auto-save — code is saved automatically as you type, no account needed<br>
      🔗 Share with a link — generate a shareable link that opens your exact code for anyone<br>
      🖼️ Image support — upload images directly into your project<br>
      ⌨️ Mobile-friendly symbol toolbar for fast coding on a phone keyboard<br>
      📦 Export your code as a downloadable ZIP file<br>
      ☁️ Cloud save (Pro) — unlimited projects saved to the cloud, accessible from any device</p>
      <p style="margin-top:10px;"><b style="color:var(--ink);">Pricing:</b><br>
      Free: unlimited use of the code editor, live preview, console, templates, auto-save, share links, and ZIP export.<br>
      CodePad Pro — ₹49/month or ₹399/year: adds unlimited cloud-saved projects accessible from any device.</p>
      <p style="margin-top:10px;"><b style="color:var(--ink);">Who it's for:</b> Students, developers, and hobbyists who want a quick, mobile-friendly way to write and test front-end code without setting up a local development environment.</p>
      <p style="margin-top:10px;"><b style="color:var(--ink);">Contact:</b> kumarpk12888@gmail.com</p>
    </div>
    <button class="btn-full" onclick="closeAbout()" style="margin-top:16px;">Close</button>
  </div>
</div>

<div class="modal-overlay" id="modalTemplates">
  <div class="modal">
    <h2>Starter Templates</h2>
    <div style="margin-top:14px; display:flex; flex-direction:column; gap:8px;">
      <button class="icon-btn" style="width:100%; text-align:left; padding:12px;" onclick="loadTemplate('blank')">📄 Blank</button>
      <button class="icon-btn" style="width:100%; text-align:left; padding:12px;" onclick="loadTemplate('landing')">🚀 Landing Page</button>
      <button class="icon-btn" style="width:100%; text-align:left; padding:12px;" onclick="loadTemplate('form')">📝 Contact Form</button>
      <button class="icon-btn" style="width:100%; text-align:left; padding:12px;" onclick="loadTemplate('card')">🃏 Card Layout</button>
      <button class="icon-btn" style="width:100%; text-align:left; padding:12px;" onclick="loadTemplate('todo')">✅ To-Do List (JS)</button>
    </div>
    <button class="btn-full" onclick="closeTemplates()" style="margin-top:16px;">Close</button>
  </div>
</div>

<!-- PROJECTS MODAL -->
<div class="modal-overlay" id="modalProjects">
  <div class="modal">
    <h2>Your Projects</h2>
    <div id="projectsLockedNote" class="lock-note" style="display:none;">Cloud save is a Pro feature. Upgrade to save unlimited projects.</div>
    <div id="projectsUnlockedArea" style="display:none;">
      <div class="field"><label>Project name</label><input type="text" id="newProjectName" placeholder="My project"></div>
      <button class="btn-full" onclick="saveCurrentProject()">Save current code as project</button>
      <div class="proj-list" id="projectList"></div>
    </div>
  </div>
</div>

<script>
  let activeTab = 'html';
  let licenseKey = null;
  let paymentConfig = null;
  let selectedPlan = 'monthly';

  const DEFAULT_HTML = '<h1>Hello CodePad!</h1>\\n<p>Edit the HTML, CSS, and JS tabs — the preview updates live.</p>';
  const DEFAULT_CSS = 'body{ font-family:sans-serif; padding:20px; }\\nh1{ color:#2FBF9F; }';
  const DEFAULT_JS = 'console.log("CodePad is running");';

  const cmHtml = CodeMirror(document.getElementById('cm-html'), { value: DEFAULT_HTML, mode:'htmlmixed', theme:'dracula', lineNumbers:true, tabSize:2 });
  const cmCss = CodeMirror(document.getElementById('cm-css'), { value: DEFAULT_CSS, mode:'css', theme:'dracula', lineNumbers:true, tabSize:2 });
  const cmJs = CodeMirror(document.getElementById('cm-js'), { value: DEFAULT_JS, mode:'javascript', theme:'dracula', lineNumbers:true, tabSize:2 });

  function switchTab(tab){
    activeTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
    document.querySelectorAll('.code-area').forEach(a => a.classList.remove('active'));
    document.getElementById('area-'+tab).classList.add('active');
    setTimeout(()=>{ [cmHtml,cmCss,cmJs].forEach(cm=>cm.refresh()); }, 10);
  }

  // ===== THEME TOGGLE =====
  function toggleTheme(){
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('codepad_theme', isLight ? 'light' : 'dark');
    const cmTheme = isLight ? 'default' : 'dracula';
    [cmHtml, cmCss, cmJs].forEach(cm => cm.setOption('theme', cmTheme));
    document.getElementById('themeBtn').textContent = isLight ? '🌙' : '☀️';
  }
  function restoreTheme(){
    if(localStorage.getItem('codepad_theme') === 'light'){ toggleTheme(); }
  }

  // ===== TEMPLATES =====
  const TEMPLATES = {
    blank: { html: '', css: '', js: '' },
    landing: {
      html: '<div class="hero">\\n  <h1>Welcome to MyBrand</h1>\\n  <p>A simple landing page starter.</p>\\n  <button>Get Started</button>\\n</div>',
      css: 'body{ font-family:sans-serif; margin:0; }\\n.hero{ text-align:center; padding:80px 20px; background:#0F3D3E; color:#fff; }\\n.hero button{ padding:12px 28px; border:none; border-radius:6px; background:#C9971B; color:#3A2C05; font-weight:700; margin-top:16px; cursor:pointer; }',
      js: 'document.querySelector("button").addEventListener("click", () => alert("Let\\'s go!"));'
    },
    form: {
      html: '<form id="contactForm">\\n  <label>Name</label>\\n  <input type="text" id="name" required>\\n  <label>Email</label>\\n  <input type="email" id="email" required>\\n  <label>Message</label>\\n  <textarea id="message" rows="4"></textarea>\\n  <button type="submit">Send</button>\\n</form>',
      css: 'body{ font-family:sans-serif; padding:20px; }\\nform{ display:flex; flex-direction:column; gap:8px; max-width:320px; }\\ninput, textarea{ padding:8px; border:1px solid #ccc; border-radius:4px; }\\nbutton{ padding:10px; background:#2FBF9F; color:#fff; border:none; border-radius:4px; }',
      js: 'document.getElementById("contactForm").addEventListener("submit", function(e){\\n  e.preventDefault();\\n  alert("Thanks, " + document.getElementById("name").value + "!");\\n});'
    },
    card: {
      html: '<div class="card">\\n  <h2>Card Title</h2>\\n  <p>Some quick example text for this card.</p>\\n  <a href="#">Read more</a>\\n</div>',
      css: 'body{ font-family:sans-serif; padding:20px; background:#f4f4f4; }\\n.card{ background:#fff; border-radius:8px; padding:20px; max-width:320px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }\\n.card a{ color:#2FBF9F; font-weight:600; text-decoration:none; }',
      js: ''
    },
    todo: {
      html: '<h2>To-Do List</h2>\\n<input id="taskInput" placeholder="Add a task...">\\n<button id="addBtn">Add</button>\\n<ul id="taskList"></ul>',
      css: 'body{ font-family:sans-serif; padding:20px; }\\nli{ margin:6px 0; }',
      js: 'document.getElementById("addBtn").addEventListener("click", function(){\\n  const input = document.getElementById("taskInput");\\n  if(!input.value.trim()) return;\\n  const li = document.createElement("li");\\n  li.textContent = input.value;\\n  document.getElementById("taskList").appendChild(li);\\n  input.value = "";\\n});'
    }
  };
  function loadTemplate(name){
    const t = TEMPLATES[name];
    if(!t) return;
    cmHtml.setValue(t.html);
    cmCss.setValue(t.css);
    cmJs.setValue(t.js);
    clearConsole();
    runPreview();
    closeTemplates();
  }
  function closeTemplates(){ document.getElementById('modalTemplates').classList.remove('open'); }

  // ===== AUTO-SAVE (local draft) =====
  function saveDraft(){
    try{
      localStorage.setItem('codepad_draft', JSON.stringify({ html: cmHtml.getValue(), css: cmCss.getValue(), js: cmJs.getValue() }));
    }catch(e){}
  }
  function restoreDraft(){
    try{
      const raw = localStorage.getItem('codepad_draft');
      if(!raw) return false;
      const d = JSON.parse(raw);
      cmHtml.setValue(d.html || '');
      cmCss.setValue(d.css || '');
      cmJs.setValue(d.js || '');
      return true;
    }catch(e){ return false; }
  }

  // ===== SYMBOL TOOLBAR (mobile-friendly quick insert) =====
  const SYMBOLS = ['<', '>', '/', '"', "'", '{', '}', '(', ')', ';', ':', '=', '#', '.'];
  function buildSymbolToolbar(){
    const bar = document.getElementById('symbolToolbar');
    bar.innerHTML = SYMBOLS.map(s => '<button class="icon-btn" style="padding:4px 10px; font-family:monospace; flex-shrink:0;" onclick="insertSymbol(' + JSON.stringify(s) + ')">' + s.replace('<','&lt;').replace('>','&gt;') + '</button>').join('');
  }
  function insertSymbol(sym){
    const cm = activeTab === 'html' ? cmHtml : activeTab === 'css' ? cmCss : cmJs;
    cm.replaceSelection(sym);
    cm.focus();
  }

  // ===== IMAGE UPLOAD (base64 embed) =====
  function handleImageUpload(event){
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
      const imgTag = '<img src="' + e.target.result + '" alt="' + file.name + '" style="max-width:100%;">';
      cmHtml.replaceSelection(imgTag);
      switchTab('html');
      runPreview();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // ===== SHARE LINK =====
  function shareCode(){
    try{
      const data = { h: cmHtml.getValue(), c: cmCss.getValue(), j: cmJs.getValue() };
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const shareUrl = window.location.origin + '/#code=' + encoded;
      if(navigator.clipboard){
        navigator.clipboard.writeText(shareUrl).then(()=> alert('Share link copied to clipboard!'));
      } else {
        prompt('Copy this share link:', shareUrl);
      }
    }catch(e){ alert('Could not create share link (code may be too large).'); }
  }
  function loadFromShareLink(){
    if(!window.location.hash.startsWith('#code=')) return false;
    try{
      const encoded = window.location.hash.slice(6);
      const data = JSON.parse(decodeURIComponent(atob(encoded)));
      cmHtml.setValue(data.h || '');
      cmCss.setValue(data.c || '');
      cmJs.setValue(data.j || '');
      return true;
    }catch(e){ return false; }
  }

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', function(e){
    if((e.ctrlKey || e.metaKey) && e.key === 's'){
      e.preventDefault();
      saveDraft();
      const btn = document.getElementById('themeBtn');
      const old = btn.textContent;
      alertSaved();
    }
    if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      e.preventDefault();
      clearConsole();
      runPreview();
    }
  });
  function alertSaved(){
    const b = document.createElement('div');
    b.textContent = 'Draft saved locally';
    b.style.cssText = 'position:fixed; bottom:130px; left:50%; transform:translateX(-50%); background:#2FBF9F; color:#0A2B22; padding:8px 16px; border-radius:20px; font-size:12px; z-index:9999;';
    document.body.appendChild(b);
    setTimeout(()=> b.remove(), 1500);
  }

  const consoleCaptureScript = \`
    <scr\` + \`ipt>
      const send = (type, args) => {
        try {
          window.parent.postMessage({ __codepad_console: true, type, message: args.map(a => {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); }
          }).join(' ') }, '*');
        } catch(e){}
      };
      ['log','warn','error','info'].forEach(m => {
        const orig = console[m];
        console[m] = function(...args){ send(m, args); orig.apply(console, args); };
      });
      window.addEventListener('error', (e) => send('error', [e.message]));
    </scr\` + \`ipt>
  \`;

  function runPreview(){
    const html = cmHtml.getValue();
    const css = cmCss.getValue();
    const js = cmJs.getValue();
    const doc = '<!DOCTYPE html><html><head><style>'+css+'</style></head><body>'+html+consoleCaptureScript+'<scr'+'ipt>'+js+'</scr'+'ipt></body></html>';
    document.getElementById('previewFrame').srcdoc = doc;
  }

  window.addEventListener('message', (e) => {
    if(e.data && e.data.__codepad_console){
      const body = document.getElementById('consoleBody');
      const line = document.createElement('div');
      line.className = 'console-line ' + (e.data.type==='error' ? 'error' : e.data.type==='warn' ? 'warn' : '');
      line.textContent = e.data.message;
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    }
  });

  function clearConsole(){ document.getElementById('consoleBody').innerHTML = ''; }

  function debounce(fn, delay){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
  }

  const debouncedRun = debounce(() => { clearConsole(); runPreview(); }, 500);
  cmHtml.on('change', debouncedRun);
  cmCss.on('change', debouncedRun);
  cmJs.on('change', debouncedRun);

  async function exportZip(){
    const zip = new JSZip();
    zip.file('index.html', cmHtml.getValue());
    zip.file('style.css', cmCss.getValue());
    zip.file('script.js', cmJs.getValue());
    const blob = await zip.generateAsync({ type:'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'codepad-export.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openModal(name){
    document.getElementById('modalUpgrade').classList.remove('open');
    document.getElementById('modalLicense').classList.remove('open');
    document.getElementById('modalProjects').classList.remove('open');
    document.getElementById('modalAbout').classList.remove('open');
    document.getElementById('modalTemplates').classList.remove('open');
    if(name==='upgrade') document.getElementById('modalUpgrade').classList.add('open');
    if(name==='license') document.getElementById('modalLicense').classList.add('open');
    if(name==='about') document.getElementById('modalAbout').classList.add('open');
    if(name==='templates') document.getElementById('modalTemplates').classList.add('open');
    if(name==='projects'){
      document.getElementById('modalProjects').classList.add('open');
      refreshProjectsView();
    }
  }
  function closeAbout(){ document.getElementById('modalAbout').classList.remove('open'); }
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e)=>{ if(e.target===ov) ov.classList.remove('open'); });
  });

  function selectPlan(plan){
    selectedPlan = plan;
    document.getElementById('planMonthly').classList.toggle('active', plan==='monthly');
    document.getElementById('planYearly').classList.toggle('active', plan==='yearly');
    renderPayBox();
  }

  async function loadPaymentConfig(){
    try{
      const res = await fetch('/api/payment-config');
      paymentConfig = await res.json();
    }catch(e){ paymentConfig = {}; }
    document.getElementById('monthlyLabel').textContent = '₹' + paymentConfig.monthlyFeeINR + '/mo';
    document.getElementById('yearlyLabel').textContent = '₹' + paymentConfig.yearlyFeeINR + '/yr';
    renderPayBox();
  }

  function renderPayBox(){
    if(!paymentConfig) return;
    const fee = selectedPlan==='monthly' ? paymentConfig.monthlyFeeINR : paymentConfig.yearlyFeeINR;
    document.getElementById('payBox').innerHTML =
      '<b>Amount:</b> ₹' + fee + '<br><br>You\\'ll be redirected to Razorpay to pay securely via UPI, card, or netbanking. Your license activates automatically once payment is confirmed.';
  }

  async function submitSubscription(){
    const payload = {
      name: document.getElementById('subName').value.trim(),
      phone: document.getElementById('subPhone').value.trim(),
      plan: selectedPlan,
    };
    if(!payload.name || !payload.phone){ alert('Please fill in all fields.'); return; }
    try{
      const res = await fetch('/api/razorpay/create-link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.success && data.paymentUrl){
        document.getElementById('subSuccess').classList.add('show');
        window.location.href = data.paymentUrl;
      } else { alert('ERROR: ' + JSON.stringify(data)); }
    }catch(e){ alert('Network error, please try again.'); }
  }

  async function startFreeTrial(){
    const payload = {
      name: document.getElementById('subName').value.trim(),
      phone: document.getElementById('subPhone').value.trim(),
    };
    if(!payload.name || !payload.phone){ alert('Please fill in your name and WhatsApp number first.'); return; }
    try{
      const res = await fetch('/api/start-trial', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.success && data.licenseKey){
        licenseKey = data.licenseKey;
        localStorage.setItem('codepad_license', data.licenseKey);
        updatePlanBadge();
        const msg = document.getElementById('trialSuccess');
        msg.textContent = '✓ Trial activated! Your license key: ' + data.licenseKey + ' (valid 3 days, saved on this device)';
        msg.classList.add('show');
      } else {
        alert(data.error || 'Could not start trial.');
      }
    }catch(e){ alert('Network error, please try again.'); }
  }

  async function activateLicense(){
    const key = document.getElementById('licenseInput').value.trim().toUpperCase();
    if(!key){ return; }
    try{
      const res = await fetch('/api/check-license', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key}) });
      const data = await res.json();
      if(data.valid){
        licenseKey = key;
        localStorage.setItem('codepad_license', key);
        document.getElementById('licenseMsg').textContent = '✓ Activated! Pro features unlocked.';
        document.getElementById('licenseMsg').classList.add('show');
        updatePlanBadge();
        setTimeout(()=>{ document.getElementById('modalLicense').classList.remove('open'); }, 1200);
      } else {
        document.getElementById('licenseMsg').textContent = 'Invalid or expired license key.';
        document.getElementById('licenseMsg').classList.add('show');
      }
    }catch(e){ alert('Network error, please try again.'); }
  }

  function updatePlanBadge(){
    const badge = document.getElementById('planBadge');
    if(licenseKey){ badge.textContent = 'Pro'; badge.classList.remove('free'); }
    else { badge.textContent = 'Free'; badge.classList.add('free'); }
  }

  async function refreshProjectsView(){
    if(!licenseKey){
      document.getElementById('projectsLockedNote').style.display = 'block';
      document.getElementById('projectsUnlockedArea').style.display = 'none';
      return;
    }
    document.getElementById('projectsLockedNote').style.display = 'none';
    document.getElementById('projectsUnlockedArea').style.display = 'block';
    try{
      const res = await fetch('/api/project/list', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key: licenseKey}) });
      const projects = await res.json();
      const list = document.getElementById('projectList');
      if(!projects.length){ list.innerHTML = '<div style="color:var(--muted); font-size:12.5px; margin-top:10px;">No saved projects yet.</div>'; return; }
      list.innerHTML = projects.map(p => \`
        <div class="proj-item">
          <span>\${p.name}</span>
          <span>
            <button onclick='loadProject(\${JSON.stringify(p).replace(/'/g,"&#39;")})'>Load</button>
            <button onclick="deleteProject('\${p.id}')">Delete</button>
          </span>
        </div>\`).join('');
    }catch(e){}
  }

  function loadProject(p){
    cmHtml.setValue(p.html || '');
    cmCss.setValue(p.css || '');
    cmJs.setValue(p.js || '');
    clearConsole();
    runPreview();
    document.getElementById('modalProjects').classList.remove('open');
  }

  async function saveCurrentProject(){
    const name = document.getElementById('newProjectName').value.trim();
    if(!name){ alert('Please enter a project name.'); return; }
    const payload = {
      key: licenseKey, name,
      html: cmHtml.getValue(),
      css: cmCss.getValue(),
      js: cmJs.getValue(),
    };
    try{
      const res = await fetch('/api/project/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.success){ document.getElementById('newProjectName').value=''; refreshProjectsView(); }
      else { alert(data.error || 'Could not save.'); }
    }catch(e){ alert('Network error.'); }
  }

  async function deleteProject(id){
    if(!confirm('Delete this project?')) return;
    await fetch('/api/project/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key: licenseKey, id}) });
    refreshProjectsView();
  }

  async function restoreLicense(){
    const saved = localStorage.getItem('codepad_license');
    if(!saved) return;
    try{
      const res = await fetch('/api/check-license', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key: saved}) });
      const data = await res.json();
      if(data.valid){ licenseKey = saved; updatePlanBadge(); }
    }catch(e){}
  }

  buildSymbolToolbar();
  restoreTheme();
  const hadShareLink = loadFromShareLink();
  if(!hadShareLink) restoreDraft();
  runPreview();
  loadPaymentConfig();
  restoreLicense();
  setTimeout(()=>{ [cmHtml,cmCss,cmJs].forEach(cm=>cm.refresh()); }, 100);

  const debouncedSaveDraft = debounce(saveDraft, 1000);
  cmHtml.on('change', debouncedSaveDraft);
  cmCss.on('change', debouncedSaveDraft);
  cmJs.on('change', debouncedSaveDraft);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
</script>
</body>
</html>`;

// =========================================================
// ADMIN PANEL HTML
// =========================================================
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CodePad Admin</title>
<style>
  :root{ --bg:#0F1512; --panel:#161D19; --panel2:#1D2620; --ink:#EDF2EE; --teal:#2FBF9F; --amber:#E8B23B; --line:#2A342E; --muted:#8FA098; --red:#E1594C; }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{ background:var(--bg); color:var(--ink); font-family:sans-serif; }
  header{ background:var(--panel); padding:14px 18px; font-weight:700; border-bottom:1px solid var(--line); }
  .login-wrap{ max-width:340px; margin:70px auto; padding:0 16px; }
  .card{ background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:22px; }
  .card input{ width:100%; padding:11px; border-radius:8px; border:1.5px solid var(--line); background:var(--panel2); color:var(--ink); margin-bottom:10px; }
  .card button{ width:100%; background:var(--teal); color:#0A2B22; border:none; padding:11px; border-radius:8px; font-weight:700; cursor:pointer; }
  .err{ color:var(--red); font-size:12px; margin-top:8px; display:none; }
  #dash{ display:none; padding:18px; max-width:800px; margin:0 auto; }
  .filters{ display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .ftab{ padding:6px 13px; border-radius:999px; border:1px solid var(--line); background:var(--panel2); font-size:12px; cursor:pointer; }
  .ftab.active{ background:var(--teal); color:#0A2B22; border-color:var(--teal); }
  .item{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:10px; }
  .item-top{ display:flex; justify-content:space-between; }
  .badge{ font-size:10px; font-weight:700; padding:3px 8px; border-radius:999px; text-transform:uppercase; }
  .badge.pending{ background:#4A3B0F; color:var(--amber); }
  .badge.approved{ background:#123A2C; color:var(--teal); }
  .badge.rejected{ background:#3A1613; color:var(--red); }
  .meta{ font-size:12px; color:var(--muted); margin-top:6px; line-height:1.6; }
  .txn{ background:var(--panel2); border-radius:6px; padding:6px 9px; font-size:11.5px; margin-top:8px; font-family:monospace; }
  .actions{ display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
  .actions button{ padding:6px 12px; border-radius:7px; border:none; font-size:11.5px; font-weight:600; cursor:pointer; }
  .a-approve{ background:var(--teal); color:#0A2B22; }
  .a-reject{ background:var(--red); color:#fff; }
  .a-renew{ background:#2A5F8F; color:#fff; }
  .a-del{ background:transparent; border:1px solid var(--line); color:var(--muted); }
  .key{ font-family:monospace; color:var(--amber); }
</style>
</head>
<body>
<header>CodePad Admin</header>
<div class="login-wrap" id="loginWrap">
  <div class="card">
    <input type="password" id="pw" placeholder="Admin password">
    <button onclick="login()">Login</button>
    <div class="err" id="loginErr">Wrong password.</div>
  </div>
</div>
<div id="dash">
  <div class="filters">
    <div class="ftab active" onclick="setF('pending')" id="f-pending">Pending</div>
    <div class="ftab" onclick="setF('approved')" id="f-approved">Approved</div>
    <div class="ftab" onclick="setF('rejected')" id="f-rejected">Rejected</div>
    <div class="ftab" onclick="setF('all')" id="f-all">All</div>
  </div>
  <div id="list"></div>
</div>
<script>
  let pw='', all=[], filter='pending';
  async function login(){
    const p = document.getElementById('pw').value;
    const res = await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
    const d = await res.json();
    if(d.success){ pw=p; document.getElementById('loginWrap').style.display='none'; document.getElementById('dash').style.display='block'; load(); }
    else document.getElementById('loginErr').style.display='block';
  }
  function setF(f){ filter=f; ['pending','approved','rejected','all'].forEach(x=>document.getElementById('f-'+x).classList.toggle('active',x===f)); render(); }
  async function load(){
    const res = await fetch('/api/admin/subs',{headers:{'x-admin-password':pw}});
    all = await res.json(); render();
  }
  function statusOf(s){ if(s.status==='approved' && s.expiresAt && s.expiresAt<Date.now()) return 'expired'; return s.status; }
  function render(){
    const filtered = filter==='all' ? all : all.filter(s=>statusOf(s)===filter);
    const el = document.getElementById('list');
    if(!filtered.length){ el.innerHTML='<div style="color:var(--muted);text-align:center;padding:30px;">Nothing here.</div>'; return; }
    el.innerHTML = filtered.map(s=>{
      const st = statusOf(s);
      return \`<div class="item">
        <div class="item-top"><b>\${s.name}</b><span class="badge \${st}">\${st}</span></div>
        <div class="meta">WhatsApp: \${s.phone} · Plan: \${s.plan}<br>Submitted: \${new Date(s.createdAt).toLocaleDateString()}</div>
        <div class="txn">\${s.paymentVerified ? '✓ Razorpay Verified — ' + s.txnId : 'Txn ID: ' + s.txnId}</div>
        \${s.licenseKey ? '<div class="txn key">License: '+s.licenseKey+'</div>' : ''}
        <div class="actions">
          \${st==='pending' ? '<button class="a-approve" onclick="act(\\'approve\\',\\''+s.id+'\\')">Approve</button><button class="a-reject" onclick="act(\\'reject\\',\\''+s.id+'\\')">Reject</button>' : ''}
          \${st==='approved'||st==='expired' ? '<button class="a-renew" onclick="act(\\'renew\\',\\''+s.id+'\\')">Renew</button>' : ''}
          <button class="a-del" onclick="act(\\'delete\\',\\''+s.id+'\\')">Delete</button>
        </div>
      </div>\`;
    }).join('');
  }
  async function act(action,id){
    if(action==='delete' && !confirm('Delete permanently?')) return;
    await fetch('/api/admin/'+action,{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pw},body:JSON.stringify({id})});
    load();
  }
</script>
</body>
</html>`;
