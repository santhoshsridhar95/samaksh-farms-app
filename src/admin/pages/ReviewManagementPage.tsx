import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, Pencil, Search, Trash2 } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";

type Review = {
  id: number;
  name: string;
  location: string;
  review: string;
  rating: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ReviewForm = {
  id?: number;
  name: string;
  location: string;
  review: string;
  rating: number;
  published: boolean;
};

const emptyForm: ReviewForm = {
  name: "",
  location: "",
  review: "",
  rating: 5,
  published: true,
};

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const response = await api.get("/api/reviews/admin");
    setReviews(response?.data?.data || []);
  };

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return reviews;

    return reviews.filter((review) =>
      [
        review.name,
        review.location,
        review.review,
        review.rating,
        review.published ? "published" : "hidden",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [reviews, search]);

  const publishedCount = reviews.filter((review) => review.published).length;
  const averageRating =
    reviews.length === 0
      ? "0.0"
      : (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        ).toFixed(1);

  const saveReview = async () => {
    if (saving) return;

    if (!form.name.trim() || !form.review.trim()) {
      setError("Name and review are required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.put(`/api/reviews/${form.id}`, {
        name: form.name.trim(),
        location: form.location.trim() || "Bengaluru",
        review: form.review.trim(),
        rating: form.rating,
        published: form.published,
      });
      setForm(emptyForm);
      setMessage("Review updated successfully.");
      await loadReviews();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Review could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const editReview = (review: Review) => {
    setForm({
      id: review.id,
      name: review.name,
      location: review.location || "",
      review: review.review,
      rating: review.rating,
      published: review.published,
    });
    setMessage("");
    setError("");
  };

  const deleteReview = async (review: Review) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete review from ${review.name}? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(review.id);
    setMessage("");
    setError("");

    try {
      await api.delete(`/api/reviews/${review.id}`);
      setMessage("Review deleted successfully.");
      await loadReviews();
      if (form.id === review.id) {
        setForm(emptyForm);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Review could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Reviews"
        title="Customer Reviews"
        subtitle="Edit, hide, or delete reviews shown on the public website."
      />

      {(message || error) && (
        <div
          className={`admin-feedback-banner ${
            error ? "admin-feedback-error" : ""
          }`}
        >
          <span>{error || message}</span>
          <button type="button" onClick={() => (error ? setError("") : setMessage(""))}>
            Close
          </button>
        </div>
      )}

      <div className="admin-stat-grid">
        <StatCard
          label="Total reviews"
          value={reviews.length}
          icon={<MessageSquareText size={18} />}
          tone="green"
        />
        <StatCard
          label="Published"
          value={publishedCount}
          helper="Visible on the public website."
          tone="blue"
        />
        <StatCard
          label="Average rating"
          value={`${averageRating} / 5`}
          helper="Across all saved reviews."
          tone="amber"
        />
      </div>

      {form.id && (
        <Panel
          title="Edit review"
          subtitle="Changes are reflected on the public website immediately."
          actions={
            <button
              className="admin-button admin-button-secondary"
              type="button"
              onClick={() => setForm(emptyForm)}
            >
              Cancel
            </button>
          }
        >
          <div className="admin-form-grid">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Location" optional>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Rating" required>
              <select
                value={form.rating}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rating: Number(event.target.value),
                  }))
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visibility" required>
              <select
                value={form.published ? "true" : "false"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    published: event.target.value === "true",
                  }))
                }
              >
                <option value="true">Published</option>
                <option value="false">Hidden</option>
              </select>
            </Field>
            <Field label="Review" span="full" required>
              <textarea
                value={form.review}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    review: event.target.value,
                  }))
                }
                rows={3}
              />
            </Field>
            <div className="admin-field admin-field-full">
              <button
                className="admin-button"
                type="button"
                onClick={saveReview}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="Saved reviews" subtitle={`${filteredReviews.length} review${filteredReviews.length === 1 ? "" : "s"} found.`}>
        <div className="admin-form-grid dashboard-filter-grid">
          <Field label="Search">
            <div className="admin-search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviews"
              />
            </div>
          </Field>
        </div>

        {filteredReviews.length === 0 && (
          <EmptyState
            title="No reviews found"
            message="Customer reviews submitted from the website will appear here."
          />
        )}

        {filteredReviews.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <strong>{review.name}</strong>
                      <span>{review.location || "Bengaluru"}</span>
                    </td>
                    <td>{starsForRating(review.rating)}</td>
                    <td>{review.review}</td>
                    <td>
                      <StatusPill
                        status={review.published ? "Published" : "Hidden"}
                        tone={review.published ? "success" : "neutral"}
                      />
                    </td>
                    <td>{formatDate(review.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          onClick={() => editReview(review)}
                          title="Edit review"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="admin-icon-button admin-icon-danger"
                          type="button"
                          onClick={() => deleteReview(review)}
                          disabled={deletingId === review.id}
                          title="Delete review"
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
    </AdminLayout>
  );
}

function starsForRating(value: number) {
  const safeRating = Math.min(5, Math.max(1, Math.round(value)));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return parseBusinessDate(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function parseBusinessDate(value: string) {
  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value}+05:30`;

  return new Date(normalized);
}
