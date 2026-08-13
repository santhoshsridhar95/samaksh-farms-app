import { useEffect, useMemo, useState, type ReactElement } from "react";
import api from "../api/api";

interface Review {
  id?: number;
  name: string;
  location: string;
  review: string;
  rating: number;
}

const fallbackReviews: Review[] = [
  {
    name: "Ravi Kumar",
    location: "Hebbal, Bengaluru",
    rating: 5,
    review: "Fresh mushrooms, excellent quality and neatly packed.",
  },
  {
    name: "Sneha Reddy",
    location: "RT Nagar, Bengaluru",
    rating: 5,
    review: "Very fresh oyster mushrooms. Excellent quality.",
  },
  {
    name: "Arjun N",
    location: "HBR Layout, Bengaluru",
    rating: 4,
    review: "Consistent quality every time.",
  },
  {
    name: "Manjunath S",
    location: "Devanahalli, Bengaluru",
    rating: 5,
    review: "Everyone appreciated the freshness and taste.",
  },
  {
    name: "Priya Sharma",
    location: "Yelahanka, Bengaluru",
    rating: 5,
    review: "Fresh and well packed mushrooms.",
  },
];

export default function Reviews(): ReactElement {
  const getVisibleCards = (): number => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  };

  const [visibleCards, setVisibleCards] = useState<number>(getVisibleCards());
  const [startIndex, setStartIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [customerReviews, setCustomerReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    try {
      const response = await api.get("/api/reviews");
      const apiReviews = response?.data?.data;

      if (Array.isArray(apiReviews)) {
        setCustomerReviews(apiReviews);
      }
    } catch {
      setCustomerReviews([]);
    }
  };

  useEffect(() => {
    loadReviews();

    window.addEventListener("samaksh-review-created", loadReviews);

    return () =>
      window.removeEventListener("samaksh-review-created", loadReviews);
  }, []);

  useEffect(() => {
    const handleResize = (): void => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const allReviews = useMemo(
    () => mergeReviews(customerReviews, fallbackReviews),
    [customerReviews],
  );

  useEffect(() => {
    if (paused || allReviews.length === 0) return;

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % allReviews.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [paused, allReviews.length]);

  const next = (): void => {
    setStartIndex((prev) => (prev + 1) % allReviews.length);
  };

  const prev = (): void => {
    setStartIndex(
      (prev) => (prev - 1 + allReviews.length) % allReviews.length,
    );
  };

  const visibleReviews: Review[] = [];
  const cardsToShow = Math.min(visibleCards, allReviews.length);

  for (let i = 0; i < cardsToShow; i++) {
    visibleReviews.push(allReviews[(startIndex + i) % allReviews.length]);
  }

  return (
    <section className="section container" id="reviews">
      <div className="reviews-header">
        <div>
          <h2>Trusted by Families Across Bengaluru</h2>
          <p>Genuine feedback from our customers.</p>
        </div>

        <a className="review-us-link" href="#write-review">
          Review us
        </a>
      </div>

      <div
        className="reviews-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button className="review-arrow" type="button" onClick={prev}>
          {"<"}
        </button>

        <div className="reviews-grid-slider">
          {visibleReviews.map((review, index) => (
            <div
              key={review.id ? `api-${review.id}` : `${review.name}-${review.review}-${index}`}
              className="review-card"
            >
              <div className="stars" aria-label={`${review.rating} star review`}>
                {starsForRating(review.rating)}
              </div>

              <p className="review-text">"{review.review}"</p>

              <div className="review-footer">
                <strong>{review.name}</strong>
                <span>{review.location}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="review-arrow" type="button" onClick={next}>
          {">"}
        </button>
      </div>
    </section>
  );
}

function starsForRating(value: number) {
  const safeRating = Math.min(5, Math.max(1, Math.round(value)));
  return "\u2605".repeat(safeRating) + "\u2606".repeat(5 - safeRating);
}

function mergeReviews(primaryReviews: Review[], fallbackReviews: Review[]) {
  const seen = new Set<string>();

  return [...primaryReviews, ...fallbackReviews].filter((review) => {
    const key = reviewIdentity(review);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function reviewIdentity(review: Review) {
  return [review.name, review.location, review.review]
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
    .join("|");
}
