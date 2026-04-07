import { FaWhatsapp, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Contact() {
  return (
    <section className="section container" style={{ textAlign: "center" }}>
      <h2>Contact Us</h2>

      <p>
        <FaPhone /> 9738451955
      </p>

      <p>
        <FaMapMarkerAlt /> Bengaluru
      </p>

      {/* WhatsApp CTA */}
      <a
        href="https://wa.me/919738451955?text=Hi%20I%20want%20to%20order%20mushrooms"
        target="_blank"
        rel="noreferrer"
        className="btn"
        style={{
          marginTop: "15px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <FaWhatsapp /> Chat on WhatsApp
      </a>
    </section>
  );
}