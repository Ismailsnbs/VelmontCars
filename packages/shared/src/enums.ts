// Paylaşılan enum'lar — tüm uygulamalar tarafından kullanılır
export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN',
  GALLERY_OWNER = 'GALLERY_OWNER',
  GALLERY_MANAGER = 'GALLERY_MANAGER',
  SALES = 'SALES',
  ACCOUNTANT = 'ACCOUNTANT',
  STAFF = 'STAFF',
}

export enum RateType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  PER_CC = 'PER_CC',
}

export enum VehicleCategory {
  PASSENGER = 'PASSENGER',
  COMMERCIAL = 'COMMERCIAL',
  ALL = 'ALL',
}

export enum VehicleStatus {
  TRANSIT = 'TRANSIT',
  IN_STOCK = 'IN_STOCK',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  LPG = 'LPG',
}

export enum Transmission {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  SEMI_AUTO = 'SEMI_AUTO',
}

export enum DocumentType {
  REGISTRATION = 'REGISTRATION',
  INVOICE = 'INVOICE',
  CUSTOMS = 'CUSTOMS',
  INSPECTION = 'INSPECTION',
  INSURANCE = 'INSURANCE',
  SHIPPING = 'SHIPPING',
  OTHER = 'OTHER',
}

export enum ExpenseType {
  REPAIR = 'REPAIR',
  PAINT = 'PAINT',
  PARTS = 'PARTS',
  INSURANCE = 'INSURANCE',
  ADVERTISING = 'ADVERTISING',
  OTHER = 'OTHER',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ProductCategory {
  CLEANING = 'CLEANING',
  SPRAY = 'SPRAY',
  CLOTH = 'CLOTH',
  BRUSH = 'BRUSH',
  CHEMICAL = 'CHEMICAL',
  OTHER = 'OTHER',
}

export enum NotificationType {
  TAX_CHANGE = 'TAX_CHANGE',
  CURRENCY_ALERT = 'CURRENCY_ALERT',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SubscriptionType {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}
