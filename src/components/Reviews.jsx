export default function Reviews() {
  const reviews = [
    {
      name: "Ravi Kumar",
      text: "Super fresh mushrooms, really impressed!",
    },
    {
      name: "Sneha Reddy",
      text: "Clean, hygienic and quick delivery.",
    },
    {
      name: "Arjun",
      text: "Best quality mushrooms in Bangalore!",
    },
  ];

  return (
    <section className="section container">

      <h2>Trusted by Customers</h2>

      <div className="grid grid-2" style={{ marginTop: "30px" }}>
        {reviews.map((r, i) => (
          <div key={i} className="card">

            <p style={{
              fontStyle: "italic",
              lineHeight: "1.6"
            }}>
              "{r.text}"
            </p>

            <h4 style={{ marginTop: "12px" }}>— {r.name}</h4>

          </div>
        ))}
      </div>

    </section>
  );
}