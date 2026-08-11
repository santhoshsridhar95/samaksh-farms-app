import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Save,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusPill,
} from "../components/AdminUI";
import api from "../services/api";

const roles = [
  "SUPER_ADMIN",
  "SALES_ADMIN",
  "SALES_EMPLOYEE",
  "FARM_MANAGER",
  "LABOUR",
  "SALES_USER",
];

const emptyForm = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "SALES_EMPLOYEE",
};

type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  run: () => Promise<void>;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>(
    {},
  );
  const [pendingRoles, setPendingRoles] = useState<Record<string, string[]>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [openRolePickerUserId, setOpenRolePickerUserId] = useState<string | null>(
    null,
  );
  const rolePickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        rolePickerRef.current &&
        !rolePickerRef.current.contains(event.target as Node)
      ) {
        setOpenRolePickerUserId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRolePickerUserId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const loadUsers = async () => {
    const response = await api.get("/api/users");
    setUsers(response?.data?.data || []);
    setPendingRoles({});
    setOpenRolePickerUserId(null);
  };

  const createUser = async () => {
    if (!/^[0-9]{10}$/.test(form.phoneNumber.trim())) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    await api.post("/api/users", form);
    setForm(emptyForm);
    loadUsers();
  };

  const askToConfirm = (action: ConfirmAction) => {
    setOpenRolePickerUserId(null);
    setConfirmAction(action);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    await confirmAction.run();
    setConfirmAction(null);
    loadUsers();
  };

  const approveUser = (user: any) => {
    const nextRoles = rolesForUser(user);

    askToConfirm({
      title: "Approve this user?",
      body: `${user.name} will be approved with ${formatRoleList(nextRoles)} access.`,
      confirmLabel: "Approve User",
      run: async () => {
        await api.put(`/api/users/${user.id}/approve`, {
          role: nextRoles[0] || "SALES_EMPLOYEE",
          roles: nextRoles,
          active: true,
        });
      },
    });
  };

  const rejectUser = (user: any) => {
    askToConfirm({
      title: "Reject this user?",
      body: `${user.name}'s signup/access request will be rejected and login will stay disabled.`,
      confirmLabel: "Reject User",
      danger: true,
      run: async () => {
        await api.put(`/api/users/${user.id}/reject`);
      },
    });
  };

  const saveRoles = (user: any) => {
    const nextRoles = rolesForUser(user);

    askToConfirm({
      title: "Save access changes?",
      body: `${user.name}'s access will change from ${formatRoleList(
        allUserRoles(user),
      )} to ${formatRoleList(nextRoles)}.`,
      confirmLabel: "Save Access",
      run: async () => {
        await api.put(`/api/users/${user.id}/role`, {
          role: nextRoles[0] || "SALES_EMPLOYEE",
          roles: nextRoles,
        });
      },
    });
  };

  const resetPassword = (user: any) => {
    const password = resetPasswords[String(user.id)];

    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    askToConfirm({
      title: "Reset this password?",
      body: `${user.name}'s password will be changed. The user can log in with the new password after this is saved.`,
      confirmLabel: "Reset Password",
      run: async () => {
        await api.put(`/api/users/${user.id}/reset-password`, { password });
        setResetPasswords((current) => ({
          ...current,
          [String(user.id)]: "",
        }));
      },
    });
  };

  const deleteUser = (user: any) => {
    askToConfirm({
      title: "Delete this user?",
      body: `${user.name} will be soft deleted. Login will be disabled and the record will be hidden, but audit history remains.`,
      confirmLabel: "Delete User",
      danger: true,
      run: async () => {
        await api.delete(`/api/users/${user.id}`);
      },
    });
  };

  const togglePendingRole = (user: any, role: string) => {
    const userId = String(user.id);
    const current = rolesForUser(user);
    const next = current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role];

    setPendingRoles((existing) => ({
      ...existing,
      [userId]: next.length > 0 ? next : [role],
    }));
  };

  const clearPendingRoles = (user: any) => {
    setOpenRolePickerUserId(null);
    setPendingRoles((current) => {
      const next = { ...current };
      delete next[String(user.id)];
      return next;
    });
  };

  const rolesForUser = (user: any) =>
    pendingRoles[String(user.id)] || allUserRoles(user);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Super Admin"
        title="Users & Approvals"
        subtitle="Create users, approve signups, assign multiple access roles, and handle password reset requests."
      />

      <Panel
        title="Create User"
        subtitle="Super admin can create approved users directly."
      >
        <div className="admin-form-grid">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              inputMode="numeric"
              maxLength={10}
              value={form.phoneNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
            />
          </Field>
          <Field label="Primary Access">
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temporary Password">
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </Field>
          <button className="admin-button" type="button" onClick={createUser}>
            <UserPlus size={17} />
            Create User
          </button>
        </div>
      </Panel>

      <Panel
        title="User Directory"
        subtitle="Every row change asks for confirmation before it is saved."
      >
        {users.length === 0 && (
          <EmptyState title="No users found" message="Users will appear here." />
        )}

        {users.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Access Roles</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Reset Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const userId = String(user.id);
                  const selectedRoles = rolesForUser(user);
                  const hasRoleChange =
                    JSON.stringify(selectedRoles) !==
                    JSON.stringify(allUserRoles(user));

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </td>
                      <td>{user.phoneNumber || "-"}</td>
                      <td>
                        <div
                          className="admin-role-picker"
                          ref={
                            openRolePickerUserId === userId
                              ? rolePickerRef
                              : null
                          }
                        >
                          <button
                            className={`admin-role-picker-summary ${
                              openRolePickerUserId === userId ? "is-open" : ""
                            }`}
                            type="button"
                            aria-expanded={openRolePickerUserId === userId}
                            onClick={() =>
                              setOpenRolePickerUserId((current) =>
                                current === userId ? null : userId,
                              )
                            }
                          >
                            {formatRoleList(selectedRoles)}
                          </button>

                          {openRolePickerUserId === userId && (
                            <div className="admin-role-picker-menu">
                            {roles.map((role) => (
                              <label key={role}>
                                <input
                                  type="checkbox"
                                  checked={selectedRoles.includes(role)}
                                  onChange={() => togglePendingRole(user, role)}
                                />
                                <span>{formatRole(role)}</span>
                              </label>
                            ))}
                              <div className="admin-role-picker-footer">
                                <button
                                  className="admin-button admin-button-secondary"
                                  type="button"
                                  onClick={() => setOpenRolePickerUserId(null)}
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {hasRoleChange && (
                          <div className="admin-inline-save">
                            <span>Access changed</span>
                            <button
                              className="admin-button admin-button-secondary"
                              type="button"
                              onClick={() => clearPendingRoles(user)}
                            >
                              Cancel
                            </button>
                            <button
                              className="admin-button"
                              type="button"
                              onClick={() => saveRoles(user)}
                            >
                              <Save size={14} />
                              Save
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusPill status={user.active ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td>
                        <StatusPill status={user.approvalStatus || "APPROVED"} />
                      </td>
                      <td>
                        <div className="user-reset-control">
                          <input
                            type="password"
                            placeholder="New password"
                            value={resetPasswords[String(user.id)] || ""}
                            onChange={(event) =>
                              setResetPasswords((current) => ({
                                ...current,
                                [String(user.id)]: event.target.value,
                              }))
                            }
                          />
                          <button
                            className="admin-icon-button"
                            type="button"
                            title="Reset password"
                            onClick={() => resetPassword(user)}
                          >
                            <KeyRound size={16} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-action-button admin-action-approve"
                            type="button"
                            title="Approve user"
                            onClick={() => approveUser(user)}
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                          <button
                            className="admin-action-button admin-action-reject"
                            type="button"
                            title="Reject user"
                            onClick={() => rejectUser(user)}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          <button
                            className="admin-icon-button admin-icon-danger"
                            type="button"
                            title="Delete user"
                            onClick={() => deleteUser(user)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {confirmAction && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2>{confirmAction.title}</h2>
              <p>{confirmAction.body}</p>
            </div>
            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => setConfirmAction(null)}
              >
                No
              </button>
              <button
                className={`admin-button ${
                  confirmAction.danger ? "admin-button-danger" : ""
                }`}
                type="button"
                onClick={executeConfirmAction}
              >
                Yes, {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function allUserRoles(user: any) {
  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : [user.role || "SALES_EMPLOYEE"];

  return Array.from(new Set(userRoles.map(String)));
}

function formatRoleList(userRoles: string[]) {
  return userRoles.map(formatRole).join(", ");
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
