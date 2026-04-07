import { motion } from "framer-motion";

export default function About() {
  return (
    <motion.section
      className="section container fade-in"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
    >
      <h2>About Samaksh Farms</h2>

      <p style={{ marginTop: "10px", opacity: 0.7 }}>
        Samaksh Farms supplies fresh mushrooms in Bangalore including button 
        and oyster mushrooms. Our mushrooms are grown in a clean and controlled 
        environment and delivered fresh within 24 hours.
      </p>

    </motion.section>
  );
}