import { useEffect, useState } from "react";

import AdminLayout
  from "../components/AdminLayout";

import api
  from "../services/api";

export default function OrderPage() {

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [orders, setOrders] =
    useState<any[]>([]);

  const [customerId, setCustomerId] =
    useState("");

  const [productId, setProductId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [expectedUnitPrice,
    setExpectedUnitPrice] =
    useState("");

  const [expectedDeliveryDate,
    setExpectedDeliveryDate] =
    useState("");

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

        const orderResponse =
          await api.get(
            "/api/orders"
          );

        setCustomers(
          customerResponse.data.data
        );

        setProducts(
          productResponse.data.data
        );

        setOrders(
          orderResponse.data.data
        );

      } catch (error) {

        console.error(error);

      }
    };

  const createOrder =
    async () => {

      try {

        await api.post(
          "/api/orders",
          {
            customerId:
              Number(customerId),

            productId:
              Number(productId),

            quantity:
              Number(quantity),

            expectedUnitPrice:
              Number(
                expectedUnitPrice
              ),

            expectedDeliveryDate,

            remarks
          }
        );

        alert(
          "Order created successfully"
        );

        setCustomerId("");
        setProductId("");
        setQuantity("");
        setExpectedUnitPrice("");
        setExpectedDeliveryDate("");
        setRemarks("");

        loadData();

      } catch (error: any) {

        console.error(error);

        alert(
          error?.response?.data?.message
          || "Failed to create order"
        );
      }
    };

  return (

    <AdminLayout>

      <h1>
        Customer Orders
      </h1>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px"
        }}
      >

        <h3>
          Create Order
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
            Expected Unit Price
          </label>

          <br />

          <input
            type="number"
            value={expectedUnitPrice}
            onChange={(e) =>
              setExpectedUnitPrice(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Delivery Date
          </label>

          <br />

          <input
            type="date"
            value={
              expectedDeliveryDate
            }
            onChange={(e) =>
              setExpectedDeliveryDate(
                e.target.value
              )
            }
          />

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
            createOrder
          }
        >
          Create Order
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

          <th>
            Order Code
          </th>

          <th>
            Customer
          </th>

          <th>
            Product
          </th>

          <th>
            Quantity
          </th>

          <th>
            Unit Price
          </th>

          <th>
            Amount
          </th>

          <th>
            Delivery Date
          </th>

          <th>
            Status
          </th>

        </tr>

        </thead>

        <tbody>

        {orders.map(
          (order) => (

            <tr
              key={
                order.id
              }
            >

              <td>
                {order.orderCode}
              </td>

              <td>
                {order.customerName}
              </td>

              <td>
                {order.productName}
              </td>

              <td>
                {order.quantity}
              </td>

              <td>
                {
                  order.expectedUnitPrice
                }
              </td>

              <td>
                {
                  order.expectedAmount
                }
              </td>

              <td>
                {
                  order.expectedDeliveryDate
                }
              </td>

              <td>
                {
                  order.status
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