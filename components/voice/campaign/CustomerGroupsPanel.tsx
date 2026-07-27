"use client";

import { useEffect, useState } from "react";
import {
  fetchCustomerGroups,
  createCustomerGroup,
  deleteCustomerGroup,
  fetchGroupMembers,
  addGroupMembers,
  removeGroupMember,
  type CustomerGroup,
} from "@/lib/customerGroupsApi";
import { Skeleton } from "@/components/ui/Skeleton";

interface RosterCustomer {
  id: string;
  phone: string;
  name: string;
}

interface Props {
  restaurantId: string;
  optedInCustomers: RosterCustomer[];
  onClose: () => void;
  /** Called whenever group membership changes, so the roster step can refresh its chips/counts. */
  onGroupsChanged?: () => void;
}

/**
 * Create and manage static customer groups — reusable one-click filters for
 * the campaign wizard's roster step. Same slide-in scaffold as
 * OrderDetailDrawer / ScheduleReminderPanel.
 */
export function CustomerGroupsPanel({ restaurantId, optedInCustomers, onClose, onGroupsChanged }: Props) {
  const [groups, setGroups] = useState<CustomerGroup[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const loadGroups = () => {
    fetchCustomerGroups(restaurantId)
      .then((r) => setGroups(r.groups))
      .catch(() => setError("Couldn't load groups."));
  };

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCustomerGroup(restaurantId, newName.trim());
      setNewName("");
      loadGroups();
      onGroupsChanged?.();
    } catch {
      setError("Couldn't create the group. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    try {
      await deleteCustomerGroup(restaurantId, groupId);
      if (expandedId === groupId) setExpandedId(null);
      loadGroups();
      onGroupsChanged?.();
    } catch {
      /* transient — user can retry */
    }
  };

  const toggleExpand = (groupId: string) => {
    if (expandedId === groupId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(groupId);
    setMembersLoading(true);
    setMemberSearch("");
    fetchGroupMembers(restaurantId, groupId)
      .then((r) => setMemberIds(new Set(r.members.map((m) => m.customer_id))))
      .catch(() => setMemberIds(new Set()))
      .finally(() => setMembersLoading(false));
  };

  const toggleMember = async (groupId: string, customerId: string, isMember: boolean) => {
    // Optimistic toggle — the roster list here is small enough that a failed
    // request is rare, and loadGroups() below re-syncs the count either way.
    setMemberIds((prev) => {
      const next = new Set(prev);
      isMember ? next.delete(customerId) : next.add(customerId);
      return next;
    });
    try {
      if (isMember) {
        await removeGroupMember(restaurantId, groupId, customerId);
      } else {
        await addGroupMembers(restaurantId, groupId, [customerId]);
      }
      loadGroups();
      onGroupsChanged?.();
    } catch {
      // revert on failure
      setMemberIds((prev) => {
        const next = new Set(prev);
        isMember ? next.add(customerId) : next.delete(customerId);
        return next;
      });
    }
  };

  const filteredRoster = memberSearch.trim()
    ? optedInCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          c.phone.includes(memberSearch),
      )
    : optedInCustomers;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-[slidein_0.18s_ease-out]">
        <style>{`@keyframes slidein{from{transform:translateX(16px);opacity:.6}to{transform:none;opacity:1}}`}</style>

        <div className="flex items-center justify-between px-5 py-4 border-b border-capy-border">
          <h2 className="text-base font-bold text-capy-text">Customer groups</h2>
          <button onClick={onClose} className="text-capy-muted hover:text-capy-text" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <p className="section-label mb-1">New group</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. VIP customers"
                className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-xl bg-capy-green text-white text-sm font-semibold hover:bg-capy-green-dark disabled:opacity-50 transition-colors shrink-0"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <div className="space-y-2">
            {groups === null ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : groups.length === 0 ? (
              <p className="text-xs text-capy-muted text-center py-6">
                No groups yet — create one above to start building a reusable list.
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="border border-capy-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(g.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-capy-text truncate">{g.name}</p>
                      <p className="text-[11px] text-capy-muted">
                        {g.member_count} member{g.member_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g.id);
                        }}
                        role="button"
                        title="Delete group"
                        className="p-1.5 rounded-lg text-capy-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </span>
                      <svg
                        className={`w-4 h-4 text-capy-muted transition-transform ${expandedId === g.id ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expandedId === g.id && (
                    <div className="border-t border-capy-border">
                      <div className="p-2 border-b border-capy-border">
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search opted-in customers…"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-capy-border rounded-lg text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {membersLoading ? (
                          <div className="p-3 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ) : filteredRoster.length === 0 ? (
                          <p className="text-xs text-capy-muted text-center py-4">No opted-in customers.</p>
                        ) : (
                          filteredRoster.map((c) => {
                            const isMember = memberIds.has(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => toggleMember(g.id, c.id, isMember)}
                                className="flex items-center gap-3 px-3 py-2 border-b border-capy-border/60 last:border-0 cursor-pointer hover:bg-slate-50"
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isMember ? "bg-capy-green border-capy-green" : "border-capy-border bg-white"
                                  }`}
                                >
                                  {isMember && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-capy-text truncate">{c.name}</p>
                                  <p className="text-[11px] text-capy-muted font-mono">{c.phone}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
