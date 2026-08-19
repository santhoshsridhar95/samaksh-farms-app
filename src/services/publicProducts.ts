import { API_BASE_URL } from "../config/api";
import { snapshotProducts } from "../generated/publicContentSnapshot";

export type PublicProduct = {
  id: number;
  name: string;
  desc: string;
  price: number;
  unit: string;
  img: string;
  matchNames: string[];
};

export type ApiProduct = {
  id: number;
  productName: string;
  unitType?: "KG" | "BOX" | "PACK";
  standardPrice?: number;
  active?: boolean;
};

export const fallbackProducts: PublicProduct[] = [
  {
    id: 1,
    name: "Button Mushrooms",
    desc: "Fresh, firm, ideal for everyday cooking. (Subject to availability)",
    price: 230,
    unit: "kg",
    img: "/button-mushroom.jpg",
    matchNames: ["Button Mushrooms"],
  },
  {
    id: 2,
    name: "Oyster Mushrooms",
    desc: "Soft texture, rich flavor, highly nutritious",
    price: 249,
    unit: "kg",
    img: "/oyster-mushroom.jpg",
    matchNames: ["Oyster Mushrooms"],
  },
  {
    id: 3,
    name: "Oyster Mushroom Box (200gm)",
    desc: "Fresh packed mushrooms ready for daily use",
    price: 55,
    unit: "box",
    img: "/oyster-mushroom-box.jpg",
    matchNames: ["Oyster Mushroom Box (200gm)", "Oyster Mushroom Box", "Oyster Box"],
  },
];

export const staticProducts: PublicProduct[] =
  buildStaticProducts(snapshotProducts as ApiProduct[]);

export async function fetchPublicProducts(): Promise<ApiProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/products`);

  if (!response.ok) {
    throw new Error("Product catalog is unavailable");
  }

  const body = await response.json();

  return Array.isArray(body?.data) ? body.data : [];
}

export function mergeCatalogPrices(
  apiProducts: ApiProduct[],
  products: PublicProduct[] = fallbackProducts,
): PublicProduct[] {
  return products.map((product) => {
    const catalogProduct = findCatalogProduct(product, apiProducts);

    if (!catalogProduct || catalogProduct.standardPrice == null) {
      return product;
    }

    return {
      ...product,
      price: Number(catalogProduct.standardPrice),
      unit: unitLabel(catalogProduct.unitType, product.unit),
    };
  });
}

function buildStaticProducts(
  apiProducts: ApiProduct[],
): PublicProduct[] {
  const pricedProducts =
    mergeCatalogPrices(apiProducts, fallbackProducts);

  const existingNames =
    new Set(
      pricedProducts
        .flatMap((product) => [product.name, ...product.matchNames])
        .map(normalizeProductName),
    );

  const appendedProducts =
    apiProducts
      .filter((apiProduct) => apiProduct.active !== false)
      .filter(
        (apiProduct) =>
          !existingNames.has(normalizeProductName(apiProduct.productName)),
      )
      .map((apiProduct) => ({
        id: Number(apiProduct.id),
        name: apiProduct.productName,
        desc: "Freshly harvested and packed by Samaksh Farms.",
        price: Number(apiProduct.standardPrice || 0),
        unit: unitLabel(apiProduct.unitType, "kg"),
        img: "/oyster-mushroom.jpg",
        matchNames: [apiProduct.productName],
      }));

  return [...pricedProducts, ...appendedProducts];
}

function findCatalogProduct(
  product: PublicProduct,
  apiProducts: ApiProduct[],
) {
  const activeProducts = apiProducts.filter((apiProduct) => apiProduct.active !== false);
  const names = product.matchNames.map(normalizeProductName);

  return activeProducts.find((apiProduct) =>
    names.includes(normalizeProductName(apiProduct.productName)),
  );
}

function normalizeProductName(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unitLabel(unitType?: string, fallback = "kg") {
  if (unitType === "BOX") {
    return "box";
  }

  if (unitType === "PACK") {
    return "pack";
  }

  if (unitType === "KG") {
    return "kg";
  }

  return fallback;
}
