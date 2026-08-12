import { useState, type ReactElement } from "react";
import api from "../api/api";
import { PUBLIC_SITE_URL } from "../config/api";

export default function ReviewSubmission(): ReactElement {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reviewUrl =
    `${getPublicPageUrl()}#write-review`;
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=132x132&margin=8&data=${
      encodeURIComponent(reviewUrl)
    }`;

  const submitReview = async () => {
    if (submitting) return;

    if (!name.trim() || !reviewText.trim()) {
      setMessage("Name and review are required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/api/reviews", {
        name: name.trim(),
        location: location.trim() || "Bengaluru",
        review: reviewText.trim(),
        rating,
      });

      setName("");
      setLocation("");
      setReviewText("");
      setRating(5);
      setMessage("Thank you. Your review is now published here.");
      window.dispatchEvent(new Event("samaksh-review-created"));
    } catch (error: any) {
      const data = error?.response?.data?.data;
      const fieldMessage =
        data && typeof data === "object"
          ? Object.values(data)[0]
          : "";

      setMessage(
        String(
          fieldMessage ||
            error?.response?.data?.message ||
            "Review could not be published. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="review-bottom-section" id="write-review">
      <div className="container">
        <div className="review-write-panel">
          <div className="review-write-copy">
            <span className="review-invite-eyebrow">Review Samaksh Farms</span>
            <h3>Share your freshness story</h3>
            <p>
              A quick rating helps more Bengaluru families choose clean, fresh
              mushrooms.
            </p>
          </div>

          <div className="review-qr-card review-qr-card-small">
            <img src={qrUrl} alt="QR code to review Samaksh Farms" />
            <span>Scan to review</span>
          </div>

          <div className="review-submit-panel">
            <div className="review-rating-picker" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? "is-selected" : ""}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star rating`}
                >
                  {"\u2605"}
                </button>
              ))}
            </div>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location (optional)"
            />
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Write your review"
              rows={2}
            />
            <button
              className="btn"
              type="button"
              onClick={submitReview}
              disabled={submitting}
            >
              {submitting ? "Publishing..." : "Publish Review"}
            </button>
            {message && <span className="review-submit-message">{message}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function getPublicPageUrl() {
  if (PUBLIC_SITE_URL) {
    return PUBLIC_SITE_URL;
  }

  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`;
}
