import {
  FaWhatsapp,
  FaPhoneAlt,
  FaInstagram,
  FaYoutube,
  FaArrowRight,
} from "react-icons/fa";

export default function Contact() {
  return (
    <section className="container contact-section">

      <div className="contact-card">

        <span className="contact-label">
          PLACE YOUR ORDER
        </span>

        <h2 className="contact-title">
          Get Fresh Mushrooms Delivered
        </h2>

        <p className="contact-subtitle">
          Contact us directly for availability, pricing and delivery.
        </p>

        <div className="contact-details">

          <div className="contact-detail">
            <FaPhoneAlt />
            <span>+91 97384 51955</span>
          </div>

        </div>

        <a
          href="https://wa.me/919738451955?text=Hi%20Samaksh%20Farms,%20I%20would%20like%20to%20order%20fresh%20mushrooms."
          target="_blank"
          rel="noreferrer"
          className="contact-whatsapp-btn"
        >
          <FaWhatsapp />
          Order On WhatsApp
          <FaArrowRight />
        </a>

        <div className="social-links">

          <a
            href="YOUR_INSTAGRAM_LINK"
            target="_blank"
            rel="noreferrer"
            className="social-link"
          >
            <FaInstagram />
            Instagram
          </a>

          <a
            href="YOUR_YOUTUBE_LINK"
            target="_blank"
            rel="noreferrer"
            className="social-link"
          >
            <FaYoutube />
            YouTube
          </a>

          <a
            href="https://wa.me/919738451955"
            target="_blank"
            rel="noreferrer"
            className="social-link"
          >
            <FaWhatsapp />
            WhatsApp
          </a>

        </div>

        <div className="contact-badges">

          <span>Fresh Daily</span>

          <span>Farm Grown</span>

          <span>24 Hr Delivery</span>

          <span>No Middlemen</span>

        </div>

      </div>

    </section>
  );
}