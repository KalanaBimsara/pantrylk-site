"use client";

import { useEffect, useState } from "react";
import { FormMessage, SubmitButton, useAdminForm } from "@/components/admin/ui";
import { INQUIRY_STATUSES } from "@/lib/admin/form";
import { addInquiryNote, setInquiryStatus } from "./actions";

export function StatusForm({ id, status }: { id: string; status: string }) {
  const { state, pending, onSubmit } = useAdminForm(setInquiryStatus);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="status" className="field-label mb-0">
        Status
      </label>
      <div className="flex flex-wrap gap-2">
        <select id="status" name="status" defaultValue={status} className="field min-h-11 w-auto flex-1">
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <SubmitButton pending={pending} pendingLabel="Saving…" className="btn btn-navy min-h-11">
          Update
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function NoteForm({ inquiryId }: { inquiryId: string }) {
  const { state, pending, onSubmit, fields } = useAdminForm(addInquiryNote);
  const [body, setBody] = useState("");
  useEffect(() => {
    if (state.status === "ok") setBody("");
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="inquiry_id" value={inquiryId} />
      <label htmlFor="note" className="field-label mb-0">
        Add a note
      </label>
      <textarea
        id="note"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        placeholder="e.g. Called on Monday, site visit booked for the 14th."
        className="field min-h-28"
        aria-invalid={!!fields.body || undefined}
      />
      <div>
        <SubmitButton pending={pending} pendingLabel="Adding…">
          Add note
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
