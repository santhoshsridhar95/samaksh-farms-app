import { useEffect, useState, type ReactElement } from "react";

interface Review {
  name: string;
  location: string;
  review: string;
}

const reviews: Review[] = [
  {
    name: "Ravi Kumar",
    location: "Hebbal, Bengaluru",
    review:
      "Fresh mushrooms, excellent quality and neatly packed.",
  },
  {
    name: "Sneha Reddy",
    location: "RT Nagar, Bengaluru",
    review:
      "Very fresh oyster mushrooms. Excellent quality.",
  },
  {
    name: "Arjun N",
    location: "HBR Layout, Bengaluru",
    review:
      "Consistent quality every time.",
  },
  {
    name: "Manjunath S",
    location: "Devanahalli, Bengaluru",
    review:
      "Everyone appreciated the freshness and taste.",
  },
  {
    name: "Priya Sharma",
    location: "Yelahanka, Bengaluru",
    review:
      "Fresh and well packed mushrooms.",
  },
];

export default function Reviews(): ReactElement {
  const getVisibleCards = (): number => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  };

  const [visibleCards, setVisibleCards] =
    useState<number>(getVisibleCards());

  const [startIndex, setStartIndex] =
    useState<number>(0);

  const [paused, setPaused] =
    useState<boolean>(false);

  useEffect(() => {
    const handleResize = (): void => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setStartIndex(
        (prev) =>
          (prev + 1) % reviews.length
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [paused]);

  const next = (): void => {
    setStartIndex(
      (prev) =>
        (prev + 1) % reviews.length
    );
  };

  const prev = (): void => {
    setStartIndex(
      (prev) =>
        (prev - 1 + reviews.length) %
        reviews.length
    );
  };

  const visibleReviews: Review[] = [];

  for (
    let i = 0;
    i < visibleCards;
    i++
  ) {
    visibleReviews.push(
      reviews[
        (startIndex + i) %
          reviews.length
      ]
    );
  }

  return (
    <section className="section container">
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <h2>
          Trusted by Families Across
          Bengaluru
        </h2>

        <p
          style={{
            maxWidth: "650px",
            margin: "10px auto",
            opacity: 0.7,
          }}
        >
          Genuine feedback from our
          customers.
        </p>
      </div>

      <div
        className="reviews-carousel"
        onMouseEnter={() =>
          setPaused(true)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
      >
        <button
          className="review-arrow"
          type="button"
          onClick={prev}
        >
          {"<"}
        </button>

        <div className="reviews-grid-slider">
          {visibleReviews.map(
            (review, index) => (
              <div
                key={`${review.name}-${index}`}
                className="review-card"
              >
                <div className="stars">
                  *****
                </div>

                <p className="review-text">
                  "{review.review}"
                </p>

                <div className="review-footer">
                  <strong>
                    {review.name}
                  </strong>

                  <span>
                    {review.location}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        <button
          className="review-arrow"
          type="button"
          onClick={next}
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
