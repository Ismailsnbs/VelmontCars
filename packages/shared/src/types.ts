// Paylaşılan tipler — API sözleşmeleri, domain modelleri
import {
  UserRole,
  VehicleStatus,
  FuelType,
  Transmission,
  VehicleCategory,
  SubscriptionType,
  NotificationType,
  NotificationPriority,
  RateType,
  DocumentType,
  ExpenseType,
  MovementType,
  ProductCategory,
} from './enums';

// ─── Auth ──────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  galleryId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  galleryId: string | null;
  galleryName?: string;
}

// ─── API Response ──────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ─── Vehicle ───────────────────────────────────────
export interface VehicleSummary {
  id: string;
  brand: string;
  model: string;
  year: number;
  engineCC: number;
  status: VehicleStatus;
  fobPrice: number;
  totalCost: number | null;
  salePrice: number | null;
  profit: number | null;
  profitMargin: number | null;
  mainImage: string | null;
}

export interface VehicleFilters {
  status?: VehicleStatus;
  brand?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  originCountryId?: string;
}

// ─── Calculator ────────────────────────────────────
export interface CalculatorInput {
  fobPrice: number;
  fobCurrency: string;
  originCountryId: string;
  engineCC: number;
  vehicleType: VehicleCategory;
  modelYear: number;
  shippingCost: number;
  insuranceCost: number;
}

export interface CalculatorResult {
  cifValue: number;
  customsDuty: number;
  customsDutyRate: number;
  kdv: number;
  kdvRate: number;
  fif: number;
  fifRate: number;
  generalFif: number;
  gkk: number;
  gkkRate: number;
  wharfFee: number;
  wharfRate: number;
  bandrol: number;
  totalTaxes: number;
  totalCostUSD: number;
  totalCostTL: number;
  exchangeRate: number;
}

// ─── Dashboard ─────────────────────────────────────
export interface DashboardStats {
  totalVehiclesInStock: number;
  totalVehiclesInTransit: number;
  monthlySales: number;
  monthlyProfit: number;
  lowStockProducts: number;
  upcomingDeliveries: number;
}

// ─── Notification ──────────────────────────────────
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
}
