import { useEffect, useMemo, useState } from "react";
import {
  Download,
  AlertTriangle,
  Boxes,
  Calculator,
  IndianRupee,
  Pencil,
  Receipt,
  Save,
  Search,
  Store,
  Trash2,
  WalletCards,
} from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "../components/AdminUI";
import api from "../services/api";
import {
  downloadBoxAllocationWorkbook,
  downloadSalesWorkbook,
} from "../utils/excelExport";

const exchangeTypes = [
  { value: "NONE", label: "None" },
  { value: "ONE_ON_ONE", label: "1 on 1" },
  { value: "TWO_ON_ONE", label: "2 on 1" },
];

const shopProductOptions = [
  "Oyster Mushroom",
  "Button Mushroom",
  "Sweet Corn",
  "Baby Corn",
  "Paneer",
];

const emptyShopForm = {
  id: "",
  customerName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  address: "",
  location: "R.T. Nagar",
  shopCategory: "Vegetable Shop",
  minimumBoxesPerDay: "10",
  dailyReturnedBoxes: "0",
  defaultBoxPrice: "50",
  shopkeeperSellingPrice: "60",
  exchangeType: "NONE",
  products: ["Oyster Mushroom"],
  active: true,
};

const emptySaleForm = {
  customerId: "",
  productId: "",
  quantity: "",
  unitPrice: "",
  shopkeeperSellingPrice: "",
  amountCollected: "",
  exchangeType: "NONE",
  exchangeBoxes: "0",
  returnedBoxes: "0",
  remarks: "",
};

type ShopForm = typeof emptyShopForm;
type SaleForm = typeof emptySaleForm;
type BoxAllocation = {
  shopId: number | string;
  shopName: string;
  category: string;
  location: string;
  dailyRequirement: number;
  allocatedBoxes: number;
  shortageBoxes: number;
  surplusBoxes: number;
};
type BannerState = {
  tone: "success" | "error";
  message: string;
} | null;

export default function SalesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [shopSearch, setShopSearch] = useState("");
  const [shopSearchOpen, setShopSearchOpen] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [activeTab, setActiveTab] = useState("delivery");
  const [selectedHistoryShopId, setSelectedHistoryShopId] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [shopToDelete, setShopToDelete] = useState<any>(null);
  const [paymentSale, setPaymentSale] = useState<any>(null);
  const [paymentReceived, setPaymentReceived] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [allocationBoxCount, setAllocationBoxCount] = useState("100");
  const [shopForm, setShopForm] = useState<ShopForm>(emptyShopForm);
  const [saleForm, setSaleForm] = useState<SaleForm>(emptySaleForm);
  const [banner, setBanner] = useState<BannerState>(null);

  const role = localStorage.getItem("role");
  const hasPermission = (permission: string) =>
    role === "SUPER_ADMIN" || permissions.includes(permission);
  const canManageShops = hasPermission("sales.manage_shops");
  const canViewLedger = hasPermission("sales.view_ledger");
  const canCreateDelivery = hasPermission("sales.create_delivery");
  const canDeleteShops = role === "SUPER_ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const customerResponse = await api.get("/api/customers?size=1000");
      const allCustomerResponse = await api.get(
        "/api/customers?size=1000&includeInactive=true",
      );
      const productResponse = await api.get("/api/products");
      const salesResponse = await api.get("/api/sales?size=1000");
      const entitlementResponse = await api.get("/api/entitlements/me");

      setCustomers(customerResponse?.data?.data?.content || []);
      setAllCustomers(allCustomerResponse?.data?.data?.content || []);
      setProducts(productResponse.data.data || []);
      setSales(salesResponse?.data?.data?.content || []);
      setPermissions(entitlementResponse?.data?.data?.permissions || []);
      setPaymentSale(null);
      setPaymentReceived("");
      setPaymentRemarks("");
    } catch (error) {
      console.error(error);
    }
  };

  const selectedShop = useMemo(
    () =>
      customers.find(
        (customer) => String(customer.id) === String(saleForm.customerId),
      ),
    [customers, saleForm.customerId],
  );

  const selectedShopBalance = useMemo(
    () => calculateShopBalance(sales, Number(saleForm.customerId)),
    [sales, saleForm.customerId],
  );

  const grossAmount =
    (Number(saleForm.quantity) || 0) * (Number(saleForm.unitPrice) || 0);
  const exchangeCredit = calculateExchangeCredit(
    saleForm.exchangeType,
    Number(saleForm.exchangeBoxes) || 0,
    Number(saleForm.unitPrice) || 0,
  );
  const totalAmount = Math.max(0, grossAmount - exchangeCredit);
  const amountReceivedToday = Number(saleForm.amountCollected) || 0;
  const amountAppliedToOldBalance = Math.min(
    selectedShopBalance,
    amountReceivedToday,
  );
  const amountAppliedToThisSale = Math.min(
    totalAmount,
    Math.max(0, amountReceivedToday - amountAppliedToOldBalance),
  );
  const pendingForThisSale = totalAmount - amountAppliedToThisSale;
  const balanceAfterCollection = Math.max(
    0,
    selectedShopBalance + totalAmount - amountReceivedToday,
  );

  const filteredShops = customers.filter((customer) => {
    const searchable = [
      customer.customerName,
      customer.shopCategory,
      customer.location,
      customer.contactPerson,
      customer.phoneNumber,
      ...(customer.products || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(shopSearch.toLowerCase());
  });

  const selectedHistoryShop = allCustomers.find(
    (customer) => String(customer.id) === String(selectedHistoryShopId),
  );
  const selectedHistorySales = sales.filter(
    (sale) => String(sale.customerId) === String(selectedHistoryShopId),
  );
  const historyPageSize = 8;
  const historySalesPage = selectedHistorySales.slice(
    historyPage * historyPageSize,
    historyPage * historyPageSize + historyPageSize,
  );
  const historyTotals = selectedHistorySales.reduce(
    (total, sale) => ({
      boxes: total.boxes + (Number(sale.quantity) || 0),
      amount: total.amount + (Number(sale.totalAmount) || 0),
      pending: total.pending + salePending(sale),
    }),
    { boxes: 0, amount: 0, pending: 0 },
  );
  const allocationTotalBoxes = Math.max(
    0,
    Math.floor(Number(allocationBoxCount) || 0),
  );
  const boxAllocation = useMemo(
    () => buildBoxAllocation(customers, allocationTotalBoxes),
    [customers, allocationTotalBoxes],
  );
  const allocationTotals = useMemo(
    () =>
      boxAllocation.reduce(
        (total, allocation) => ({
          dailyRequirement:
            total.dailyRequirement + allocation.dailyRequirement,
          allocatedBoxes: total.allocatedBoxes + allocation.allocatedBoxes,
          shortageBoxes: total.shortageBoxes + allocation.shortageBoxes,
          surplusBoxes: total.surplusBoxes + allocation.surplusBoxes,
        }),
        {
          dailyRequirement: 0,
          allocatedBoxes: 0,
          shortageBoxes: 0,
          surplusBoxes: 0,
        },
      ),
    [boxAllocation],
  );

  const tabs = [
    canCreateDelivery && { id: "delivery", label: "Delivery Entry" },
    canCreateDelivery && { id: "allocation", label: "Box Allocation" },
    canManageShops && { id: "shops", label: "Shop Setup" },
    canViewLedger && { id: "ledger", label: "Sales Ledger" },
    canViewLedger && { id: "history", label: "Shop History" },
  ].filter(Boolean) as { id: string; label: string }[];

  const updateShopField = (
    field: keyof ShopForm,
    value: string | boolean | string[],
  ) => {
    setShopForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleShopProduct = (productName: string) => {
    setShopForm((current) => {
      const selected = current.products.includes(productName);

      return {
        ...current,
        products: selected
          ? current.products.filter((product) => product !== productName)
          : [...current.products, productName],
      };
    });
  };

  const addCustomProduct = () => {
    const productName = customProductName.trim();

    if (!productName) {
      return;
    }

    setShopForm((current) => ({
      ...current,
      products: current.products.some(
        (product) => product.toLowerCase() === productName.toLowerCase(),
      )
        ? current.products
        : [...current.products, productName],
    }));
    setCustomProductName("");
  };

  const updateSaleField = (field: keyof SaleForm, value: string) => {
    setSaleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const editShop = (customer: any) => {
    setShopForm({
      id: String(customer.id || ""),
      customerName: customer.customerName || "",
      contactPerson: customer.contactPerson || "",
      phoneNumber: customer.phoneNumber || "",
      email: customer.email || "",
      address: customer.address || "",
      location: customer.location || "R.T. Nagar",
      shopCategory: customer.shopCategory || "Vegetable Shop",
      minimumBoxesPerDay: String(customer.minimumBoxesPerDay ?? "10"),
      defaultBoxPrice: String(customer.defaultBoxPrice ?? "50"),
      shopkeeperSellingPrice: String(customer.shopkeeperSellingPrice ?? "60"),
      dailyReturnedBoxes: String(customer.dailyReturnedBoxes ?? "0"),
      exchangeType: customer.exchangeType || "NONE",
      products: normalizeShopProducts(customer.products),
      active: customer.active ?? true,
    });
  };

  const saveShop = async () => {
    try {
      if (
        shopForm.phoneNumber.trim() &&
        !/^[0-9]{10}$/.test(shopForm.phoneNumber.trim())
      ) {
        alert("Phone number must be exactly 10 digits");
        return;
      }

      const payload = {
        customerName: shopForm.customerName,
        contactPerson: shopForm.contactPerson,
        phoneNumber: shopForm.phoneNumber,
        email: shopForm.email,
        address: shopForm.address,
        location: shopForm.location,
        shopCategory: shopForm.shopCategory,
        minimumBoxesPerDay: Number(shopForm.minimumBoxesPerDay) || 0,
        defaultBoxPrice: Number(shopForm.defaultBoxPrice) || 0,
        shopkeeperSellingPrice: Number(shopForm.shopkeeperSellingPrice) || 0,
        dailyReturnedBoxes: Number((shopForm as any).dailyReturnedBoxes) || 0,
        exchangeType: shopForm.exchangeType,
        products: normalizeShopProducts(shopForm.products),
        active: shopForm.active,
      };

      if (shopForm.id) {
        await api.put(`/api/customers/${shopForm.id}`, payload);
        setBanner({
          tone: "success",
          message: "Shop updated successfully.",
        });
      } else {
        await api.post("/api/customers", payload);
        setBanner({
          tone: "success",
          message: "Shop created successfully.",
        });
      }

      setShopForm(emptyShopForm);
      await loadData();
    } catch (error: any) {
      console.error(error);
      setBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to save shop.",
      });
    }
  };

  const deleteShop = async () => {
    if (!shopToDelete) {
      return;
    }

    try {
      const shopName = shopToDelete.customerName;
      await api.delete(`/api/customers/${shopToDelete.id}`);
      setShopToDelete(null);
      if (String(shopForm.id) === String(shopToDelete.id)) {
        setShopForm(emptyShopForm);
      }
      setBanner({
        tone: "success",
        message: `${shopName} deleted successfully.`,
      });
      await loadData();
    } catch (error: any) {
      console.error(error);
      setShopToDelete(null);
      setBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to delete shop.",
      });
    }
  };

  const selectSaleShop = (customerId: string) => {
    const shop = customers.find(
      (customer) => String(customer.id) === String(customerId),
    );
    const latestSale = latestSaleForShop(sales, Number(customerId));

    setSaleForm((current) => ({
      ...current,
      customerId,
      productId:
        String(latestSale?.productId || current.productId || products[0]?.id || ""),
      quantity: String(
        latestSale?.quantity ?? shop?.minimumBoxesPerDay ?? current.quantity,
      ),
      unitPrice: String(latestSale?.unitPrice ?? shop?.defaultBoxPrice ?? "50"),
      shopkeeperSellingPrice: String(
        latestSale?.shopkeeperSellingPrice ??
          shop?.shopkeeperSellingPrice ??
          "60",
      ),
      exchangeType: latestSale?.exchangeType || shop?.exchangeType || "NONE",
      exchangeBoxes: "0",
      returnedBoxes: "0",
      amountCollected: "",
      remarks: "",
    }));
  };

  const chooseSaleShop = (customer: any) => {
    selectSaleShop(String(customer.id));
    setShopSearch(customer.customerName || "");
    setShopSearchOpen(false);
  };

  const createSale = async () => {
    try {
      if (amountReceivedToday > selectedShopBalance + totalAmount) {
        alert("Amount received cannot be greater than current balance plus today's bill");
        return;
      }

      await api.post("/api/sales", {
        customerId: Number(saleForm.customerId),
        productId: Number(saleForm.productId || products[0]?.id),
        quantity: Number(saleForm.quantity),
        unitPrice: Number(saleForm.unitPrice),
        amountCollected: Number(saleForm.amountCollected) || 0,
        shopkeeperSellingPrice:
          Number(saleForm.shopkeeperSellingPrice) || undefined,
        exchangeType: saleForm.exchangeType,
        exchangeBoxes: Number(saleForm.exchangeBoxes) || 0,
        returnedBoxes: Number((saleForm as any).returnedBoxes) || 0,
        remarks: saleForm.remarks,
      });

      setBanner({
        tone: "success",
        message: "Sale created successfully.",
      });
      setSaleForm(emptySaleForm);
      await loadData();
    } catch (error: any) {
      console.error(error);
      setBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to create sale.",
      });
    }
  };

  const downloadSalesCsv = () => {
    downloadSalesWorkbook(customers, sales);
  };

  const downloadBoxAllocation = () => {
    if (boxAllocation.length === 0) {
      alert("Create active shops with daily boxes before downloading allocation");
      return;
    }

    downloadBoxAllocationWorkbook(boxAllocation, allocationTotalBoxes);
  };

  const openPaymentEditor = (sale: any) => {
    setPaymentSale(sale);
    setPaymentReceived("");
    setPaymentRemarks("");
  };

  const closePaymentEditor = () => {
    setPaymentSale(null);
    setPaymentReceived("");
    setPaymentRemarks("");
  };

  const savePayment = async (markPaid = false) => {
    if (!paymentSale) {
      return;
    }

    const currentCollected = Number(paymentSale.amountCollected) || 0;
    const pendingAmount = salePending(paymentSale);
    const receivedAmount = markPaid
      ? pendingAmount
      : Number(paymentReceived) || 0;
    const nextCollected = currentCollected + receivedAmount;

    if (receivedAmount <= 0) {
      alert("Enter a payment amount greater than 0");
      return;
    }

    if (receivedAmount > pendingAmount) {
      alert("Payment received cannot be greater than pending amount");
      return;
    }

    try {
      const customerName = paymentSale.customerName;
      await api.put(`/api/sales/${paymentSale.id}/payment`, {
        amountCollected: nextCollected,
        remarks: paymentRemarks,
      });

      closePaymentEditor();
      setBanner({
        tone: "success",
        message: markPaid
          ? `${customerName}'s sale marked as paid.`
          : `${customerName}'s payment updated successfully.`,
      });
      await loadData();
    } catch (error: any) {
      console.error(error);
      closePaymentEditor();
      setBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to update payment.",
      });
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Sales"
        title="Shop Sales"
        subtitle="Use this workspace for delivery entry, shop setup, ledger checks, and shop-wise history."
        actions={canViewLedger ? (
          <button
            className="admin-button"
            type="button"
            onClick={downloadSalesCsv}
          >
            <Download size={17} />
            Download Excel
          </button>
        ) : null}
      />

      {banner && (
        <div className={`admin-feedback-banner admin-feedback-${banner.tone}`}>
          <strong>{banner.tone === "success" ? "Success" : "Failed"}</strong>
          <span>{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)}>
            x
          </button>
        </div>
      )}

      <div className="admin-tabbar" role="tablist" aria-label="Sales sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {canManageShops && activeTab === "shops" && (
        <Panel
          title={shopForm.id ? "Edit Shop" : "Admin Shop Setup"}
          subtitle="Create and maintain active shops. Super admin can softly delete a shop without losing history."
        >
          <div className="admin-form-grid">
            <Field label="Shop Name">
              <input
                value={shopForm.customerName}
                onChange={(event) =>
                  updateShopField("customerName", event.target.value)
                }
              />
            </Field>

            <Field label="Shop Category">
              <input
                list="shop-categories"
                value={shopForm.shopCategory}
                onChange={(event) =>
                  updateShopField("shopCategory", event.target.value)
                }
              />
              <datalist id="shop-categories">
                <option value="Vegetable Shop" />
                <option value="Supermarket" />
                <option value="Hotel" />
                <option value="Restaurant" />
              </datalist>
            </Field>

            <Field label="Products" span="full">
              <div className="admin-multiselect">
                <div className="admin-chip-row">
                  {shopProductOptions.map((productName) => (
                    <button
                      key={productName}
                      className={`admin-chip ${
                        shopForm.products.includes(productName)
                          ? "is-selected"
                          : ""
                      }`}
                      type="button"
                      onClick={() => toggleShopProduct(productName)}
                    >
                      {productName}
                    </button>
                  ))}
                </div>

                <div className="admin-custom-entry">
                  <input
                    value={customProductName}
                    onChange={(event) => setCustomProductName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomProduct();
                      }
                    }}
                    placeholder="Add custom product"
                  />
                  <button
                    className="admin-button admin-button-secondary"
                    type="button"
                    onClick={addCustomProduct}
                  >
                    Add
                  </button>
                </div>

                <div className="admin-selected-chips">
                  {shopForm.products.length === 0 && (
                    <span>No products selected</span>
                  )}
                  {shopForm.products.map((productName) => (
                    <span className="admin-selected-chip" key={productName}>
                      {productName}
                      <button
                        type="button"
                        onClick={() => toggleShopProduct(productName)}
                        aria-label={`Remove ${productName}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Location">
              <input
                value={shopForm.location}
                onChange={(event) =>
                  updateShopField("location", event.target.value)
                }
              />
            </Field>

            <Field label="Minimum Boxes / Day">
              <input
                type="number"
                value={shopForm.minimumBoxesPerDay}
                onChange={(event) =>
                  updateShopField("minimumBoxesPerDay", event.target.value)
                }
              />
            </Field>

            <Field label="Returned Boxes / Day">
              <input
                type="number"
                value={shopForm.dailyReturnedBoxes}
                onChange={(event) =>
                  updateShopField("dailyReturnedBoxes", event.target.value)
                }
              />
            </Field>

            <Field label="Box Price">
              <input
                type="number"
                value={shopForm.defaultBoxPrice}
                onChange={(event) =>
                  updateShopField("defaultBoxPrice", event.target.value)
                }
              />
            </Field>

            <Field label="Shopkeeper Selling Price">
              <input
                type="number"
                value={shopForm.shopkeeperSellingPrice}
                onChange={(event) =>
                  updateShopField("shopkeeperSellingPrice", event.target.value)
                }
              />
            </Field>

            <Field label="Exchange Type">
              <select
                value={shopForm.exchangeType}
                onChange={(event) =>
                  updateShopField("exchangeType", event.target.value)
                }
              >
                {exchangeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Contact Person">
              <input
                value={shopForm.contactPerson}
                onChange={(event) =>
                  updateShopField("contactPerson", event.target.value)
                }
              />
            </Field>

            <Field label="Phone">
              <input
                inputMode="numeric"
                maxLength={10}
                value={shopForm.phoneNumber}
                onChange={(event) =>
                  updateShopField(
                    "phoneNumber",
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
              />
            </Field>

            <Field label="Email">
              <input
                value={shopForm.email}
                onChange={(event) => updateShopField("email", event.target.value)}
              />
            </Field>

            <Field label="Address">
              <input
                value={shopForm.address}
                onChange={(event) =>
                  updateShopField("address", event.target.value)
                }
              />
            </Field>

            <button className="admin-button" type="button" onClick={saveShop}>
              <Save size={17} />
              {shopForm.id ? "Update Shop" : "Create Shop"}
            </button>
          </div>
        </Panel>
      )}

      {canCreateDelivery && activeTab === "delivery" && (
      <Panel
        title="Delivery Entry"
        subtitle="Search or select a shop; defaults fill from shop setup or the latest sale and remain editable."
      >
        <div className="sales-shop-picker">
          <Field label="Search Shop">
            <div className="admin-search-field">
              <Search size={17} />
              <input
                value={shopSearch}
                onChange={(event) => {
                  setShopSearch(event.target.value);
                  setShopSearchOpen(true);
                }}
                onFocus={() => setShopSearchOpen(true)}
                placeholder="Search by shop, location, category, person, phone"
              />
            </div>
            {shopSearchOpen && shopSearch && (
              <div className="sales-live-results">
                {filteredShops.slice(0, 6).map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => chooseSaleShop(customer)}
                  >
                    <strong>{customer.customerName}</strong>
                    <span>
                      {customer.location || "R.T. Nagar"} -{" "}
                      {customer.shopCategory || "Shop"}
                    </span>
                  </button>
                ))}
                {filteredShops.length === 0 && <span>No shops found</span>}
              </div>
            )}
          </Field>

          <Field label="Shop">
            <select
              className={saleForm.customerId ? "is-shop-selected" : ""}
              value={saleForm.customerId}
              onChange={(event) => {
                selectSaleShop(event.target.value);
                setShopSearchOpen(false);
              }}
            >
              <option value="">Select shop</option>
              {filteredShops.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName} - {customer.location || "R.T. Nagar"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {selectedShop && (
          <div className="sales-context-strip">
            <span>
              <Store size={16} />
              {selectedShop.shopCategory || "Shop"}
            </span>
            <span>{selectedShop.location || "R.T. Nagar"}</span>
            <span>Daily ref: {selectedShop.minimumBoxesPerDay ?? 0} boxes</span>
            <span>Current balance: Rs. {selectedShopBalance}</span>
            <span>Old balance paid: Rs. {amountAppliedToOldBalance}</span>
            <span>Today's bill paid: Rs. {amountAppliedToThisSale}</span>
            <span>After entry: Rs. {balanceAfterCollection}</span>
          </div>
        )}

        <div className="admin-form-grid">
          <Field label="Product">
            <select
              value={saleForm.productId}
              onChange={(event) => updateSaleField("productId", event.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Boxes">
            <input
              type="number"
              value={saleForm.quantity}
              onChange={(event) => updateSaleField("quantity", event.target.value)}
            />
          </Field>

          <Field label="Unit Price">
            <input
              type="number"
              value={saleForm.unitPrice}
              onChange={(event) => updateSaleField("unitPrice", event.target.value)}
            />
          </Field>

          <Field label="Gross Amount">
            <input value={grossAmount} readOnly />
          </Field>

          <Field label="Exchange Credit">
            <input value={exchangeCredit} readOnly />
          </Field>

          <Field label="Billable Amount">
            <input value={totalAmount} readOnly />
          </Field>

          <Field label="Amount Received Today">
            <input
              type="number"
              value={saleForm.amountCollected}
              onChange={(event) =>
                updateSaleField("amountCollected", event.target.value)
              }
            />
          </Field>

          <Field label="Pending This Sale">
            <input value={pendingForThisSale} readOnly />
          </Field>

          <Field label="Shopkeeper Selling Price">
            <input
              type="number"
              value={saleForm.shopkeeperSellingPrice}
              onChange={(event) =>
                updateSaleField("shopkeeperSellingPrice", event.target.value)
              }
            />
          </Field>

          <Field label="Exchange Type">
            <select
              value={saleForm.exchangeType}
              onChange={(event) =>
                updateSaleField("exchangeType", event.target.value)
              }
            >
              {exchangeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Exchange Boxes">
            <input
              type="number"
              value={saleForm.exchangeBoxes}
              onChange={(event) =>
                updateSaleField("exchangeBoxes", event.target.value)
              }
            />
          </Field>

          <div className="sales-exchange-note">
            1 on 1 deducts full unit price per exchange box. 2 on 1 deducts
            half unit price per exchange box.
          </div>

          <Field label="Remarks">
            <input
              value={saleForm.remarks}
              onChange={(event) => updateSaleField("remarks", event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={createSale}>
            <Save size={17} />
            Save Delivery Sale
          </button>
        </div>
      </Panel>
      )}

      {canCreateDelivery && activeTab === "allocation" && (
        <>
          <Panel
            title="Box Allocation"
            subtitle="Enter today's available boxes and map them against each shop's default daily requirement."
            actions={
              <button
                className="admin-button"
                type="button"
                onClick={downloadBoxAllocation}
                disabled={boxAllocation.length === 0}
              >
                <Download size={17} />
                Download Sheet
              </button>
            }
          >
            <div className="admin-form-grid">
              <Field label="Available Boxes">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={allocationBoxCount}
                  onChange={(event) =>
                    setAllocationBoxCount(
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                />
              </Field>
            </div>

            <div className="admin-stat-grid">
              <StatCard
                label="Available"
                value={allocationTotalBoxes}
                icon={<Boxes size={20} />}
                tone="green"
              />
              <StatCard
                label="Daily Need"
                value={allocationTotals.dailyRequirement}
                icon={<Calculator size={20} />}
                tone="blue"
              />
              <StatCard
                label="Shortage"
                value={allocationTotals.shortageBoxes}
                icon={<AlertTriangle size={20} />}
                tone="amber"
                critical={allocationTotals.shortageBoxes > 0}
              />
              <StatCard
                label="Extra"
                value={allocationTotals.surplusBoxes}
                icon={<Receipt size={20} />}
                tone="slate"
              />
            </div>
          </Panel>

          <Panel
            title="Shop Wise Allocation"
            subtitle="Sorted by highest daily requirement first."
          >
            {boxAllocation.length === 0 && (
              <EmptyState
                title="No allocation ready"
                message="Create active shops with default daily boxes to generate the list."
              />
            )}

            {boxAllocation.length > 0 && (
              <div className="sales-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Daily Need</th>
                      <th>Allocated</th>
                      <th>Shortage</th>
                      <th>Extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boxAllocation.map((allocation) => (
                      <tr key={allocation.shopId}>
                        <td>{allocation.shopName}</td>
                        <td>{allocation.category}</td>
                        <td>{allocation.location}</td>
                        <td>{allocation.dailyRequirement}</td>
                        <td>
                          <strong>{allocation.allocatedBoxes}</strong>
                        </td>
                        <td>{allocation.shortageBoxes}</td>
                        <td>{allocation.surplusBoxes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {canManageShops && activeTab === "shops" && (
        <Panel
          title="Shop Master"
          subtitle="Configured shops are editable from here."
        >
          {customers.length === 0 && (
            <EmptyState
              title="No shops yet"
              message="Create a shop above before delivery staff records sales."
            />
          )}

          {customers.length > 0 && (
            <div className="sales-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Location</th>
                    <th>Daily Boxes</th>
                    <th>Returned / Day</th>
                    <th>Box Price</th>
                    <th>Selling Price</th>
                    <th>Exchange</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.customerName}</td>
                      <td>{customer.shopCategory || "Shop"}</td>
                      <td>{formatShopProducts(customer.products)}</td>
                      <td>{customer.location || "R.T. Nagar"}</td>
                      <td>{customer.minimumBoxesPerDay ?? 0}</td>
                      <td>{customer.dailyReturnedBoxes ?? 0}</td>
                      <td>Rs. {customer.defaultBoxPrice ?? 0}</td>
                      <td>Rs. {customer.shopkeeperSellingPrice ?? 0}</td>
                      <td>{formatExchange(customer.exchangeType)}</td>
                      <td>Rs. {calculateShopBalance(sales, customer.id)}</td>
                      <td>
                        <div className="admin-row-actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          title="Edit shop"
                          onClick={() => editShop(customer)}
                        >
                          <Pencil size={16} />
                        </button>
                        {canDeleteShops && (
                          <button
                            className="admin-icon-button admin-icon-danger"
                            type="button"
                            title="Delete shop"
                            onClick={() => setShopToDelete(customer)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {canViewLedger && activeTab === "history" && (
        <Panel
          title="Shop History"
          subtitle="Select one shop to inspect lifetime amount, boxes, kg, pending amount, and paginated sale history."
        >
          <div className="sales-shop-picker">
            <Field label="Shop">
              <select
                value={selectedHistoryShopId}
                onChange={(event) => {
                  setSelectedHistoryShopId(event.target.value);
                  setHistoryPage(0);
                }}
              >
                <option value="">Select shop</option>
                {allCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName}
                    {customer.active === false ? " (deleted)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {selectedHistoryShop && (
            <>
              <div className="admin-stat-grid">
                <StatCard
                  label="Total Purchased"
                  value={`Rs. ${historyTotals.amount}`}
                  icon={<IndianRupee size={20} />}
                  tone="green"
                />
                <StatCard
                  label="Boxes"
                  value={historyTotals.boxes}
                  icon={<Receipt size={20} />}
                  tone="blue"
                />
                <StatCard
                  label="Kgs"
                  value={`${(historyTotals.boxes * 0.2).toFixed(2)} kg`}
                  icon={<Store size={20} />}
                  tone="violet"
                />
                <StatCard
                  label="Pending"
                  value={`Rs. ${historyTotals.pending}`}
                  icon={<WalletCards size={20} />}
                  tone="amber"
                />
              </div>

              <div className="sales-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Boxes</th>
                      <th>Unit</th>
                      <th>Total</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Returned</th>
                      <th>Entered By</th>
                      <th>Payment Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySalesPage.map((sale) => (
                      <tr key={sale.id}>
                        <td>{formatDate(sale.saleDate)}</td>
                        <td>{sale.quantity}</td>
                        <td>Rs. {sale.unitPrice}</td>
                        <td>Rs. {sale.totalAmount}</td>
                        <td>Rs. {sale.amountCollected ?? 0}</td>
                        <td>Rs. {salePending(sale)}</td>
                        <td>{sale.returnedBoxes ?? 0}</td>
                        <td>
                          <strong>{auditName(sale.createdByName)}</strong>
                          <span>{sale.createdByEmail || "-"}</span>
                        </td>
                        <td>
                          <strong>{auditName(sale.updatedByName)}</strong>
                          <span>{sale.updatedAt ? formatDateTime(sale.updatedAt) : "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button
                  className="admin-button admin-button-secondary"
                  type="button"
                  disabled={historyPage === 0}
                  onClick={() => setHistoryPage((page) => page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {historyPage + 1} of{" "}
                  {Math.max(1, Math.ceil(selectedHistorySales.length / historyPageSize))}
                </span>
                <button
                  className="admin-button admin-button-secondary"
                  type="button"
                  disabled={
                    historyPage + 1 >=
                    Math.ceil(selectedHistorySales.length / historyPageSize)
                  }
                  onClick={() => setHistoryPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {!selectedHistoryShop && (
            <EmptyState
              title="Choose a shop"
              message="Shop-wise audit details will appear here."
            />
          )}
        </Panel>
      )}

      {canViewLedger && activeTab === "ledger" && (
      <Panel
        title="Sales Ledger"
        subtitle="Delivery, collection, pending balance, resale price, and exchange details."
      >
        {sales.length === 0 && (
          <EmptyState
            title="No sales yet"
            message="Create a delivery sale above to start the ledger."
          />
        )}

        {sales.length > 0 && (
          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shop</th>
                  <th>Boxes</th>
                  <th>Unit</th>
                  <th>Total</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Selling Price</th>
                  <th>Exchange</th>
                  <th>Returned</th>
                  <th>Status</th>
                  <th>Entered By</th>
                  <th>Last Updated By</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{formatDate(sale.saleDate)}</td>
                    <td>
                      <strong>{sale.customerName}</strong>
                      <span>
                        {sale.location || "R.T. Nagar"} -{" "}
                        {sale.shopCategory || sale.productName}
                      </span>
                    </td>
                    <td>{sale.quantity}</td>
                    <td>Rs. {sale.unitPrice}</td>
                    <td>Rs. {sale.totalAmount}</td>
                    <td>Rs. {sale.amountCollected ?? 0}</td>
                    <td>Rs. {salePending(sale)}</td>
                    <td>Rs. {sale.shopkeeperSellingPrice ?? 0}</td>
                    <td>
                      {formatExchange(sale.exchangeType)}
                      {Number(sale.exchangeBoxes) > 0
                        ? ` (${sale.exchangeBoxes})`
                        : ""}
                    </td>
                    <td>{sale.returnedBoxes ?? 0}</td>
                    <td>
                      <StatusPill status={sale.paymentStatus} />
                    </td>
                    <td>
                      <strong>{auditName(sale.createdByName)}</strong>
                      <span>{sale.createdByEmail || "-"}</span>
                    </td>
                    <td>
                      <strong>{auditName(sale.updatedByName)}</strong>
                      <span>
                        {sale.updatedAt
                          ? `${formatDateTime(sale.updatedAt)} - ${sale.updatedByEmail || "-"}`
                          : "-"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => openPaymentEditor(sale)}
                        disabled={salePending(sale) <= 0}
                        title={
                          salePending(sale) <= 0
                            ? "This sale is already fully paid"
                            : "Edit payment"
                        }
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      )}

      {paymentSale && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal sales-payment-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon sales-payment-icon">
              <WalletCards size={22} />
            </div>
            <div>
              <h2>Update payment</h2>
              <p>
                Record collection for <strong>{paymentSale.customerName}</strong>.
                This will update the ledger status, shop balance, dashboard
                balance, and audit trail.
              </p>
            </div>

            <div className="sales-payment-summary">
              <span>
                <small>Total</small>
                <strong>Rs. {paymentSale.totalAmount ?? 0}</strong>
              </span>
              <span>
                <small>Collected</small>
                <strong>Rs. {paymentSale.amountCollected ?? 0}</strong>
              </span>
              <span>
                <small>Pending</small>
                <strong>Rs. {salePending(paymentSale)}</strong>
              </span>
            </div>

            <div className="admin-form-grid">
              <Field label="Amount Received Now">
                <input
                  type="number"
                  min="0"
                  max={salePending(paymentSale)}
                  value={paymentReceived}
                  onChange={(event) => setPaymentReceived(event.target.value)}
                />
              </Field>
              <Field label="Remarks">
                <input
                  value={paymentRemarks}
                  onChange={(event) => setPaymentRemarks(event.target.value)}
                  placeholder="Optional payment note"
                />
              </Field>
            </div>

            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={closePaymentEditor}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => savePayment(true)}
              >
                Mark Paid
              </button>
              <button
                className="admin-button"
                type="button"
                onClick={() => savePayment(false)}
              >
                <WalletCards size={16} />
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {shopToDelete && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2>Delete this shop?</h2>
              <p>
                This will soft delete{" "}
                <strong>{shopToDelete.customerName}</strong>. It will no longer
                appear in delivery entry or shop master, but its sales and audit
                history will remain available.
              </p>
            </div>
            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => setShopToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-danger"
                type="button"
                onClick={deleteShop}
              >
                Delete Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function latestSaleForShop(sales: any[], customerId: number) {
  return sales.find((sale) => Number(sale.customerId) === customerId);
}

function salePending(sale: any) {
  if (sale.pendingAmount !== null && sale.pendingAmount !== undefined) {
    return Number(sale.pendingAmount) || 0;
  }

  return (Number(sale.totalAmount) || 0) - (Number(sale.amountCollected) || 0);
}

function calculateShopBalance(sales: any[], customerId: number) {
  return sales
    .filter((sale) => Number(sale.customerId) === Number(customerId))
    .reduce((total, sale) => total + salePending(sale), 0);
}

function calculateExchangeCredit(
  exchangeType: string,
  exchangeBoxes: number,
  unitPrice: number,
) {
  if (exchangeBoxes <= 0 || unitPrice <= 0) {
    return 0;
  }

  if (exchangeType === "ONE_ON_ONE") {
    return exchangeBoxes * unitPrice;
  }

  if (exchangeType === "TWO_ON_ONE") {
    return exchangeBoxes * unitPrice * 0.5;
  }

  return 0;
}

function buildBoxAllocation(shops: any[], totalBoxes: number): BoxAllocation[] {
  const plannedShops = shops
    .map((shop) => ({
      shopId: shop.id,
      shopName: shop.customerName || "Shop",
      category: shop.shopCategory || "Shop",
      location: shop.location || "R.T. Nagar",
      dailyRequirement: Math.max(
        0,
        Math.floor(Number(shop.minimumBoxesPerDay) || 0),
      ),
    }))
    .filter((shop) => shop.dailyRequirement > 0)
    .sort((first, second) => {
      if (second.dailyRequirement !== first.dailyRequirement) {
        return second.dailyRequirement - first.dailyRequirement;
      }

      return first.shopName.localeCompare(second.shopName);
    });

  if (plannedShops.length === 0) {
    return [];
  }

  const availableBoxes = Math.max(0, Math.floor(totalBoxes) || 0);
  const dailyRequirement = plannedShops.reduce(
    (total, shop) => total + shop.dailyRequirement,
    0,
  );
  const allocations = plannedShops.map((shop) => ({
    ...shop,
    allocatedBoxes: 0,
  }));

  if (availableBoxes < dailyRequirement) {
    const proportionalRows = allocations
      .map((shop, index) => {
        const exactShare =
          dailyRequirement > 0
            ? (availableBoxes * shop.dailyRequirement) / dailyRequirement
            : 0;

        return {
          index,
          remainder: exactShare - Math.floor(exactShare),
          requirement: shop.dailyRequirement,
          allocatedBoxes: Math.floor(exactShare),
        };
      })
      .sort((first, second) => {
        if (second.remainder !== first.remainder) {
          return second.remainder - first.remainder;
        }

        return second.requirement - first.requirement;
      });
    let remainingBoxes =
      availableBoxes -
      proportionalRows.reduce((total, row) => total + row.allocatedBoxes, 0);

    proportionalRows.forEach((row) => {
      allocations[row.index].allocatedBoxes = row.allocatedBoxes;
    });
    proportionalRows.forEach((row) => {
      if (remainingBoxes <= 0) {
        return;
      }

      allocations[row.index].allocatedBoxes += 1;
      remainingBoxes -= 1;
    });
  } else {
    allocations.forEach((shop) => {
      shop.allocatedBoxes = shop.dailyRequirement;
    });

    let extraBoxes = availableBoxes - dailyRequirement;
    let cursor = 0;

    while (extraBoxes > 0) {
      allocations[cursor % allocations.length].allocatedBoxes += 1;
      extraBoxes -= 1;
      cursor += 1;
    }
  }

  return allocations.map((shop) => ({
    shopId: shop.shopId,
    shopName: shop.shopName,
    category: shop.category,
    location: shop.location,
    dailyRequirement: shop.dailyRequirement,
    allocatedBoxes: shop.allocatedBoxes,
    shortageBoxes: Math.max(0, shop.dailyRequirement - shop.allocatedBoxes),
    surplusBoxes: Math.max(0, shop.allocatedBoxes - shop.dailyRequirement),
  }));
}

function formatExchange(value?: string) {
  return exchangeTypes.find((type) => type.value === value)?.label || "None";
}

function normalizeShopProducts(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value
      .map((product) => String(product || "").trim())
      .filter(Boolean)
      .filter(
        (product, index, products) =>
          products.findIndex(
            (item) => item.toLowerCase() === product.toLowerCase(),
          ) === index,
      );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((product) => product.trim())
      .filter(Boolean);
  }

  return [];
}

function formatShopProducts(value?: string[] | string) {
  const products = normalizeShopProducts(value);

  return products.length ? products.join(", ") : "-";
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-IN");
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN");
}

function auditName(value?: string) {
  return value && value !== "SYSTEM" ? value : "System";
}
