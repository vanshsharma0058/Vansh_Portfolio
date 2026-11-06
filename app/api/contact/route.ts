import { createHash } from "node:crypto";
import emailjs from "@emailjs/nodejs";

type ContactSubmission = { name?: unknown; email?: unknown; subject?: unknown; message?: unknown; website?: unknown };
type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxBodyBytes = 12_000;
const rateWindowMs = 15 * 60 * 1000;
const maxSubmissionsPerWindow = 5;
const submissionsByIp = new Map<string, { count: number; expiresAt: number }>();

function jsonError(message: string, status: number, errors?: FieldErrors) {
  return Response.json({ message, ...(errors ? { errors } : {}) }, { status });
}

function isRateLimited(request: Request) {
  const now = Date.now();
  for (const [key, record] of submissionsByIp) {
    if (record.expiresAt <= now) submissionsByIp.delete(key);
  }

  const rawIp = request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const key = createHash("sha256").update(rawIp).digest("hex");
  const record = submissionsByIp.get(key);

  if (!record || record.expiresAt <= now) {
    submissionsByIp.set(key, { count: 1, expiresAt: now + rateWindowMs });
    return false;
  }
  if (record.count >= maxSubmissionsPerWindow) return true;

  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBodyBytes) return jsonError("The message is too large.", 413);

  let body: ContactSubmission;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) return jsonError("The message is too large.", 413);
    body = JSON.parse(rawBody) as ContactSubmission;
  } catch {
    return jsonError("Please submit a valid contact form.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Please submit a valid contact form.", 400);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.replace(/[\r\n]+/g, " ").trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const errors: FieldErrors = {};

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 120) errors.name = "Name must be 120 characters or fewer.";
  if (!email) errors.email = "Please enter your email address.";
  else if (email.length > 254 || !emailPattern.test(email)) errors.email = "Enter a valid email address.";
  if (!subject) errors.subject = "Please add a subject.";
  else if (subject.length > 160) errors.subject = "Subject must be 160 characters or fewer.";
  if (!message) errors.message = "Please write a message.";
  else if (message.length > 4000) errors.message = "Message must be 4,000 characters or fewer.";
  if (Object.keys(errors).length) return jsonError("Please correct the highlighted fields.", 400, errors);
  if (typeof body.website === "string" && body.website.trim()) return jsonError("This submission could not be accepted.", 400);
  if (isRateLimited(request)) return jsonError("Too many messages were submitted. Please wait a little and try again.", 429);

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey) {
    return jsonError("The contact service is not configured yet. Please email me directly using the address below.", 503);
  }

  try {
    const result = await emailjs.send(
      serviceId,
      templateId,
      { name, email, subject, message },
      {
        publicKey,
        ...(privateKey ? { privateKey } : {}),
        limitRate: { id: "portfolio-contact", throttle: 1000 },
      },
    );

    if (result.status !== 200) {
      return jsonError("EmailJS did not accept the message. Please try again shortly.", 502);
    }
    return Response.json({ message: "Your message has been sent." }, { status: 200 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      console.warn("EmailJS rejected a contact submission with status", error.status);
    } else {
      console.warn("EmailJS contact submission failed before a provider response.");
    }
    return jsonError("Your message could not be sent right now. Please try again shortly.", 502);
  }
}
