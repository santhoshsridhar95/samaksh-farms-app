import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatusPill } from "../components/AdminUI";
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

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const response = await api.get("/api/users");
    setUsers(response?.data?.data || []);
    setPendingRoles({});
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

  const approveUser = async (user: any) => {
    await api.put(`/api/users/${user.id}/approve`, {
      role: pendingRoles[String(user.id)] || user.role || "SALES_EMPLOYEE",
      active: true,
    });
    loadUsers();
  };

  const rejectUser = async (userId: number) => {
    await api.put(`/api/users/${userId}/reject`);
    loadUsers();
  };

  const changeRole = async (userId: number, role: string) => {
    await api.put(`/api/users/${userId}/role`, { role });
    loadUsers();
  };

  const resetPassword = async (userId: number) => {
    const password = resetPasswords[String(userId)];

    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    await api.put(`/api/users/${userId}/reset-password`, { password });
    setResetPasswords((current) => ({ ...current, [String(userId)]: "" }));
    loadUsers();
  };

  const deleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    await api.delete(`/api/users/${userToDelete.id}`);
    setUserToDelete(null);
    loadUsers();
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Super Admin"
        title="Users & Approvals"
        subtitle="Create users, approve signups, assign roles, and handle password reset requests."
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
          <Field label="Role">
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

      <Panel title="User Directory" subtitle="Pending signups and reset requests stay visible here.">
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Reset Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>{user.phoneNumber || "-"}</td>
                    <td>
                      <select
                        value={pendingRoles[String(user.id)] ?? user.role}
                        onChange={(event) =>
                          setPendingRoles((current) => ({
                            ...current,
                            [String(user.id)]: event.target.value,
                          }))
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
                      {pendingRoles[String(user.id)] &&
                        pendingRoles[String(user.id)] !== user.role && (
                          <div className="admin-inline-save">
                            <span>
                              Pending:{" "}
                              {formatRole(pendingRoles[String(user.id)])}
                            </span>
                            <button
                              className="admin-button admin-button-secondary"
                              type="button"
                              onClick={() =>
                                setPendingRoles((current) => {
                                  const next = { ...current };
                                  delete next[String(user.id)];
                                  return next;
                                })
                              }
                            >
                              Cancel
                            </button>
                            <button
                              className="admin-button"
                              type="button"
                              onClick={() =>
                                changeRole(
                                  user.id,
                                  pendingRoles[String(user.id)],
                                )
                              }
                            >
                              Save Role
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
                          onClick={() => resetPassword(user.id)}
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
                          onClick={() => rejectUser(user.id)}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                        <button
                          className="admin-icon-button admin-icon-danger"
                          type="button"
                          title="Delete user"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {userToDelete && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2>Delete this user?</h2>
              <p>
                This will soft delete <strong>{userToDelete.name}</strong>. The
                login will be disabled and the record will be hidden from this
                list, but audit history will remain.
              </p>
            </div>
            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-danger"
                type="button"
                onClick={deleteUser}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
