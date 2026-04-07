import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Products from "./components/Products";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import useScrollReveal from "./hooks/useScrollReveal";

export default function App() {
  useScrollReveal();
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <Navbar toggleTheme={() => setDark(!dark)} />
      <Hero />
      <Products />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}