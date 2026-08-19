import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const enabled =
  String(
    process.env.VITE_GENERATE_PUBLIC_CONTENT_SNAPSHOT ||
      process.env.GENERATE_PUBLIC_CONTENT_SNAPSHOT ||
      "false",
  ).toLowerCase() === "true";

const apiBaseUrl = String(
  process.env.PUBLIC_CONTENT_SNAPSHOT_API_URL ||
    process.env.VITE_API_URL ||
    "http://localhost:8080",
).replace(/\/+$/, "");

const outputPath =
  path.resolve("src", "generated", "publicContentSnapshot.ts");

if (!enabled) {
  await writeSnapshot([], []);
  console.log("Public content snapshot disabled; wrote empty static snapshot.");
  process.exit(0);
}

try {
  const [products, reviews] =
    await Promise.all([
      fetchApiData(`${apiBaseUrl}/api/products`),
      fetchApiData(`${apiBaseUrl}/api/reviews`),
    ]);

  await writeSnapshot(
    normalizeProducts(products),
    normalizeReviews(reviews),
  );

  console.log(
    `Public content snapshot generated from ${apiBaseUrl}: ` +
      `${products.length} products, ${reviews.length} reviews.`,
  );
} catch (error) {
  await writeSnapshot([], []);
  console.warn(
    "Public content snapshot failed; wrote empty static snapshot.",
    error,
  );
}

async function fetchApiData(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const body = await response.json();

  return Array.isArray(body?.data) ? body.data : [];
}

function normalizeProducts(products) {
  return products
    .filter((product) => product && product.active !== false)
    .map((product) => ({
      id: Number(product.id),
      productName: String(product.productName || "").trim(),
      unitType: product.unitType || "KG",
      standardPrice: Number(product.standardPrice || 0),
      active: product.active !== false,
    }))
    .filter(
      (product) =>
        Number.isFinite(product.id) &&
        product.productName &&
        Number.isFinite(product.standardPrice),
    );
}

function normalizeReviews(reviews) {
  return reviews
    .filter((review) => review)
    .map((review) => ({
      id: Number(review.id),
      name: String(review.name || "").trim(),
      location: String(review.location || "").trim(),
      review: String(review.review || "").trim(),
      rating: Math.min(5, Math.max(1, Number(review.rating || 5))),
    }))
    .filter(
      (review) =>
        review.name &&
        review.location &&
        review.review &&
        Number.isFinite(review.rating),
    );
}

async function writeSnapshot(products, reviews) {
  await mkdir(path.dirname(outputPath), {
    recursive: true,
  });

  await writeFile(
    outputPath,
    [
      "export const snapshotProducts = ",
      JSON.stringify(products, null, 2),
      ";\n\nexport const snapshotReviews = ",
      JSON.stringify(reviews, null, 2),
      ";\n",
    ].join(""),
  );
}
