const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const USER_ROLES = {
  ADMIN: 'admin',
};

const SORT_OPTIONS = {
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  PRICE_LOW: 'price',
  PRICE_HIGH: '-price',
  MOST_SOLD: '-sales',
  MOST_VIEWED: '-views',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff'];

module.exports = {
  ORDER_STATUS,
  USER_ROLES,
  SORT_OPTIONS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
};
