import { useEffect, useState } from "react";

export default function Reviews() {
  const reviews = [
    {
      name: "Ravi Kumar",
      location: "Hebbal, Bengaluru",
      review:
        "Fresh mushrooms, excellent quality and neatly packed. Delivery was on time.",
    },
    {
      name: "Sneha Reddy",
      location: "RT Nagar, Bengaluru",
      review:
        "Very fresh oyster mushrooms. The taste was noticeably better than store-bought mushrooms.",
    },
    {
      name: "Arjun N",
      location: "HBR Layout, Bengaluru",
      review:
        "Consistent quality every time. Hygienic packaging and good customer support.",
    },
    {
      name: "Manjunath S",
      location: "Devanahalli, Bengaluru",
      review:
        "Ordered for a family gathering. Everyone appreciated the freshness and taste.",
    },
    {
      name: "Priya Sharma",
      location: "Yelahanka, Bengaluru",
      review:
        "The mushrooms arrived fresh and stayed fresh even after refrigeration.",
    },
    {
      name: "Naveen Kumar",
      location: "Whitefield, Bengaluru",
      review:
        "Great quality and quick response on WhatsApp. Highly recommended.",
    },
    {
      name: "Lakshmi Rao",
      location: "Jakkur, Bengaluru",
      review:
        "Fresh harvest and clean packaging. Will definitely order again.",
    },
    {
      name: "Vikram Gowda",
      location: "Thanisandra, Bengaluru",
      review:
        "Good pricing and excellent freshness compared to supermarkets.",
    },
    {
      name: "Harsha B",
      location: "Sahakar Nagar, Bengaluru",
      review:
        "The oyster mushrooms were very fresh and perfect for cooking.",
    },
    {
      name: "Deepa R",
      location: "Nagawara, Bengaluru",
      review:
        "Reliable delivery and premium quality mushrooms.",
    },
  ];

  const getVisibleCards = () => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards());
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [paused, reviews.length]);

  const next = () => {
    setStartIndex((prev) => (prev + 1) % reviews.length);
  };

  const prev = () => {
    setStartIndex(
      (prev) => (prev - 1 + reviews.length) % reviews.length
    );
  };

  const visibleReviews = [];

  for (let i = 0; i < visibleCards; i++) {
    visibleReviews.push(
      reviews[(startIndex + i) % reviews.length]
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
        <h2>Trusted by Families Across Bangalore</h2>

        <p
          style={{
            maxWidth: "650px",
            margin: "10px auto",
            opacity: 0.7,
          }}
        >
          Fresh produce, hygienic handling and dependable delivery have helped
          us earn the trust of customers across Bangalore.
        </p>
      </div>

      <div
        className="reviews-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >

        <button className="review-arrow" onClick={prev}>
          ←
        </button>

        <div className="reviews-grid-slider">
          {visibleReviews.map((review, index) => (
            <div
              key={`${review.name}-${index}`}
              className="review-card"
            >
              <div className="stars">
                ★★★★★ <span className="rating">5.0</span>
              </div>

              <p className="review-text">
                "{review.review}"
              </p>

              <div className="review-footer">
                <strong>{review.name}</strong>
                <span>{review.location}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="review-arrow" onClick={next}>
          →
        </button>

      </div>
    </section>
  );
}