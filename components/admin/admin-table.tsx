import type { ReactNode } from "react";

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{empty ? null : children}</tbody>
      </table>
      {empty ? <p className="px-4 py-6 text-muted">No records yet.</p> : null}
    </div>
  );
}
