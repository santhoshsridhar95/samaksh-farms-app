import { useEffect, useState } from "react";

import AdminLayout
  from "../components/AdminLayout";

import api
  from "../services/api";

export default function SalesPage() {

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [sales, setSales] =
    useState<any[]>([]);

  const [customerId, setCustomerId] =
    useState("");

  const [productId, setProductId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("PENDING");

  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {

    loadData();

  }, []);

  const loadData =
    async () => {

      try {

        const customerResponse =
          await api.get(
            "/api/customers"
          );

        const productResponse =
          await api.get(
            "/api/products"
          );

        const salesResponse =
          await api.get(
            "/api/sales"
          );

        setCustomers(
          customerResponse.data.data
        );

        setProducts(
          productResponse.data.data
        );

        setSales(
          salesResponse.data.data
        );

      } catch (error) {

        console.error(error);

      }
    };

  const createSale =
    async () => {

      try {

        await api.post(
          "/api/sales",
          {
            customerId:
              Number(customerId),

            productId:
              Number(productId),

            quantity:
              Number(quantity),

            unitPrice:
              Number(unitPrice),

            paymentStatus,

            remarks
          }
        );

        alert(
          "Sale created successfully"
        );

        setCustomerId("");
        setProductId("");
        setQuantity("");
        setUnitPrice("");
        setPaymentStatus("PENDING");
        setRemarks("");

        loadData();

      } catch (error: any) {

        console.error(error);

        alert(
          error?.response?.data?.message
          || "Failed to create sale"
        );
      }
    };

  const totalRevenue =
    sales.reduce(
      (
        total,
        sale
      ) =>
        total +
        (sale.totalAmount || 0),
      0
    );

  return (

    <AdminLayout>

      <h1>
        Sales Management
      </h1>

      <h2>
        Total Revenue :
        ₹ {totalRevenue}
      </h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px"
        }}
      >

        <h3>
          Create Sale
        </h3>

        <div>

          <label>
            Customer
          </label>

          <br />

          <select
            value={customerId}
            onChange={(e) =>
              setCustomerId(
                e.target.value
              )
            }
          >

            <option value="">
              Select Customer
            </option>

            {customers.map(
              (customer) => (

                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {
                    customer.customerName
                  }
                </option>

              )
            )}

          </select>

        </div>

        <br />

        <div>

          <label>
            Product
          </label>

          <br />

          <select
            value={productId}
            onChange={(e) =>
              setProductId(
                e.target.value
              )
            }
          >

            <option value="">
              Select Product
            </option>

            {products.map(
              (product) => (

                <option
                  key={product.id}
                  value={product.id}
                >
                  {
                    product.productName
                  }
                </option>

              )
            )}

          </select>

        </div>

        <br />

        <div>

          <label>
            Quantity
          </label>

          <br />

          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Unit Price
          </label>

          <br />

          <input
            type="number"
            value={unitPrice}
            onChange={(e) =>
              setUnitPrice(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Payment Status
          </label>

          <br />

          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(
                e.target.value
              )
            }
          >

            <option value="PAID">
              PAID
            </option>

            <option value="PENDING">
              PENDING
            </option>

            <option value="PARTIAL">
              PARTIAL
            </option>

          </select>

        </div>

        <br />

        <div>

          <label>
            Remarks
          </label>

          <br />

          <input
            value={remarks}
            onChange={(e) =>
              setRemarks(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <button
          onClick={
            createSale
          }
        >
          Create Sale
        </button>

      </div>

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%"
        }}
      >

        <thead>

        <tr>

          <th>Customer</th>

          <th>Product</th>

          <th>Quantity</th>

          <th>Unit Price</th>

          <th>Total</th>

          <th>Status</th>

          <th>Remarks</th>

        </tr>

        </thead>

        <tbody>

        {sales.map(
          (sale) => (

            <tr
              key={
                sale.id
              }
            >

              <td>
                {
                  sale.customerName
                }
              </td>

              <td>
                {
                  sale.productName
                }
              </td>

              <td>
                {
                  sale.quantity
                }
              </td>

              <td>
                {
                  sale.unitPrice
                }
              </td>

              <td>
                {
                  sale.totalAmount
                }
              </td>

              <td>
                {
                  sale.paymentStatus
                }
              </td>

              <td>
                {
                  sale.remarks
                }
              </td>

            </tr>

          )
        )}

        </tbody>

      </table>

    </AdminLayout>
  );
}