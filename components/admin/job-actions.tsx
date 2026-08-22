"use client";

import { useActionState } from "react";
import {
  cancelJobAction,
  failJobAction,
  refundJobAction,
  retryJobAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: AdminActionState = {};

function JobButton({
  action,
  jobId,
  label,
}: {
  action: (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  jobId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="jobId" value={jobId} />
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Working…" : label}
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}

export function JobAdminActions({ jobId }: { jobId: string }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <JobButton action={retryJobAction} jobId={jobId} label="Retry Current Stage" />
      <JobButton action={failJobAction} jobId={jobId} label="Mark Technical Failure" />
      <JobButton action={refundJobAction} jobId={jobId} label="Refund Credit" />
      <JobButton action={cancelJobAction} jobId={jobId} label="Cancel" />
    </div>
  );
}
