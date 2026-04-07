import { FaPhone, FaMapMarkerAlt } from "react-icons/fa";

export default function Contact() {
  return (
    <section className="section container fade-in" style={{ textAlign: "center" }}>
      
      <h2>Contact Us</h2>

      <p>
        <FaPhone /> 9738451955
      </p>

      <p>
        <FaMapMarkerAlt /> Bengaluru
      </p>

      <a href="https://wa.me/919738451955" className="btn">
        Order on WhatsApp
      </a>

    </section>
  );
}