import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Products from "./components/Products";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import OrderForm from "./components/OrderForm";
import Reviews from "./components/Reviews";

export default function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.className = dark ? "dark" : "";
  }, [dark]);

  return (
    <>
      <Navbar toggleTheme={() => setDark(!dark)} />
      <Hero />
      <Products />
      <Reviews />
      <OrderForm />
      <About />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </>
  );
}