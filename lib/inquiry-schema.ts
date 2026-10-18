import { z } from "zod";

export const INQUIRY_TYPES = ["New kitchen project", "Product inquiry", "Existing project", "Partnership", "Other"] as const;

const digits = (v: string) => v.replace(/\D/g, "");

export const inquirySchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number so we can call you back")
    .refine((v) => {
      const d = digits(v);
      return (d.length === 10 && d.startsWith("0")) || (d.length === 11 && d.startsWith("94")) || (d.length >= 9 && d.length <= 15 && v.trim().startsWith("+"));
    }, "Enter a 10-digit number, e.g. 077 123 4567"),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Check the email address — it looks incomplete"),
  inquiry_type: z.enum(INQUIRY_TYPES, { errorMap: () => ({ message: "Choose the type of inquiry" }) }),
  message: z.string().trim().min(10, "Add a few words about what you need (at least 10 characters)").max(4000, "Message is too long"),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryField = keyof InquiryInput;

export type InquiryState =
  | { status: "idle" }
  | { status: "invalid"; errors: Partial<Record<InquiryField, string>> }
  | { status: "success"; ref: string; firstName: string; phone: string }
  | { status: "failed" }
  | { status: "limited" };

export function fieldErrors(result: z.SafeParseReturnType<unknown, unknown>) {
  const errors: Partial<Record<InquiryField, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const k = issue.path[0] as InquiryField;
      if (k && !errors[k]) errors[k] = issue.message;
    }
  }
  return errors;
}
