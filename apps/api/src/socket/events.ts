export const SOCKET_EVENTS = {
  // Vehicle events
  VEHICLE_CREATED: 'vehicle:created',
  VEHICLE_UPDATED: 'vehicle:updated',
  VEHICLE_SOLD: 'vehicle:sold',
  VEHICLE_STATUS_CHANGED: 'vehicle:statusChanged',

  // Sale events
  SALE_CREATED: 'sale:created',
  SALE_CANCELLED: 'sale:cancelled',

  // Stock events
  STOCK_LOW: 'stock:low',
  STOCK_MOVEMENT: 'stock:movement',

  // Calculator events
  CALCULATION_SAVED: 'calculator:saved',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',

  // Master panel events
  TAX_RATE_CHANGED: 'master:taxRateChanged',
  EXCHANGE_RATE_UPDATED: 'master:exchangeRateUpdated',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
