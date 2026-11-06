"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";

type ContactValues = { name: string; email: string; subject: string; message: string; website: string };
type ContactErrors = Partial<Record<keyof ContactValues, string>>;

const emptyValues: ContactValues = { name: "", email: "", subject: "", message: "", website: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!values.email.trim()) errors.email = "Please enter your email address.";
  else if (!emailPattern.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!values.subject.trim()) errors.subject = "Please add a subject.";
  if (!values.message.trim()) errors.message = "Please write a message.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const submittingRef = useRef(false);

  function update(field: keyof ContactValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") {
      setStatus("idle");
      setStatusMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("error");
      setStatusMessage("Please check the fields marked below.");
      return;
    }

    submittingRef.current = true;
    setStatus("sending");
    setStatusMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { message?: string; errors?: ContactErrors };
      if (!response.ok) {
        if (result.errors) setErrors(result.errors);
        throw new Error(result.message || "Your message could not be sent. Please try again.");
      }
      setStatus("success");
      setStatusMessage("Thanks for reaching out. Your message has been delivered.");
      setValues(emptyValues);
      setErrors({});
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
    }
  }

  const fieldError = (field: keyof ContactValues) => errors[field];

  return (
    <form className="contact-form" id="contact-form" data-reveal onSubmit={handleSubmit} noValidate aria-labelledby="contact-form-title">
      <div className="contact-form-heading">
        <div><span className="mono-label">A NOTE, A QUESTION, AN IDEA</span><h3 id="contact-form-title">Tell me what&apos;s on your mind.</h3></div>
        <span className="contact-form-index">08 / 08</span>
      </div>

      <div className="contact-form-fields">
        <div className="contact-field">
          <label htmlFor="contact-name">Full name <span aria-hidden="true">*</span></label>
          <input id="contact-name" name="name" autoComplete="name" value={values.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "contact-name-error" : undefined} />
          {fieldError("name") && <span className="contact-field-error" id="contact-name-error">{fieldError("name")}</span>}
        </div>
        <div className="contact-field">
          <label htmlFor="contact-email">Email address <span aria-hidden="true">*</span></label>
          <input id="contact-email" name="email" type="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} required maxLength={254} aria-invalid={Boolean(fieldError("email"))} aria-describedby={fieldError("email") ? "contact-email-error" : undefined} />
          {fieldError("email") && <span className="contact-field-error" id="contact-email-error">{fieldError("email")}</span>}
        </div>
        <div className="contact-field contact-field-wide">
          <label htmlFor="contact-subject">Subject <span aria-hidden="true">*</span></label>
          <input id="contact-subject" name="subject" value={values.subject} onChange={(event) => update("subject", event.target.value)} required maxLength={160} aria-invalid={Boolean(fieldError("subject"))} aria-describedby={fieldError("subject") ? "contact-subject-error" : undefined} />
          {fieldError("subject") && <span className="contact-field-error" id="contact-subject-error">{fieldError("subject")}</span>}
        </div>
        <div className="contact-field contact-field-wide">
          <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
          <textarea id="contact-message" name="message" rows={5} value={values.message} onChange={(event) => update("message", event.target.value)} required maxLength={4000} aria-invalid={Boolean(fieldError("message"))} aria-describedby={fieldError("message") ? "contact-message-error" : undefined} />
          {fieldError("message") && <span className="contact-field-error" id="contact-message-error">{fieldError("message")}</span>}
        </div>
      </div>

      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update("website", event.target.value)} />
      </div>

      <div className="contact-form-submit">
        <button className="button button-primary" type="submit" disabled={status === "sending"}>
          {status === "sending" ? <>Sending <LoaderCircle size={16} className="contact-spinner" /></> : <>Send message <ArrowUpRight size={16} /></>}
        </button>
        <span>All fields are required.</span>
      </div>
      <p className={`contact-form-status is-${status}`} role="status" aria-live="polite">{statusMessage}</p>
    </form>
  );
}
