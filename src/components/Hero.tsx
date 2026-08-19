import { useEffect, useState } from "react";

import {
  fallbackProducts,
  fetchPublicProducts,
  mergeCatalogPrices,
  staticProducts,
  type PublicProduct,
} from "../services/publicProducts";
import { isPublicDynamicContentEnabled } from "../config/publicContent";

export default function Hero() {
  const [products, setProducts] = useState<PublicProduct[]>(staticProducts);

  useEffect(() => {
    let mounted = true;

    isPublicDynamicContentEnabled()
      .then((enabled) => {
        if (!enabled || !mounted) {
          return undefined;
        }

        return fetchPublicProducts();
      })
      .then((catalogProducts) => {
        if (mounted && catalogProducts) {
          setProducts(mergeCatalogPrices(catalogProducts));
        }
      })
      .catch(() => {
        if (mounted) {
          setProducts(staticProducts);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const buttonMushroom = products[0] || fallbackProducts[0];
  const oysterMushroom = products[1] || fallbackProducts[1];
  const oysterBox = products[2] || fallbackProducts[2];

  return (
    <section className="hero-section container">
      <span className="hero-ambient hero-ambient-one" />
      <span className="hero-ambient hero-ambient-two" />
      <span className="hero-star hero-star-one" />
      <span className="hero-star hero-star-two" />
      <span className="hero-star hero-star-three" />
      <span className="hero-star hero-star-four" />
      <span className="hero-star hero-star-five" />

      <div className="hero-content">
        <h1>
          Fresh Mushrooms in Bangalore <br />
          Delivered Within 24 Hours
        </h1>

        <p className="hero-subtext">
          Grown in clean, controlled conditions at Samaksh Farms and delivered fresh
          to your home across Bangalore.
        </p>

        <div className="hero-trust-list">
          <span>Chemical-free cultivation</span>
          <span>Hygienic farm environment</span>
          <span>Fast delivery across Bangalore</span>
        </div>

        <div className="hero-prestige-panel" aria-label="Samaksh Farms customer milestone">
          <span className="hero-prestige-light hero-prestige-light-one" />
          <span className="hero-prestige-light hero-prestige-light-two" />
          <span className="hero-prestige-light hero-prestige-light-three" />
          <span className="hero-prestige-light hero-prestige-light-four" />
          <span className="hero-prestige-line" />

          <div className="hero-prestige-eyebrow">
            Bangalore's trusted fresh mushroom delivery
          </div>
          <h2>Freshness people come back for</h2>

          <div className="hero-prestige-grid">
            <div>
              <strong>1,000+</strong>
              <span>Happy customers</span>
            </div>
            <div>
              <strong>2,500+ kg</strong>
              <span>Mushrooms delivered</span>
            </div>
            <div>
              <strong>24 hrs</strong>
              <span>Farm-to-door freshness</span>
            </div>
          </div>

          <div className="hero-prestige-proof">
            <span>Clean growing rooms</span>
            <span>Hand-packed batches</span>
            <span>Local Bangalore delivery</span>
          </div>
        </div>

        <div className="hero-cta">
          <a className="btn hero-primary-action" href="#products">
            Order Fresh Mushrooms
          </a>
          <a className="hero-secondary-action" href="#reviews">
            See customer love
          </a>
        </div>

        <a className="hero-product-peek" href="#products" aria-label="Scroll to mushroom products">
          <span className="hero-peek-line" />
          <span className="hero-peek-card">
            <strong>Button</strong>
            <small>{priceText(buttonMushroom)}</small>
          </span>
          <span className="hero-peek-card hero-peek-card-featured">
            <strong>Oyster Box</strong>
            <small>{priceText(oysterBox)}</small>
          </span>
          <span className="hero-peek-card">
            <strong>Oyster</strong>
            <small>{priceText(oysterMushroom)}</small>
          </span>
          <span className="hero-peek-hint">Fresh picks below</span>
        </a>
      </div>
    </section>
  );
}

function priceText(product: PublicProduct) {
  return `Rs. ${product.price}/${product.unit}`;
}
