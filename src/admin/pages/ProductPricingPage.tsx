import { useEffect, useMemo, useState } from "react";
import { IndianRupee, PackagePlus, RefreshCw, Save } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";
import { fallbackProducts } from "../../services/publicProducts";

type ProductUnitType = "KG" | "BOX" | "PACK";

type Product = {
  id: number;
  productCode?: string;
  productName: string;
  unitType: ProductUnitType;
  standardPrice: number;
  active?: boolean;
};

type ProductDraft = {
  productName: string;
  unitType: ProductUnitType;
  standardPrice: string;
};

type Banner = {
  tone: "success" | "error";
  message: string;
};

const unitOptions: ProductUnitType[] = ["KG", "BOX", "PACK"];

export default function ProductPricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ProductDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const activeProducts = products.filter((product) => product.active !== false);

  const missingWebsiteProducts = useMemo(
    () =>
      fallbackProducts.filter(
        (websiteProduct) =>
          !products.some((product) =>
            websiteProduct.matchNames
              .map(normalizeProductName)
              .includes(normalizeProductName(product.productName)),
          ),
      ),
    [products],
  );

  const averagePrice =
    activeProducts.length === 0
      ? 0
      : Math.round(
          activeProducts.reduce(
            (sum, product) => sum + Number(product.standardPrice || 0),
            0,
          ) / activeProducts.length,
        );

  const loadProducts = async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/products");
      const nextProducts = response?.data?.data || [];
      setProducts(nextProducts);
      setDrafts(
        Object.fromEntries(
          nextProducts.map((product: Product) => [
            product.id,
            draftFromProduct(product),
          ]),
        ),
      );
    } catch (error: any) {
      showBanner({
        tone: "error",
        message: error?.response?.data?.message || "Unable to load products.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (product: Product) => {
    if (savingId) {
      return;
    }

    const draft = drafts[product.id];
    const price = Number(draft?.standardPrice);

    if (!draft?.productName.trim()) {
      showBanner({ tone: "error", message: "Product name is required." });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showBanner({ tone: "error", message: "Product price cannot be negative." });
      return;
    }

    setSavingId(product.id);

    try {
      await api.put(`/api/products/${product.id}`, {
        productName: draft.productName.trim(),
        unitType: draft.unitType,
        standardPrice: price,
      });

      showBanner({
        tone: "success",
        message: `${draft.productName.trim()} price updated on the website.`,
      });
      await loadProducts();
    } catch (error: any) {
      showBanner({
        tone: "error",
        message: error?.response?.data?.message || "Unable to update product.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const createWebsiteProduct = async (websiteProduct: (typeof fallbackProducts)[number]) => {
    const creationKey = normalizeProductName(websiteProduct.name);

    if (creatingKey) {
      return;
    }

    setCreatingKey(creationKey);

    try {
      await api.post("/api/products", {
        productName: websiteProduct.name,
        unitType: websiteProduct.unit === "box" ? "BOX" : "KG",
        standardPrice: websiteProduct.price,
      });

      showBanner({
        tone: "success",
        message: `${websiteProduct.name} added to the website price catalog.`,
      });
      await loadProducts();
    } catch (error: any) {
      showBanner({
        tone: "error",
        message: error?.response?.data?.message || "Unable to add product.",
      });
    } finally {
      setCreatingKey(null);
    }
  };

  const updateDraft = (
    productId: number,
    field: keyof ProductDraft,
    value: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }));
  };

  const showBanner = (nextBanner: Banner) => {
    setBanner(nextBanner);
    window.setTimeout(() => {
      setBanner((current) =>
        current?.message === nextBanner.message ? null : current,
      );
    }, 1600);
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Website catalog"
        title="Product Prices"
        subtitle="Edit prices shown on the public website product cards."
        actions={
          <button
            className="admin-button admin-button-secondary"
            type="button"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {banner && (
        <div
          className={`admin-feedback-banner ${
            banner.tone === "error" ? "admin-feedback-error" : ""
          }`}
        >
          <span>{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)}>
            Close
          </button>
        </div>
      )}

      <div className="admin-stat-grid">
        <StatCard
          label="Catalog products"
          value={products.length}
          icon={<PackagePlus size={18} />}
          tone="green"
        />
        <StatCard
          label="Active products"
          value={activeProducts.length}
          helper="Visible to sales and available for website matching."
          tone="blue"
        />
        <StatCard
          label="Average price"
          value={`Rs. ${averagePrice}`}
          icon={<IndianRupee size={18} />}
          tone="amber"
        />
      </div>

      {missingWebsiteProducts.length > 0 && (
        <Panel
          title="Missing website products"
          subtitle="Add these once so the homepage prices can be controlled from this tab."
        >
          <div className="product-price-missing-grid">
            {missingWebsiteProducts.map((websiteProduct) => {
              const creationKey = normalizeProductName(websiteProduct.name);

              return (
                <article className="product-price-missing-card" key={websiteProduct.id}>
                  <div>
                    <strong>{websiteProduct.name}</strong>
                    <span>
                      Rs. {websiteProduct.price}/{websiteProduct.unit}
                    </span>
                  </div>
                  <button
                    className="admin-button"
                    type="button"
                    onClick={() => createWebsiteProduct(websiteProduct)}
                    disabled={creatingKey === creationKey}
                  >
                    <PackagePlus size={16} />
                    {creatingKey === creationKey ? "Adding..." : "Add"}
                  </button>
                </article>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel
        title="Edit catalog"
        subtitle="Price changes are used by the public website after refresh."
      >
        {loading && <EmptyState title="Loading products" message="Fetching catalog prices." />}

        {!loading && products.length === 0 && (
          <EmptyState
            title="No products found"
            message="Use the missing website product actions above to create the first catalog entries."
          />
        )}

        {!loading && products.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table product-price-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Website price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const draft = drafts[product.id] || draftFromProduct(product);

                  return (
                    <tr key={product.id}>
                      <td>
                        <Field label="Product name" required>
                          <input
                            value={draft.productName}
                            onChange={(event) =>
                              updateDraft(product.id, "productName", event.target.value)
                            }
                          />
                        </Field>
                      </td>
                      <td>
                        <Field label="Unit" required>
                          <select
                            value={draft.unitType}
                            onChange={(event) =>
                              updateDraft(product.id, "unitType", event.target.value)
                            }
                          >
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </td>
                      <td>
                        <Field label="Price" required>
                          <input
                            min="0"
                            type="number"
                            value={draft.standardPrice}
                            onChange={(event) =>
                              updateDraft(product.id, "standardPrice", event.target.value)
                            }
                          />
                        </Field>
                      </td>
                      <td>
                        <StatusPill
                          status={product.active === false ? "Disabled" : "Active"}
                          tone={product.active === false ? "neutral" : "success"}
                        />
                      </td>
                      <td>
                        <button
                          className="admin-button"
                          type="button"
                          onClick={() => saveProduct(product)}
                          disabled={savingId === product.id}
                        >
                          <Save size={16} />
                          {savingId === product.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminLayout>
  );
}

function draftFromProduct(product: Product): ProductDraft {
  return {
    productName: product.productName || "",
    unitType: product.unitType || "KG",
    standardPrice: String(product.standardPrice ?? 0),
  };
}

function normalizeProductName(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
