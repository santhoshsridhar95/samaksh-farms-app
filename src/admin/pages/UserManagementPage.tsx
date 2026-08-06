import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, UserPlus, XCircle } from "lucide-react";

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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const response = await api.get("/api/users");
    setUsers(response?.data?.data || []);
  };

  const createUser = async () => {
    await api.post("/api/users", form);
    setForm(emptyForm);
    loadUsers();
  };

  const approveUser = async (user: any) => {
    await api.put(`/api/users/${user.id}/approve`, {
      role: user.role || "SALES_EMPLOYEE",
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
              value={form.phoneNumber}
              onChange={(event) =>
                setForm({ ...form, phoneNumber: event.target.value })
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
                        value={user.role}
                        onChange={(event) => changeRole(user.id, event.target.value)}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
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
                          className="admin-icon-button"
                          type="button"
                          title="Approve user"
                          onClick={() => approveUser(user)}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          className="admin-icon-button"
                          type="button"
                          title="Reject user"
                          onClick={() => rejectUser(user.id)}
                        >
                          <XCircle size={16} />
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
