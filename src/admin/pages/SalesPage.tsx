import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  AlertTriangle,
  Boxes,
  Calculator,
  Copy,
  IndianRupee,
  MapPinned,
  Pencil,
  Receipt,
  Route,
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
import { getStoredRoles } from "../../routes/authSession";
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

const ownerOptions = [
  "Santhosh",
  "Partner 1",
  "Partner 2",
  "Partner 3",
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
  productName: "",
  quantity: "",
  unitPrice: "",
  shopkeeperSellingPrice: "",
  amountCollected: "",
  collectorUserId: "",
  collectorName: "",
  collectorEmail: "",
  deliveryDate: "",
  exchangeType: "NONE",
  exchangeBoxes: "0",
  returnedBoxes: "0",
  remarks: "",
};

const emptyHandoverForm = {
  id: "",
  collectorUserId: "",
  collectorName: "",
  collectorEmail: "",
  ownerName: "",
  amount: "",
  remarks: "",
};

type ShopForm = typeof emptyShopForm;
type SaleForm = typeof emptySaleForm;
type SaleEditForm = typeof emptySaleForm;
type HandoverForm = typeof emptyHandoverForm;
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
type RoutePlan = {
  id: number;
  label: string;
  shops: BoxAllocation[];
  totalBoxes: number;
  totalStops: number;
  locations: string[];
  mapsUrl: string;
};
type BannerState = {
  tone: "success" | "error";
  message: string;
} | null;
type ShopFieldErrors = Partial<Record<keyof ShopForm, string>>;
type SaleFieldErrors = Partial<Record<keyof SaleForm, string>>;

const deliverySuccessMessages = [
  "Nice. One delivery down. Keep the route hot and the next shop smiling.",
  "Saved. Strong pace today. Next stop, next win.",
  "Great drop. The day is moving, and so are you.",
  "Delivery locked. Fresh boxes out, momentum up.",
  "Good work. Clean entry, clear route, next order waiting."
];

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function apiValidationMessage(error: any, fallback: string) {
  const data = error?.response?.data?.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const firstError = Object.values(data).find(Boolean);

    if (firstError) {
      return String(firstError);
    }
  }

  return error?.response?.data?.message || fallback;
}

export default function SalesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [cashLedger, setCashLedger] = useState<any>({
    summaries: [],
    handovers: [],
  });
  const [allCustomersLoaded, setAllCustomersLoaded] = useState(false);
  const [cashLedgerLoaded, setCashLedgerLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [shopSearch, setShopSearch] = useState("");
  const [shopSearchOpen, setShopSearchOpen] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [activeTab, setActiveTab] = useState("delivery");
  const [selectedHistoryShopId, setSelectedHistoryShopId] = useState("");
  const [deliverySalesShopId, setDeliverySalesShopId] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [shopToDelete, setShopToDelete] = useState<any>(null);
  const [paymentSale, setPaymentSale] = useState<any>(null);
  const [paymentReceived, setPaymentReceived] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [pendingAmountFill, setPendingAmountFill] = useState<{
    label: string;
    amount: number;
  } | null>(null);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [saleEditForm, setSaleEditForm] =
    useState<SaleEditForm>(emptySaleForm);
  const [savingSaleEdit, setSavingSaleEdit] = useState(false);
  const [allocationBoxCount, setAllocationBoxCount] = useState("100");
  const [routeEmployeeCount, setRouteEmployeeCount] = useState("2");
  const [routeOrigin, setRouteOrigin] = useState("Samaksh Farms, Bengaluru");
  const [routeBalanceBoxes, setRouteBalanceBoxes] = useState(true);
  const [routeGroupLocation, setRouteGroupLocation] = useState(true);
  const [routeReduceBacktracking, setRouteReduceBacktracking] = useState(true);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [deletingShop, setDeletingShop] = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [shopForm, setShopForm] = useState<ShopForm>(emptyShopForm);
  const [saleForm, setSaleForm] = useState<SaleForm>(emptySaleForm);
  const [handoverForm, setHandoverForm] =
    useState<HandoverForm>(emptyHandoverForm);
  const [banner, setBanner] = useState<BannerState>(null);
  const [shopFieldErrors, setShopFieldErrors] = useState<ShopFieldErrors>({});
  const [saleFieldErrors, setSaleFieldErrors] = useState<SaleFieldErrors>({});
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const shopFormRef = useRef<HTMLDivElement | null>(null);
  const shopNameInputRef = useRef<HTMLInputElement | null>(null);
  const deliveryFocusRef = useRef<HTMLDivElement | null>(null);
  const deliveryEntryFormRef = useRef<HTMLDivElement | null>(null);
  const deliveryShopSalesRef = useRef<HTMLDivElement | null>(null);
  const amountReceivedInputRef = useRef<HTMLInputElement | null>(null);
  const savingSaleEditRef = useRef(false);
  const suppressDeliveryDraftAutofillRef = useRef(false);

  const roles = useMemo(() => getStoredRoles(), []);
  const hasRole = (...allowedRoles: string[]) =>
    roles.some((userRole) => allowedRoles.includes(userRole));
  const hasPermission = (permission: string) =>
    hasRole("SUPER_ADMIN") || permissions.includes(permission);
  const isSalesAdmin = hasRole("SALES_ADMIN");
  const isSalesEmployee = hasRole("SALES_EMPLOYEE", "SALES_USER");
  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const canManageShops =
    isSalesAdmin || isSalesEmployee || hasPermission("sales.manage_shops");
  const canViewLedger = isSalesAdmin || hasPermission("sales.view_ledger");
  const canCreateDelivery =
    isSalesAdmin || isSalesEmployee || hasPermission("sales.create_delivery");
  const canDeleteShops = hasRole("SUPER_ADMIN", "SALES_ADMIN");

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (!banner) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBanner(null);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [banner]);

  const loadBaseData = async () => {
    try {
      const [
        customerResponse,
        productResponse,
        salesResponse,
        entitlementResponse,
      ] = await Promise.all([
        api.get("/api/customers?size=1000"),
        api.get("/api/products"),
        api.get("/api/sales", {
          params: {
            size: 1000,
            refresh: Date.now(),
          },
        }),
        api.get("/api/entitlements/me"),
      ]);

      const activeCustomers = customerResponse?.data?.data?.content || [];
      setCustomers(activeCustomers);
      setAllCustomers((current) =>
        allCustomersLoaded || current.length > 0 ? current : activeCustomers,
      );
      setProducts(productResponse.data.data || []);
      setSales(salesResponse?.data?.data?.content || []);
      setPermissions(entitlementResponse?.data?.data?.permissions || []);
      setPaymentSale(null);
      setPaymentReceived("");
      setPaymentRemarks("");
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to load sales setup data. Please refresh or check access.",
      });
    }
  };

  const loadAllCustomers = async (force = false) => {
    if (allCustomersLoaded && !force) {
      return;
    }

    try {
      const response = await api.get("/api/customers?size=1000&includeInactive=true");
      setAllCustomers(response?.data?.data?.content || []);
      setAllCustomersLoaded(true);
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to load full shop list.",
      });
    }
  };

  const loadUsers = async (force = false) => {
    if (!isSuperAdmin || (usersLoaded && !force)) {
      return;
    }

    try {
      const response = await api.get("/api/users");
      setUsers(response?.data?.data || []);
      setUsersLoaded(true);
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to load employee list.",
      });
    }
  };

  const loadCashLedger = async (force = false) => {
    if (cashLedgerLoaded && !force) {
      return;
    }

    try {
      const response = await api.get("/api/cash-handovers");
      setCashLedger(response?.data?.data || {
        summaries: [],
        handovers: [],
      });
      setCashLedgerLoaded(true);
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to load collections data.",
      });
    }
  };

  const refreshSalesData = async () => {
    await Promise.all([
      loadBaseData(),
      allCustomersLoaded ? loadAllCustomers(true) : Promise.resolve(),
      cashLedgerLoaded ? loadCashLedger(true) : Promise.resolve(),
      usersLoaded ? loadUsers(true) : Promise.resolve(),
    ]);
  };

  const applySavedSale = (savedSale: any) => {
    if (!savedSale?.id) {
      return;
    }

    setSales((current) => {
      const exists = current.some(
        (sale) => String(sale.id) === String(savedSale.id),
      );

      if (!exists) {
        return [savedSale, ...current];
      }

      return current.map((sale) =>
        String(sale.id) === String(savedSale.id) ? savedSale : sale,
      );
    });
  };

  const selectedShop = useMemo(
    () =>
      customers.find(
        (customer) => String(customer.id) === String(saleForm.customerId),
      ),
    [customers, saleForm.customerId],
  );
  const activeProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products],
  );
  const activeUsers = useMemo(
    () => users.filter((user) => user.active !== false),
    [users],
  );
  const collectorUsers = useMemo(
    () => activeUsers.filter((user) => !isBootstrapAdminUser(user)),
    [activeUsers],
  );
  const deliveryProductOptions = useMemo(
    () => buildDeliveryProductOptions(selectedShop, activeProducts),
    [activeProducts, selectedShop],
  );

  useEffect(() => {
    if (suppressDeliveryDraftAutofillRef.current) {
      suppressDeliveryDraftAutofillRef.current = false;
      return;
    }

    if (saleForm.productId || saleForm.productName || deliveryProductOptions.length === 0) {
      return;
    }

    const defaultProduct = deliveryProductOptions[0];

    setSaleForm((current) => ({
      ...current,
      productId: defaultProduct.id ? String(defaultProduct.id) : "",
      productName: defaultProduct.productName,
      unitPrice:
        current.unitPrice || String(defaultProduct.standardPrice ?? "50"),
    }));
  }, [
    deliveryProductOptions,
    saleForm.productId,
    saleForm.productName,
  ]);

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
  const moneyToCollectToday = selectedShopBalance + totalAmount;

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
  const deliverySalesShop = allCustomers.find(
    (customer) => String(customer.id) === String(deliverySalesShopId),
  );
  const deliveryShopSales = sales
    .filter((sale) => String(sale.customerId) === String(deliverySalesShopId))
    .slice(0, 5);
  const saleEditShop = allCustomers.find(
    (customer) => String(customer.id) === String(saleEditForm.customerId),
  );
  const saleEditProductOptions = useMemo(
    () => buildDeliveryProductOptions(saleEditShop, activeProducts),
    [activeProducts, saleEditShop],
  );
  const saleEditGrossAmount =
    (Number(saleEditForm.quantity) || 0) *
    (Number(saleEditForm.unitPrice) || 0);
  const saleEditExchangeCredit = calculateExchangeCredit(
    saleEditForm.exchangeType,
    Number(saleEditForm.exchangeBoxes) || 0,
    Number(saleEditForm.unitPrice) || 0,
  );
  const saleEditBillableAmount = Math.max(
    0,
    saleEditGrossAmount - saleEditExchangeCredit,
  );
  const saleEditPendingAmount = Math.max(
    0,
    saleEditBillableAmount - (Number(saleEditForm.amountCollected) || 0),
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
  const routePlans = useMemo(
    () =>
      buildRoutePlans({
        allocations: boxAllocation,
        employeeCount: Math.max(1, Math.floor(Number(routeEmployeeCount) || 1)),
        origin: routeOrigin,
        balanceBoxes: routeBalanceBoxes,
        groupLocation: routeGroupLocation,
        reduceBacktracking: routeReduceBacktracking,
      }),
    [
      boxAllocation,
      routeBalanceBoxes,
      routeEmployeeCount,
      routeGroupLocation,
      routeOrigin,
      routeReduceBacktracking,
    ],
  );

  const tabs = useMemo(
    () =>
      [
        canCreateDelivery && { id: "delivery", label: "Delivery Entry" },
        canCreateDelivery && { id: "allocation", label: "Box Allocation" },
        canManageShops && { id: "shops", label: "Shop Setup" },
        canViewLedger && { id: "collections", label: "Collections" },
        canViewLedger && { id: "ledger", label: "Sales Ledger" },
        canViewLedger && { id: "history", label: "Shop History" },
      ].filter(Boolean) as { id: string; label: string }[],
    [canCreateDelivery, canManageShops, canViewLedger],
  );

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    if (activeTab === "collections") {
      loadCashLedger();
    }

    if (activeTab === "history" || activeTab === "ledger") {
      loadAllCustomers();
    }

    if (isSuperAdmin && ["delivery", "collections", "history", "ledger"].includes(activeTab)) {
      loadUsers();
    }
  }, [activeTab, isSuperAdmin]);

  const updateShopField = (
    field: keyof ShopForm,
    value: string | boolean | string[],
  ) => {
    setShopForm((current) => ({
      ...current,
      [field]: value,
    }));
    setShopFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
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
    setSaleFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateSaleProduct = (productName: string) => {
    const normalizedName = normalizedProductName(productName);
    const product = deliveryProductOptions.find(
      (item) => normalizedProductName(item.productName) === normalizedName,
    );

    setSaleForm((current) => ({
      ...current,
      productId: product?.id ? String(product.id) : "",
      productName,
      unitPrice:
        product?.standardPrice !== null &&
        product?.standardPrice !== undefined
          ? String(product.standardPrice)
          : current.unitPrice,
    }));
    setSaleFieldErrors((current) => {
      if (!current.productId && !current.productName) {
        return current;
      }

      const next = { ...current };
      delete next.productId;
      delete next.productName;
      return next;
    });
  };

  const updateSaleEditField = (field: keyof SaleEditForm, value: string) => {
    setSaleEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateSaleEditProduct = (productName: string) => {
    const normalizedName = normalizedProductName(productName);
    const editShop = allCustomers.find(
      (customer) => String(customer.id) === String(saleEditForm.customerId),
    );
    const productOptions = buildDeliveryProductOptions(editShop, activeProducts);
    const product = productOptions.find(
      (item) => normalizedProductName(item.productName) === normalizedName,
    );

    setSaleEditForm((current) => ({
      ...current,
      productId: product?.id ? String(product.id) : "",
      productName,
      unitPrice:
        product?.standardPrice !== null &&
        product?.standardPrice !== undefined
          ? String(product.standardPrice)
          : current.unitPrice,
    }));
  };

  const showBanner = (nextBanner: Exclude<BannerState, null>) => {
    setBanner(nextBanner);
  };

  const deliverySuccessMessage = () =>
    deliverySuccessMessages[
      Math.floor(Math.random() * deliverySuccessMessages.length)
    ];

  const validateShopForm = () => {
    const errors: ShopFieldErrors = {};

    if (!shopForm.customerName.trim()) {
      errors.customerName = "Shop name is required";
    }

    if (!shopForm.shopCategory.trim()) {
      errors.shopCategory = "Shop category is required";
    }

    if (!shopForm.location.trim()) {
      errors.location = "Location is required";
    }

    if (Number(shopForm.minimumBoxesPerDay) < 0) {
      errors.minimumBoxesPerDay = "Minimum boxes cannot be negative";
    }

    if (Number(shopForm.defaultBoxPrice) < 0) {
      errors.defaultBoxPrice = "Box price cannot be negative";
    }

    if (Number(shopForm.dailyReturnedBoxes) < 0) {
      errors.dailyReturnedBoxes = "Returned boxes cannot be negative";
    }

    if (Number(shopForm.shopkeeperSellingPrice) < 0) {
      errors.shopkeeperSellingPrice = "Selling price cannot be negative";
    }

    if (
      shopForm.phoneNumber.trim() &&
      !/^[0-9]{10}$/.test(shopForm.phoneNumber.trim())
    ) {
      errors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (
      shopForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shopForm.email.trim())
    ) {
      errors.email = "Enter a valid email address";
    }

    return errors;
  };

  const validateSaleForm = (
    form: SaleForm,
    productOptions: any[],
  ) => {
    const errors: SaleFieldErrors = {};

    if (!form.customerId) {
      errors.customerId = "Shop is required";
    }

    if (!form.productId && !form.productName.trim()) {
      errors.productId =
        productOptions.length === 0
          ? "Choose a shop product or enter the product manually"
          : "Product is required";
    }

    if ((Number(form.quantity) || 0) <= 0) {
      errors.quantity = "Boxes must be greater than 0";
    }

    if ((Number(form.unitPrice) || 0) < 0) {
      errors.unitPrice = "Unit price cannot be negative";
    }

    if ((Number(form.amountCollected) || 0) < 0) {
      errors.amountCollected = "Collected amount cannot be negative";
    }

    if ((Number(form.shopkeeperSellingPrice) || 0) < 0) {
      errors.shopkeeperSellingPrice =
        "Shopkeeper selling price cannot be negative";
    }

    if ((Number(form.exchangeBoxes) || 0) < 0) {
      errors.exchangeBoxes = "Exchange boxes cannot be negative";
    }

    if ((Number(form.returnedBoxes) || 0) < 0) {
      errors.returnedBoxes = "Returned boxes cannot be negative";
    }

    return errors;
  };

  const editShop = (customer: any) => {
    const customerId = String(customer.id || "");

    setEditingShopId(customerId);
    setShopFieldErrors({});
    setActiveTab("shops");
    setShopForm({
      id: customerId,
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
    showBanner({
      tone: "success",
      message: `${customer.customerName || "Shop"} loaded for editing.`,
    });
    window.setTimeout(() => {
      shopFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      shopNameInputRef.current?.focus();
      setEditingShopId(null);
    }, 0);
  };

  const saveShop = async () => {
    try {
      const validationErrors = validateShopForm();

      if (Object.keys(validationErrors).length > 0) {
        setShopFieldErrors(validationErrors);
        showBanner({
          tone: "error",
          message: "Please fix the highlighted shop setup fields.",
        });
        return;
      }

      const payload = {
        customerName: shopForm.customerName.trim(),
        contactPerson: optionalText(shopForm.contactPerson),
        phoneNumber: optionalText(shopForm.phoneNumber),
        email: optionalText(shopForm.email),
        address: optionalText(shopForm.address),
        location: optionalText(shopForm.location),
        shopCategory: shopForm.shopCategory.trim(),
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
        showBanner({
          tone: "success",
          message: "Shop updated successfully.",
        });
      } else {
        await api.post("/api/customers", payload);
        showBanner({
          tone: "success",
          message: "Shop created successfully.",
        });
      }

      setShopForm(emptyShopForm);
      setShopFieldErrors({});
      await refreshSalesData();
    } catch (error: any) {
      console.error(error);
      const backendErrors = error?.response?.data?.data;

      if (
        backendErrors &&
        typeof backendErrors === "object" &&
        !Array.isArray(backendErrors)
      ) {
        setShopFieldErrors((current) => ({
          ...current,
          ...(backendErrors as ShopFieldErrors),
        }));
      }

      showBanner({
        tone: "error",
        message: apiValidationMessage(error, "Failed to save shop."),
      });
    }
  };

  const deleteShop = async () => {
    if (!shopToDelete || deletingShop) {
      return;
    }

    try {
      setDeletingShop(true);
      const shopName = shopToDelete.customerName;
      await api.delete(`/api/customers/${shopToDelete.id}`);
      setShopToDelete(null);
      if (String(shopForm.id) === String(shopToDelete.id)) {
        setShopForm(emptyShopForm);
      }
      showBanner({
        tone: "success",
        message: `${shopName} deleted successfully.`,
      });
      await refreshSalesData();
    } catch (error: any) {
      console.error(error);
      setShopToDelete(null);
      showBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to delete shop.",
      });
    } finally {
      setDeletingShop(false);
    }
  };

  const selectSaleShop = (customerId: string) => {
    const shop = customers.find(
      (customer) => String(customer.id) === String(customerId),
    );
    const latestSale = latestSaleForShop(sales, Number(customerId));
    const shopDefaultProduct = productForShop(shop, activeProducts);
    const shopProductName = shopDefaultProduct
      ? shopDefaultProduct.productName
      : normalizeShopProducts(shop?.products)[0] || "";
    const selectedProduct = latestSale?.productId
      ? activeProducts.find(
          (product) => String(product.id) === String(latestSale.productId),
        )
      : shopDefaultProduct || activeProducts[0];

    setDeliverySalesShopId(customerId);
    setSaleForm((current) => ({
      ...current,
      customerId,
      productId:
        String(
          latestSale?.productId ||
            shopDefaultProduct?.id ||
            activeProducts[0]?.id ||
            "",
        ),
      productName:
        shopProductName ||
        latestSale?.productName ||
        activeProducts[0]?.productName ||
        "",
      quantity: String(
        shop?.minimumBoxesPerDay ?? latestSale?.quantity ?? current.quantity,
      ),
      unitPrice: String(
        shop?.defaultBoxPrice ??
          selectedProduct?.standardPrice ??
          latestSale?.unitPrice ??
          "50",
      ),
      shopkeeperSellingPrice: String(
        shop?.shopkeeperSellingPrice ??
          latestSale?.shopkeeperSellingPrice ??
          "60",
      ),
      exchangeType: latestSale?.exchangeType || shop?.exchangeType || "NONE",
      exchangeBoxes: "0",
      returnedBoxes: "0",
      amountCollected: "",
      collectorUserId: current.collectorUserId,
      collectorName: current.collectorName,
      collectorEmail: current.collectorEmail,
      remarks: "",
    }));

    window.setTimeout(() => {
      (deliveryFocusRef.current || deliveryEntryFormRef.current)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const updateSaleCollector = (userId: string) => {
    const selectedUser = collectorUsers.find(
      (user) => String(user.id) === String(userId),
    );

    setSaleForm((current) => ({
      ...current,
      collectorUserId: userId,
      collectorName: selectedUser?.name || "",
      collectorEmail: selectedUser?.email || "",
    }));
  };

  const confirmAmountFill = (label: string, amount: number) => {
    setPendingAmountFill({
      label,
      amount: Math.max(0, Math.round(Number(amount) || 0)),
    });
  };

  const applyPendingAmountFill = () => {
    if (!pendingAmountFill) {
      return;
    }

    updateSaleField("amountCollected", String(pendingAmountFill.amount));
    setPendingAmountFill(null);

    window.setTimeout(() => {
      amountReceivedInputRef.current?.focus();
      amountReceivedInputRef.current?.select();
    }, 60);
  };

  const chooseSaleShop = (customer: any) => {
    selectSaleShop(String(customer.id));
    setShopSearch(customer.customerName || "");
    setShopSearchOpen(false);
  };

  const createSale = async () => {
    try {
      const savedShopId = saleForm.customerId;
      const validationErrors = validateSaleForm(
        saleForm,
        deliveryProductOptions,
      );

      if (Object.keys(validationErrors).length > 0) {
        setSaleFieldErrors(validationErrors);
        showBanner({
          tone: "error",
          message: "Please fix the highlighted delivery fields.",
        });
        return;
      }

      if (amountReceivedToday > selectedShopBalance + totalAmount) {
        alert("Amount received cannot be greater than current balance plus today's bill");
        return;
      }

      await api.post("/api/sales", {
        customerId: Number(saleForm.customerId),
        productId: saleForm.productId ? Number(saleForm.productId) : null,
        productName: optionalText(saleForm.productName),
        quantity: Number(saleForm.quantity),
        unitPrice: Number(saleForm.unitPrice),
        amountCollected: Number(saleForm.amountCollected) || 0,
        ...(isSuperAdmin && saleForm.collectorUserId
          ? {
              collectorUserId: Number(saleForm.collectorUserId),
              collectorName: saleForm.collectorName,
              collectorEmail: saleForm.collectorEmail,
            }
          : {}),
        ...(isSuperAdmin
          ? {
              deliveryDate: saleForm.deliveryDate || todayDateInputValue(),
            }
          : {}),
        shopkeeperSellingPrice:
          Number(saleForm.shopkeeperSellingPrice) || undefined,
        exchangeType: saleForm.exchangeType,
        exchangeBoxes: Number(saleForm.exchangeBoxes) || 0,
        returnedBoxes: Number((saleForm as any).returnedBoxes) || 0,
        remarks: saleForm.remarks,
      });

      showBanner({
        tone: "success",
        message: deliverySuccessMessage(),
      });
      setDeliverySalesShopId(savedShopId);
      setSaleForm(emptySaleForm);
      await refreshSalesData();
      window.setTimeout(() => {
        deliveryShopSalesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to save delivery sale.",
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

  const copyRoutePlan = async (routePlan: RoutePlan) => {
    const text = routeShareText(routePlan);

    try {
      await navigator.clipboard.writeText(text);
      showBanner({
        tone: "success",
        message: `${routePlan.label} copied. Share it with the delivery employee.`,
      });
    } catch {
      showBanner({
        tone: "error",
        message: "Could not copy route. Open Google Maps and share from there.",
      });
    }
  };

  const useCurrentRouteLocation = () => {
    if (!navigator.geolocation) {
      showBanner({
        tone: "error",
        message: "Current location is not supported on this device.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRouteOrigin(
          `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`,
        );
        showBanner({
          tone: "success",
          message: "Starting point set to current location.",
        });
      },
      () => {
        showBanner({
          tone: "error",
          message: "Could not read current location. Please allow location access or type the start point.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const openRouteOriginMapSearch = () => {
    const query = mapsLocationValue(routeOrigin) || "Bengaluru";
    const params = new URLSearchParams({
      api: "1",
      query,
    });

    window.open(
      `https://www.google.com/maps/search/?${params.toString()}`,
      "_blank",
      "noreferrer",
    );
  };

  const useFarmRouteOrigin = () => {
    setRouteOrigin("Samaksh Farms, Bengaluru");
    showBanner({
      tone: "success",
      message: "Starting point set to Samaksh Farms.",
    });
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

  const openSaleEntryEditor = (sale: any) => {
    setEditingSale(sale);
    setSaleEditForm({
      customerId: String(sale.customerId || ""),
      productId: sale.productId ? String(sale.productId) : "",
      productName: sale.productName || "",
      quantity: String(sale.quantity ?? ""),
      unitPrice: String(sale.unitPrice ?? ""),
      shopkeeperSellingPrice: String(sale.shopkeeperSellingPrice ?? ""),
      amountCollected: String(sale.amountCollected ?? 0),
      collectorUserId: sale.collectorUserId ? String(sale.collectorUserId) : "",
      collectorName: sale.collectorName || "",
      collectorEmail: sale.collectorEmail || "",
      deliveryDate: dateInputValue(sale.saleDate),
      exchangeType: sale.exchangeType || "NONE",
      exchangeBoxes: String(sale.exchangeBoxes ?? 0),
      returnedBoxes: String(sale.returnedBoxes ?? 0),
      remarks: sale.remarks || "",
    });
  };

  const closeSaleEntryEditor = () => {
    setEditingSale(null);
    setSaleEditForm(emptySaleForm);
    setSavingSaleEdit(false);
    savingSaleEditRef.current = false;
  };

  const saveSaleEntryEdit = async () => {
    if (!editingSale || savingSaleEdit || savingSaleEditRef.current) {
      return;
    }

    savingSaleEditRef.current = true;
    setSavingSaleEdit(true);

    const quantity = Number(saleEditForm.quantity) || 0;
    const unitPrice = Number(saleEditForm.unitPrice) || 0;
    const exchangeBoxes = Number(saleEditForm.exchangeBoxes) || 0;
    const amountCollected = Number(saleEditForm.amountCollected) || 0;
    const exchangeCredit = calculateExchangeCredit(
      saleEditForm.exchangeType,
      exchangeBoxes,
      unitPrice,
    );
    const billableAmount = Math.max(0, quantity * unitPrice - exchangeCredit);

    if (!saleEditForm.customerId) {
      showBanner({ tone: "error", message: "Shop is required for correction." });
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
      return;
    }

    if (!saleEditForm.productName.trim()) {
      showBanner({ tone: "error", message: "Product is required for correction." });
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
      return;
    }

    if (quantity <= 0) {
      showBanner({ tone: "error", message: "Boxes must be greater than 0." });
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
      return;
    }

    if (unitPrice < 0 || amountCollected < 0 || exchangeBoxes < 0) {
      showBanner({ tone: "error", message: "Amounts and boxes cannot be negative." });
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
      return;
    }

    if (amountCollected > billableAmount) {
      showBanner({
        tone: "error",
        message: "Collected amount cannot be greater than billable amount.",
      });
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
      return;
    }

    try {
      const response = await api.put(`/api/sales/${editingSale.id}/entry`, {
        customerId: Number(saleEditForm.customerId),
        productId: saleEditForm.productId ? Number(saleEditForm.productId) : null,
        productName: optionalText(saleEditForm.productName),
        quantity,
        unitPrice,
        amountCollected,
        shopkeeperSellingPrice:
          Number(saleEditForm.shopkeeperSellingPrice) || undefined,
        exchangeType: saleEditForm.exchangeType,
        exchangeBoxes,
        returnedBoxes: Number(saleEditForm.returnedBoxes) || 0,
        deliveryDate: saleEditForm.deliveryDate || undefined,
        remarks: saleEditForm.remarks,
      });

      const savedSale = response?.data?.data;
      const shopName = editingSale.customerName;
      const correctedShopId = String(savedSale?.customerId || saleEditForm.customerId);
      applySavedSale(savedSale);
      setEditingSale(null);
      setSaleEditForm(emptySaleForm);
      setDeliverySalesShopId(correctedShopId);
      suppressDeliveryDraftAutofillRef.current = true;
      setSaleForm({
        ...emptySaleForm,
        customerId: correctedShopId,
      });
      setActiveTab("delivery");
      showBanner({
        tone: "success",
        message: `${shopName}'s delivery entry corrected successfully.`,
      });
      await refreshSalesData();
      applySavedSale(savedSale);
      window.setTimeout(() => {
        deliveryShopSalesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to correct delivery entry.",
      });
    } finally {
      savingSaleEditRef.current = false;
      setSavingSaleEdit(false);
    }
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
      showBanner({
        tone: "success",
        message: markPaid
          ? `${customerName}'s sale marked as paid.`
          : `${customerName}'s payment updated successfully.`,
      });
      await refreshSalesData();
    } catch (error: any) {
      console.error(error);
      closePaymentEditor();
      showBanner({
        tone: "error",
        message: error?.response?.data?.message || "Failed to update payment.",
      });
    }
  };

  const startCashHandover = (summary: any) => {
    setHandoverForm({
      ...emptyHandoverForm,
      collectorUserId: summary.collectorUserId
        ? String(summary.collectorUserId)
        : "",
      collectorName: summary.collectorName || "",
      collectorEmail: summary.collectorEmail || "",
      amount:
        Number(summary.balanceWithUser) > 0
          ? String(summary.balanceWithUser)
          : "",
    });
  };

  const editCashHandover = (handover: any) => {
    setHandoverForm({
      id: String(handover.id || ""),
      collectorUserId: handover.collectorUserId
        ? String(handover.collectorUserId)
        : "",
      collectorName: handover.collectorName || "",
      collectorEmail: handover.collectorEmail || "",
      ownerName: handover.ownerName || "",
      amount: String(handover.amount ?? ""),
      remarks: handover.remarks || "",
    });
  };

  const updateHandoverCollector = (userId: string) => {
    const selectedUser = collectorUsers.find(
      (user) => String(user.id) === String(userId),
    );

    setHandoverForm((current) => ({
      ...current,
      collectorUserId: userId,
      collectorName: selectedUser?.name || "",
      collectorEmail: selectedUser?.email || "",
    }));
  };

  const saveCashHandover = async () => {
    if (savingHandover) {
      return;
    }

    if (!handoverForm.collectorName.trim()) {
      showBanner({ tone: "error", message: "Collector name is required." });
      return;
    }

    if (!handoverForm.ownerName.trim()) {
      showBanner({ tone: "error", message: "Owner name is required." });
      return;
    }

    if ((Number(handoverForm.amount) || 0) <= 0) {
      showBanner({
        tone: "error",
        message: "Handover amount must be greater than 0.",
      });
      return;
    }

    const payload = {
      collectorUserId: handoverForm.collectorUserId
        ? Number(handoverForm.collectorUserId)
        : null,
      collectorName: handoverForm.collectorName.trim(),
      collectorEmail: optionalText(handoverForm.collectorEmail),
      ownerName: handoverForm.ownerName.trim(),
      amount: Number(handoverForm.amount),
      remarks: optionalText(handoverForm.remarks),
    };

    try {
      setSavingHandover(true);

      if (handoverForm.id) {
        await api.put(`/api/cash-handovers/${handoverForm.id}`, payload);
      } else {
        await api.post("/api/cash-handovers", payload);
      }

      showBanner({
        tone: "success",
        message: handoverForm.id
          ? "Cash handover updated successfully."
          : "Cash handover recorded successfully.",
      });
      setHandoverForm(emptyHandoverForm);
      await refreshSalesData();
    } catch (error: any) {
      console.error(error);
      showBanner({
        tone: "error",
        message:
          error?.response?.data?.message ||
          "Failed to save cash handover.",
      });
    } finally {
      setSavingHandover(false);
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
        <div className="admin-feedback-overlay" role="status" aria-live="polite">
          <div
            className={`admin-feedback-dialog admin-feedback-${banner.tone}`}
            ref={bannerRef}
          >
            <strong>{banner.tone === "success" ? "Success" : "Failed"}</strong>
            <span>{banner.message}</span>
            <button type="button" onClick={() => setBanner(null)}>
              Close
            </button>
          </div>
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
        <div ref={shopFormRef}>
        <Panel
          title={shopForm.id ? "Edit Shop" : "Admin Shop Setup"}
          subtitle="Create and maintain active shops. Super admin can softly delete a shop without losing history."
        >
          {shopForm.id && (
            <div className="sales-edit-context">
              <Pencil size={15} />
              Editing {shopForm.customerName || "selected shop"}. Update the
              required fields below and click Update Shop.
            </div>
          )}
          <div className="admin-form-grid">
            <Field
              label="Shop Name"
              required
              error={shopFieldErrors.customerName}
            >
              <input
                ref={shopNameInputRef}
                value={shopForm.customerName}
                onChange={(event) =>
                  updateShopField("customerName", event.target.value)
                }
              />
            </Field>

            <Field
              label="Shop Category"
              required
              error={shopFieldErrors.shopCategory}
            >
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

            <Field label="Products" span="full" optional>
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

            <Field
              label="Location"
              required
              error={shopFieldErrors.location}
            >
              <input
                value={shopForm.location}
                onChange={(event) =>
                  updateShopField("location", event.target.value)
                }
              />
            </Field>

            <Field
              label="Minimum Boxes / Day"
              required
              error={shopFieldErrors.minimumBoxesPerDay}
            >
              <input
                type="number"
                value={shopForm.minimumBoxesPerDay}
                onChange={(event) =>
                  updateShopField("minimumBoxesPerDay", event.target.value)
                }
              />
            </Field>

            <Field
              label="Returned Boxes / Day"
              optional
              error={shopFieldErrors.dailyReturnedBoxes}
            >
              <input
                type="number"
                value={shopForm.dailyReturnedBoxes}
                onChange={(event) =>
                  updateShopField("dailyReturnedBoxes", event.target.value)
                }
              />
            </Field>

            <Field
              label="Box Price"
              required
              error={shopFieldErrors.defaultBoxPrice}
            >
              <input
                type="number"
                value={shopForm.defaultBoxPrice}
                onChange={(event) =>
                  updateShopField("defaultBoxPrice", event.target.value)
                }
              />
            </Field>

            <Field
              label="Shopkeeper Selling Price"
              required
              error={shopFieldErrors.shopkeeperSellingPrice}
            >
              <input
                type="number"
                value={shopForm.shopkeeperSellingPrice}
                onChange={(event) =>
                  updateShopField("shopkeeperSellingPrice", event.target.value)
                }
              />
            </Field>

            <Field label="Exchange Type" required>
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

            <Field label="Contact Person" optional>
              <input
                value={shopForm.contactPerson}
                onChange={(event) =>
                  updateShopField("contactPerson", event.target.value)
                }
              />
            </Field>

            <Field label="Phone" optional error={shopFieldErrors.phoneNumber}>
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

            <Field label="Email" optional error={shopFieldErrors.email}>
              <input
                value={shopForm.email}
                onChange={(event) => updateShopField("email", event.target.value)}
              />
            </Field>

            <Field label="Address" optional>
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
        </div>
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

          <Field label="Shop" required error={saleFieldErrors.customerId}>
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
          <div className="sales-delivery-focus" ref={deliveryFocusRef}>
            <div className="sales-shop-identity">
              <span className="sales-shop-chip sales-shop-chip-name">
                <Store size={16} />
                {selectedShop.customerName || "Selected shop"}
              </span>
              <span className="sales-shop-chip">
                <Store size={16} />
                {selectedShop.shopCategory || "Shop"}
              </span>
              <span className="sales-shop-chip">
                {selectedShop.location || "R.T. Nagar"}
              </span>
              <span className="sales-shop-chip">
                Daily reference: {selectedShop.minimumBoxesPerDay ?? 0} boxes
              </span>
            </div>

            <div className="sales-collection-grid">
              <button
                className="sales-collection-card is-pending"
                type="button"
                onClick={() =>
                  confirmAmountFill("Amount to be paid", selectedShopBalance)
                }
              >
                <small>Amount to be paid</small>
                <strong>Rs. {selectedShopBalance}</strong>
                <span>Old pending amount before today&apos;s boxes.</span>
              </button>
              <button
                className="sales-collection-card is-collect"
                type="button"
                onClick={() =>
                  confirmAmountFill(
                    "Amount to be paid after today's boxes",
                    moneyToCollectToday,
                  )
                }
              >
                <small>Amount to be paid after today&apos;s boxes</small>
                <strong>Rs. {moneyToCollectToday}</strong>
                <span>Old pending + today&apos;s bill after exchange deduction.</span>
              </button>
            </div>
          </div>
        )}

        <div
          className="admin-form-grid delivery-entry-form"
          ref={deliveryEntryFormRef}
        >
          <Field label="Product" required error={saleFieldErrors.productId}>
            <input
              list="delivery-products"
              value={saleForm.productName}
              onChange={(event) => updateSaleProduct(event.target.value)}
              placeholder={
                deliveryProductOptions.length === 0
                  ? "Enter product"
                  : "Select or type product"
              }
            />
            <datalist id="delivery-products">
              {deliveryProductOptions.map((product) => (
                <option
                  key={optionValueForProduct(product)}
                  value={product.productName}
                />
              ))}
            </datalist>
          </Field>

          <Field label="Boxes" required error={saleFieldErrors.quantity}>
            <input
              type="number"
              value={saleForm.quantity}
              onChange={(event) => updateSaleField("quantity", event.target.value)}
            />
          </Field>

          <Field label="Unit Price" required error={saleFieldErrors.unitPrice}>
            <input
              type="number"
              value={saleForm.unitPrice}
              onChange={(event) => updateSaleField("unitPrice", event.target.value)}
            />
          </Field>

          <Field label="Gross Amount">
            <input value={grossAmount} readOnly />
          </Field>

          <Field label="Exchange Deduction">
            <input value={exchangeCredit} readOnly />
          </Field>

          <Field label="Billable Amount">
            <input value={totalAmount} readOnly />
          </Field>

          <Field label="Amount Received Today" error={saleFieldErrors.amountCollected}>
            <input
              ref={amountReceivedInputRef}
              type="number"
              value={saleForm.amountCollected}
              onChange={(event) =>
                updateSaleField("amountCollected", event.target.value)
              }
            />
          </Field>

          {isSuperAdmin && (
            <>
              <Field label="Date of Delivery" required>
                <input
                  type="date"
                  value={saleForm.deliveryDate || todayDateInputValue()}
                  onChange={(event) =>
                    updateSaleField("deliveryDate", event.target.value)
                  }
                />
              </Field>

              <Field label="Amount Received By Employee" optional>
                <select
                  value={saleForm.collectorUserId}
                  onFocus={() => loadUsers()}
                  onChange={(event) => updateSaleCollector(event.target.value)}
                >
                  <option value="">Logged-in user</option>
                  {collectorUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Pending This Sale">
            <input value={pendingForThisSale} readOnly />
          </Field>

          <Field
            label="Shopkeeper Selling Price"
            error={saleFieldErrors.shopkeeperSellingPrice}
          >
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

          <Field label="Exchange Boxes" error={saleFieldErrors.exchangeBoxes}>
            <input
              type="number"
              value={saleForm.exchangeBoxes}
              onChange={(event) =>
                updateSaleField("exchangeBoxes", event.target.value)
              }
            />
          </Field>

          <div className="sales-exchange-note">
            Exchange deduction is the credit reduced from today's bill for returned boxes.
            1 on 1 deducts full unit price per exchange box. 2 on 1 deducts half unit price.
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

        {deliverySalesShopId && (
          <div className="delivery-shop-sales" ref={deliveryShopSalesRef}>
            <div className="delivery-shop-sales-header">
              <div>
                <small>Shop sales</small>
                <strong>
                  {deliverySalesShop?.customerName || "Selected shop"}
                </strong>
              </div>
              <span>{deliveryShopSales.length} recent entries</span>
            </div>

            {deliveryShopSales.length === 0 ? (
              <div className="delivery-shop-sales-empty">
                Save this delivery to see the shop&apos;s latest sales here.
              </div>
            ) : (
              <div className="admin-table-wrapper delivery-shop-sales-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Boxes</th>
                      <th>Bill</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      {isSuperAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryShopSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{formatDate(sale.saleDate)}</td>
                        <td>{sale.productName}</td>
                        <td>{sale.quantity}</td>
                        <td>Rs. {sale.totalAmount}</td>
                        <td>Rs. {sale.amountCollected || 0}</td>
                        <td>Rs. {salePending(sale)}</td>
                        {isSuperAdmin && (
                          <td>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => openSaleEntryEditor(sale)}
                            >
                              <Pencil size={15} />
                              Edit Entry
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
            title="Route Planner"
            subtitle="Free route split using shop locations and box load. Opens final routes in Google Maps without any paid API."
          >
            <div className="route-planner-control">
              <div className="route-planner-topline">
                <Field label="Delivery Employees">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={routeEmployeeCount}
                    onChange={(event) =>
                      setRouteEmployeeCount(
                        event.target.value.replace(/[^\d]/g, ""),
                      )
                    }
                  />
                </Field>

                <div className="route-origin-control">
                  <Field label="Start From" required>
                    <div className="route-origin-input">
                      <Search size={17} />
                      <input
                        value={routeOrigin}
                        onChange={(event) => setRouteOrigin(event.target.value)}
                        placeholder="Search place, paste Google Maps link, or enter coordinates"
                      />
                    </div>
                  </Field>

                  <div className="route-origin-actions">
                    <button
                      className="admin-button admin-button-secondary"
                      type="button"
                      onClick={openRouteOriginMapSearch}
                    >
                      <MapPinned size={16} />
                      Search Map
                    </button>
                    <button
                      className="admin-button admin-button-secondary"
                      type="button"
                      onClick={useCurrentRouteLocation}
                    >
                      <MapPinned size={16} />
                      Use GPS
                    </button>
                    <button
                      className="admin-button admin-button-secondary"
                      type="button"
                      onClick={useFarmRouteOrigin}
                    >
                      <Store size={16} />
                      Farm
                    </button>
                  </div>

                  <p className="route-origin-hint">
                    Pick a pin in Google Maps, copy the share link, and paste it here. Coordinates are read automatically.
                  </p>
                </div>
              </div>

              <div className="route-option-grid" aria-label="Route split options">
                <label className="route-option-card">
                  <input
                    type="checkbox"
                    checked={routeBalanceBoxes}
                    onChange={(event) =>
                      setRouteBalanceBoxes(event.target.checked)
                    }
                  />
                  <span>
                    <strong>Balance boxes</strong>
                    <small>Keep the load fair across employees.</small>
                  </span>
                </label>
                <label className="route-option-card">
                  <input
                    type="checkbox"
                    checked={routeGroupLocation}
                    onChange={(event) =>
                      setRouteGroupLocation(event.target.checked)
                    }
                  />
                  <span>
                    <strong>Group locations</strong>
                    <small>Keep nearby shops together.</small>
                  </span>
                </label>
                <label className="route-option-card">
                  <input
                    type="checkbox"
                    checked={routeReduceBacktracking}
                    onChange={(event) =>
                      setRouteReduceBacktracking(event.target.checked)
                    }
                  />
                  <span>
                    <strong>Reduce backtracking</strong>
                    <small>Prefer stops closer to the start point.</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="admin-stat-grid">
              <StatCard
                label="Routes"
                value={routePlans.length}
                icon={<Route size={20} />}
                tone="blue"
              />
              <StatCard
                label="Stops"
                value={boxAllocation.filter((shop) => shop.allocatedBoxes > 0).length}
                icon={<MapPinned size={20} />}
                tone="green"
              />
              <StatCard
                label="Boxes Routed"
                value={routePlans.reduce((total, routePlan) => total + routePlan.totalBoxes, 0)}
                icon={<Boxes size={20} />}
                tone="amber"
              />
            </div>

            {routePlans.length === 0 && (
              <EmptyState
                title="No route ready"
                message="Add available boxes and active shop requirements to generate routes."
              />
            )}

            {routePlans.length > 0 && (
              <div className="sales-route-grid">
                {routePlans.map((routePlan) => (
                  <div className="sales-route-card" key={routePlan.id}>
                    <div className="sales-route-card-header">
                      <div>
                        <strong>{routePlan.label}</strong>
                        <span>
                          {routePlan.totalStops} stops - {routePlan.totalBoxes} boxes
                        </span>
                      </div>
                      <div className="sales-route-actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          title="Copy route"
                          onClick={() => copyRoutePlan(routePlan)}
                        >
                          <Copy size={15} />
                        </button>
                        <a
                          className="admin-action-button"
                          href={routePlan.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPinned size={15} />
                          Directions
                        </a>
                      </div>
                    </div>

                    <div className="sales-route-meta">
                      {routePlan.locations.map((location) => (
                        <span key={location}>{location}</span>
                      ))}
                    </div>

                    <ol className="sales-route-stops">
                      {routePlan.shops.map((shop) => (
                        <li key={shop.shopId}>
                          <strong>{shop.shopName}</strong>
                          <span>
                            {shop.location} - {shop.allocatedBoxes} boxes
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
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
                          disabled={editingShopId === String(customer.id)}
                          onClick={() => editShop(customer)}
                        >
                          {editingShopId === String(customer.id) ? (
                            <span className="admin-request-spinner" />
                          ) : (
                            <Pencil size={16} />
                          )}
                        </button>
                        {canDeleteShops && (
                          <button
                            className="admin-icon-button admin-icon-danger"
                            type="button"
                            title="Delete shop"
                            disabled={deletingShop}
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

      {canViewLedger && activeTab === "collections" && (
        <Panel
          title="Collections"
          subtitle="Track cash collected by each user and record how much was handed over to each owner."
        >
          <div className="admin-stat-grid">
            <StatCard
              label="Today Collected"
              value={`Rs. ${sumBy(cashLedger.summaries, "todayCollected")}`}
              icon={<IndianRupee size={20} />}
              tone="green"
            />
            <StatCard
              label="Total Collected"
              value={`Rs. ${sumBy(cashLedger.summaries, "totalCollected")}`}
              icon={<Receipt size={20} />}
              tone="blue"
            />
            <StatCard
              label="Handed Over"
              value={`Rs. ${sumBy(cashLedger.summaries, "totalHandedOver")}`}
              icon={<WalletCards size={20} />}
              tone="violet"
            />
            <StatCard
              label="With Users"
              value={`Rs. ${sumBy(cashLedger.summaries, "balanceWithUser")}`}
              icon={<Store size={20} />}
              tone="amber"
            />
          </div>

          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Today</th>
                  <th>Total Collected</th>
                  <th>Handed Over</th>
                  <th>Balance With User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(cashLedger.summaries || []).map((summary: any) => (
                  <tr key={`${summary.collectorUserId || summary.collectorEmail || summary.collectorName}`}>
                    <td>
                      <strong>{summary.collectorName || "Unknown user"}</strong>
                      <span>{summary.collectorEmail || "-"}</span>
                    </td>
                    <td>Rs. {summary.todayCollected ?? 0}</td>
                    <td>Rs. {summary.totalCollected ?? 0}</td>
                    <td>Rs. {summary.totalHandedOver ?? 0}</td>
                    <td>Rs. {summary.balanceWithUser ?? 0}</td>
                    <td>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => startCashHandover(summary)}
                      >
                        <WalletCards size={15} />
                        Handover
                      </button>
                    </td>
                  </tr>
                ))}
                {(cashLedger.summaries || []).length === 0 && (
                  <tr>
                    <td colSpan={6}>No collections recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-form-grid">
            <Field label="Collector" required>
              {isSuperAdmin ? (
                <select
                  value={handoverForm.collectorUserId}
                  onFocus={() => loadUsers()}
                  onChange={(event) => updateHandoverCollector(event.target.value)}
                >
                  <option value="">Select collector</option>
                  {collectorUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={handoverForm.collectorName}
                  onChange={(event) =>
                    setHandoverForm((current) => ({
                      ...current,
                      collectorName: event.target.value,
                    }))
                  }
                />
              )}
            </Field>
            <Field label="Collector Email" optional>
              <input
                value={handoverForm.collectorEmail}
                onChange={(event) =>
                  setHandoverForm((current) => ({
                    ...current,
                    collectorEmail: event.target.value,
                  }))
                }
                readOnly={isSuperAdmin && Boolean(handoverForm.collectorUserId)}
              />
            </Field>
            <Field label="Given To Owner" required>
              <input
                list="owner-options"
                value={handoverForm.ownerName}
                onChange={(event) =>
                  setHandoverForm((current) => ({
                    ...current,
                    ownerName: event.target.value,
                  }))
                }
              />
              <datalist id="owner-options">
                {ownerOptions.map((ownerName) => (
                  <option key={ownerName} value={ownerName} />
                ))}
              </datalist>
            </Field>
            <Field label="Amount" required>
              <input
                type="number"
                min="0"
                value={handoverForm.amount}
                onChange={(event) =>
                  setHandoverForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Note" optional>
              <input
                value={handoverForm.remarks}
                onChange={(event) =>
                  setHandoverForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
              />
            </Field>
            <button
              className="admin-button"
              type="button"
              onClick={saveCashHandover}
              disabled={savingHandover}
            >
              <Save size={17} />
              {savingHandover
                ? "Saving..."
                : handoverForm.id
                  ? "Update Handover"
                  : "Save Handover"}
            </button>
            {handoverForm.id && (
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => setHandoverForm(emptyHandoverForm)}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="sales-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Collector</th>
                  <th>Owner</th>
                  <th>Amount</th>
                  <th>Recorded By</th>
                  <th>Note</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {(cashLedger.handovers || []).map((handover: any) => (
                  <tr key={handover.id}>
                    <td>{formatDateTime(handover.handedOverAt)}</td>
                    <td>
                      <strong>{handover.collectorName}</strong>
                      <span>{handover.collectorEmail || "-"}</span>
                    </td>
                    <td>{handover.ownerName}</td>
                    <td>Rs. {handover.amount ?? 0}</td>
                    <td>
                      <strong>{auditName(handover.recordedByName)}</strong>
                      <span>{handover.recordedByEmail || "-"}</span>
                    </td>
                    <td>{handover.remarks || "-"}</td>
                    <td>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => editCashHandover(handover)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {(cashLedger.handovers || []).length === 0 && (
                  <tr>
                    <td colSpan={7}>No handovers recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                      {isSuperAdmin && <th>Actions</th>}
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
                        {isSuperAdmin && (
                          <td>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => openSaleEntryEditor(sale)}
                            >
                              <Pencil size={15} />
                              Edit Entry
                            </button>
                          </td>
                        )}
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
                  {isSuperAdmin && <th>Correction</th>}
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
                    {isSuperAdmin && (
                      <td>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => openSaleEntryEditor(sale)}
                        >
                          <Pencil size={15} />
                          Edit Entry
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      )}

      {pendingAmountFill && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal sales-amount-fill-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon sales-payment-icon">
              <IndianRupee size={22} />
            </div>
            <div>
              <h2>Confirm amount received</h2>
              <p>
                Set <strong>Amount Received Today</strong> to{" "}
                <strong>Rs. {pendingAmountFill.amount}</strong> from{" "}
                <strong>{pendingAmountFill.label}</strong>?
              </p>
            </div>
            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                onClick={() => setPendingAmountFill(null)}
              >
                Cancel
              </button>
              <button
                className="admin-button"
                type="button"
                onClick={applyPendingAmountFill}
              >
                Yes, Fill Amount
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSale && isSuperAdmin && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-confirm-modal sales-entry-edit-modal" role="dialog" aria-modal="true">
            <div className="admin-confirm-icon sales-payment-icon">
              <Pencil size={22} />
            </div>
            <div>
              <h2>Edit delivery entry</h2>
              <p>
                Correct the saved entry for <strong>{editingSale.customerName}</strong>.
                Dashboard and ledger values will follow the corrected sale date and amounts.
              </p>
            </div>

            <div className="sales-payment-summary">
              <span>
                <small>Billable</small>
                <strong>Rs. {saleEditBillableAmount}</strong>
              </span>
              <span>
                <small>Collected</small>
                <strong>Rs. {Number(saleEditForm.amountCollected) || 0}</strong>
              </span>
              <span>
                <small>Pending</small>
                <strong>Rs. {saleEditPendingAmount}</strong>
              </span>
            </div>

            <div className="admin-form-grid">
              <Field label="Shop" required>
                <select
                  value={saleEditForm.customerId}
                  onChange={(event) =>
                    updateSaleEditField("customerId", event.target.value)
                  }
                >
                  {allCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName} - {customer.location || "R.T. Nagar"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date of Delivery" required>
                <input
                  type="date"
                  value={saleEditForm.deliveryDate || todayDateInputValue()}
                  onChange={(event) =>
                    updateSaleEditField("deliveryDate", event.target.value)
                  }
                />
              </Field>

              <Field label="Product" required>
                <input
                  list="sale-entry-edit-products"
                  value={saleEditForm.productName}
                  onChange={(event) => updateSaleEditProduct(event.target.value)}
                />
                <datalist id="sale-entry-edit-products">
                  {saleEditProductOptions.map((product) => (
                    <option
                      key={optionValueForProduct(product)}
                      value={product.productName}
                    />
                  ))}
                </datalist>
              </Field>

              <Field label="Boxes" required>
                <input
                  type="number"
                  value={saleEditForm.quantity}
                  onChange={(event) =>
                    updateSaleEditField("quantity", event.target.value)
                  }
                />
              </Field>

              <Field label="Unit Price" required>
                <input
                  type="number"
                  value={saleEditForm.unitPrice}
                  onChange={(event) =>
                    updateSaleEditField("unitPrice", event.target.value)
                  }
                />
              </Field>

              <Field label="Gross Amount">
                <input value={saleEditGrossAmount} readOnly />
              </Field>

              <Field label="Exchange Type">
                <select
                  value={saleEditForm.exchangeType}
                  onChange={(event) =>
                    updateSaleEditField("exchangeType", event.target.value)
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
                  value={saleEditForm.exchangeBoxes}
                  onChange={(event) =>
                    updateSaleEditField("exchangeBoxes", event.target.value)
                  }
                />
              </Field>

              <Field label="Returned Boxes">
                <input
                  type="number"
                  value={saleEditForm.returnedBoxes}
                  onChange={(event) =>
                    updateSaleEditField("returnedBoxes", event.target.value)
                  }
                />
              </Field>

              <Field label="Amount Collected">
                <input
                  type="number"
                  value={saleEditForm.amountCollected}
                  onChange={(event) =>
                    updateSaleEditField("amountCollected", event.target.value)
                  }
                />
              </Field>

              <Field label="Shopkeeper Selling Price">
                <input
                  type="number"
                  value={saleEditForm.shopkeeperSellingPrice}
                  onChange={(event) =>
                    updateSaleEditField(
                      "shopkeeperSellingPrice",
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field label="Remarks">
                <input
                  value={saleEditForm.remarks}
                  onChange={(event) =>
                    updateSaleEditField("remarks", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                disabled={savingSaleEdit}
                onClick={closeSaleEntryEditor}
              >
                Cancel
              </button>
              <button
                className="admin-button"
                type="button"
                disabled={savingSaleEdit}
                onClick={saveSaleEntryEdit}
              >
                <Save size={17} />
                {savingSaleEdit ? "Saving Correction..." : "Save Correction"}
              </button>
            </div>
          </div>
        </div>
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
              <h2>Are you sure you want to delete this shop?</h2>
              <p>
                This will soft delete{" "}
                <strong>{shopToDelete.customerName}</strong>. It will no longer
                appear in delivery entry or shop master, but its sales and audit
                history will remain available. Please confirm before deleting.
              </p>
            </div>
            <div className="admin-confirm-actions">
              <button
                className="admin-button admin-button-secondary"
                type="button"
                disabled={deletingShop}
                onClick={() => setShopToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-danger"
                type="button"
                disabled={deletingShop}
                onClick={deleteShop}
              >
                {deletingShop ? "Deleting..." : "Yes, Delete Shop"}
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

function buildDeliveryProductOptions(shop: any, products: any[]) {
  const productOptions = [...products];
  const existingNames = new Set(
    products.map((product) => normalizedProductName(product.productName)),
  );

  normalizeShopProducts(shop?.products).forEach((productName) => {
    const normalizedName = normalizedProductName(productName);

    if (!normalizedName || existingNames.has(normalizedName)) {
      return;
    }

    productOptions.push({
      id: null,
      productName,
      standardPrice: shop?.defaultBoxPrice ?? 50,
      active: true,
    });
    existingNames.add(normalizedName);
  });

  if (
    productOptions.length === 0 &&
    (!shop || normalizeShopProducts(shop.products).length === 0)
  ) {
    productOptions.push({
      id: null,
      productName: "Oyster Mushroom",
      standardPrice: shop?.defaultBoxPrice ?? 50,
      active: true,
    });
  }

  return productOptions;
}

function optionValueForProduct(product: any) {
  return product?.id ? `id:${product.id}` : `name:${product?.productName || ""}`;
}

function productForShop(shop: any, products: any[]) {
  const shopProducts = normalizeShopProducts(shop?.products);

  if (shopProducts.length === 0) {
    return products.find((product) =>
      normalizedProductName(product.productName).includes("oyster"),
    );
  }

  return products.find((product) => {
    const catalogName = normalizedProductName(product.productName);

    return shopProducts.some((shopProduct) => {
      const shopName = normalizedProductName(shopProduct);

      return catalogName === shopName ||
        catalogName.includes(shopName) ||
        shopName.includes(catalogName);
    });
  });
}

function normalizedProductName(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/mushrooms/g, "mushroom")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function salePending(sale: any) {
  if (sale.pendingAmount !== null && sale.pendingAmount !== undefined) {
    return Number(sale.pendingAmount) || 0;
  }

  return (Number(sale.totalAmount) || 0) - (Number(sale.amountCollected) || 0);
}

function sumBy(items: any[] = [], field: string) {
  return items.reduce(
    (total, item) => total + (Number(item?.[field]) || 0),
    0,
  );
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

function buildRoutePlans({
  allocations,
  employeeCount,
  origin,
  balanceBoxes,
  groupLocation,
  reduceBacktracking,
}: {
  allocations: BoxAllocation[];
  employeeCount: number;
  origin: string;
  balanceBoxes: boolean;
  groupLocation: boolean;
  reduceBacktracking: boolean;
}): RoutePlan[] {
  const routeCount = Math.max(1, employeeCount || 1);
  const normalizedOrigin = normalizedRouteLocation(origin);
  const routePlans: RoutePlan[] = Array.from({ length: routeCount }, (_, index) => ({
    id: index + 1,
    label: `Route ${index + 1}`,
    shops: [],
    totalBoxes: 0,
    totalStops: 0,
    locations: [],
    mapsUrl: "",
  }));
  const routableShops = allocations
    .filter((shop) => shop.allocatedBoxes > 0)
    .sort((first, second) => {
      const originCompare =
        originLocationScore(second, normalizedOrigin) -
        originLocationScore(first, normalizedOrigin);

      if (originCompare !== 0) {
        return originCompare;
      }

      if (groupLocation || reduceBacktracking) {
        const locationCompare = first.location.localeCompare(second.location);

        if (locationCompare !== 0) {
          return locationCompare;
        }
      }

      if (balanceBoxes && second.allocatedBoxes !== first.allocatedBoxes) {
        return second.allocatedBoxes - first.allocatedBoxes;
      }

      return first.shopName.localeCompare(second.shopName);
    });

  if (groupLocation) {
    const groups = groupByLocation(routableShops, normalizedOrigin);

    groups.forEach((group) => {
      const targetRoute = routePlans
        .slice()
        .sort((first, second) => routeWeight(first, balanceBoxes) - routeWeight(second, balanceBoxes))[0];

      group.forEach((shop) => addShopToRoute(targetRoute, shop));
    });
  } else {
    routableShops.forEach((shop) => {
      const targetRoute = routePlans
        .slice()
        .sort((first, second) => routeWeight(first, balanceBoxes) - routeWeight(second, balanceBoxes))[0];

      addShopToRoute(targetRoute, shop);
    });
  }

  return routePlans
    .map((routePlan) => ({
      ...routePlan,
      shops: reduceBacktracking
        ? routePlan.shops.sort((first, second) => {
            const originCompare =
              originLocationScore(second, normalizedOrigin) -
              originLocationScore(first, normalizedOrigin);

            if (originCompare !== 0) {
              return originCompare;
            }

            const locationCompare = first.location.localeCompare(second.location);

            return locationCompare || first.shopName.localeCompare(second.shopName);
          })
        : routePlan.shops,
    }))
    .filter((routePlan) => routePlan.shops.length > 0)
    .map((routePlan) => ({
      ...routePlan,
      mapsUrl: googleMapsRouteUrl(origin, routePlan.shops),
    }));
}

function groupByLocation(shops: BoxAllocation[], normalizedOrigin: string) {
  const groups = new Map<string, BoxAllocation[]>();

  shops.forEach((shop) => {
    const key = normalizedRouteLocation(shop.location);
    const group = groups.get(key) || [];
    group.push(shop);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((first, second) => {
    const firstOriginScore = Math.max(
      ...first.map((shop) => originLocationScore(shop, normalizedOrigin)),
    );
    const secondOriginScore = Math.max(
      ...second.map((shop) => originLocationScore(shop, normalizedOrigin)),
    );

    if (secondOriginScore !== firstOriginScore) {
      return secondOriginScore - firstOriginScore;
    }

    const firstBoxes = first.reduce((total, shop) => total + shop.allocatedBoxes, 0);
    const secondBoxes = second.reduce((total, shop) => total + shop.allocatedBoxes, 0);

    return secondBoxes - firstBoxes;
  });
}

function addShopToRoute(routePlan: RoutePlan, shop: BoxAllocation) {
  routePlan.shops.push(shop);
  routePlan.totalBoxes += shop.allocatedBoxes;
  routePlan.totalStops += 1;
  routePlan.locations = Array.from(
    new Set([...routePlan.locations, shop.location || "R.T. Nagar"]),
  );
}

function routeWeight(routePlan: RoutePlan, balanceBoxes: boolean) {
  return balanceBoxes ? routePlan.totalBoxes : routePlan.totalStops;
}

function googleMapsRouteUrl(origin: string, shops: BoxAllocation[]) {
  const stops = shops.map(routeStopLabel);
  const routeOrigin = mapsLocationValue(origin) || "Samaksh Farms, Bengaluru";
  const destination = stops[stops.length - 1] || routeOrigin;
  const waypoints = stops.slice(0, -1).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: routeOrigin,
    destination,
    travelmode: "driving",
    dir_action: "navigate",
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function routeStopLabel(shop: BoxAllocation) {
  return `${shop.shopName}, ${shop.location || "Bengaluru"}, Bengaluru`;
}

function routeShareText(routePlan: RoutePlan) {
  const stops = routePlan.shops
    .map(
      (shop, index) =>
        `${index + 1}. ${shop.shopName} - ${shop.location} - ${shop.allocatedBoxes} boxes`,
    )
    .join("\n");

  return `${routePlan.label}\n${routePlan.totalStops} stops | ${routePlan.totalBoxes} boxes\n\n${stops}\n\nMap: ${routePlan.mapsUrl}`;
}

function normalizedRouteLocation(value?: string) {
  return String(value || "R.T. Nagar")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function originLocationScore(shop: BoxAllocation, normalizedOrigin: string) {
  if (!normalizedOrigin) {
    return 0;
  }

  const location = normalizedRouteLocation(shop.location);
  const shopName = normalizedRouteLocation(shop.shopName);

  if (normalizedOrigin.includes(location) || location.includes(normalizedOrigin)) {
    return 3;
  }

  if (normalizedOrigin.includes(shopName) || shopName.includes(normalizedOrigin)) {
    return 2;
  }

  return normalizedOrigin
    .split(" ")
    .filter((part) => part.length > 2)
    .some((part) => location.includes(part) || shopName.includes(part))
    ? 1
    : 0;
}

function mapsLocationValue(value?: string) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  const atCoordinates = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);

  if (atCoordinates) {
    return `${atCoordinates[1]},${atCoordinates[2]}`;
  }

  const bangCoordinates = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

  if (bangCoordinates) {
    return `${bangCoordinates[1]},${bangCoordinates[2]}`;
  }

  const plainCoordinates = trimmed.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);

  if (plainCoordinates) {
    return `${plainCoordinates[1]},${plainCoordinates[2]}`;
  }

  return trimmed;
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

  return parseBusinessDate(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return parseBusinessDate(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function parseBusinessDate(value?: string) {
  if (!value) {
    return new Date("");
  }

  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value}+05:30`;

  return new Date(normalized);
}

function auditName(value?: string) {
  return value && value !== "SYSTEM" ? value : "System";
}

function todayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateInputValue(value?: string) {
  const parsedDate = parseBusinessDate(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return todayDateInputValue();
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isBootstrapAdminUser(user: any) {
  const name = normalizedUserIdentity(user?.name);
  const email = normalizedUserIdentity(user?.email);
  const primaryRole = String(user?.role || "").toUpperCase();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role: unknown) => String(role).toUpperCase())
    : [];

  return (
    name === "samaksh farms admin" ||
    email.includes("bootstrap") ||
    email === "admin@samakshfarms.in" ||
    email === "admin@samakshfarms.com" ||
    (primaryRole === "SUPER_ADMIN" && name.includes("bootstrap")) ||
    (roles.includes("SUPER_ADMIN") && name.includes("bootstrap"))
  );
}

function normalizedUserIdentity(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
