import type { Metadata } from "next";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { PageIntro } from "@/components/dashboard/page-intro";
import { InviteForm } from "@/components/team/invite-form";
import { RoleForm } from "@/components/team/role-form";
import { canManageMembers } from "@/lib/authz/roles";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { listTeamMembers } from "@/lib/dashboard/summary";
import {
  roleLabel,
  teamDescription,
  TEAM_TITLE,
  VIEWER_CANNOT_INVITE,
} from "@/lib/workspaces/copy";
import { listPendingInvitations } from "@/lib/workspaces/invite";
import { canChangeMemberRole } from "@/lib/workspaces/members";

export const metadata: Metadata = { title: TEAM_TITLE };

export default async function TeamPage() {
  const studio = await requireStudio();
  const members = await listTeamMembers(studio.db, studio.active.workspaceId);
  const pending = await listPendingInvitations(studio.db, studio.active.workspaceId);
  const canInvite = canManageMembers(studio.role);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="TEAM"
        title={TEAM_TITLE}
        description={teamDescription(studio.active.type)}
      />
      <ul className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
        {members.map((member) => {
          const canEditRole = canChangeMemberRole(
            studio.role,
            member.role,
            member.userId === studio.userId,
          );
          return (
            <li
              key={member.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-foreground">{member.name}</p>
                <p className="text-sm text-muted">{member.email}</p>
                <p className="mt-1 text-sm text-muted">
                  {roleLabel(member.role)} · {member.status}
                  {member.joinedAt ? ` · ${formatStudioDate(member.joinedAt)}` : ""}
                </p>
              </div>
              {canEditRole ? <RoleForm memberId={member.id} role={member.role} /> : null}
            </li>
          );
        })}
      </ul>
      {pending.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">Invitations</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-foreground">{invite.email}</p>
                  <p className="text-sm text-muted">{roleLabel(invite.role)}</p>
                </div>
                <p className="text-sm text-muted">
                  {invite.expired ? "Expired" : `Expires ${formatStudioDate(invite.expiresAt)}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Invite a teammate</h2>
        {canInvite ? (
          <InviteForm />
        ) : (
          <div className="mt-6">
            <DisabledAction label="Invite teammate" reason={VIEWER_CANNOT_INVITE} />
          </div>
        )}
      </section>
    </main>
  );
}
