const { body } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS } = require('../config/constants');

const createOrderValidation = [
  body('customerName').notEmpty().withMessage('Customer name is required').trim(),
  body('phone').notEmpty().withMessage('Phone number is required').trim(),
  body('city').notEmpty().withMessage('City is required').trim(),
  body('address').notEmpty().withMessage('Address is required').trim(),
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`),
  body('notes').optional().trim(),
];

const createOrder = asyncHandler(async (req, res) => {
  const { products } = req.body;

  // Verify products exist and calculate total
  let calculatedTotal = 0;
  const orderProducts = [];

  for (const item of products) {
    const product = await Product.findById(item.product);

    if (!product) {
      return res.status(400).json(
        ApiResponse.error(`Product not found: ${item.product}`, 400)
      );
    }

    if (!product.isActive) {
      return res.status(400).json(
        ApiResponse.error(`Product is not available: ${product.title}`, 400)
      );
    }

    const itemTotal = product.price * item.quantity;
    calculatedTotal += itemTotal;

    orderProducts.push({
      product: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0] || '',
    });

    // Increment product sales
    await Product.findByIdAndUpdate(product._id, {
      $inc: { sales: item.quantity },
    });
  }

  const order = await Order.create({
    customerName: req.body.customerName,
    phone: req.body.phone,
    city: req.body.city,
    address: req.body.address,
    products: orderProducts,
    totalAmount: req.body.totalAmount || calculatedTotal,
    notes: req.body.notes || '',
  });

  res.status(201).json(
    ApiResponse.success('Order created successfully', order)
  );
});

const getOrders = asyncHandler(async (req, res) => {
  const {
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    search,
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const totalOrders = await Order.countDocuments(query);
  const totalPages = Math.ceil(totalOrders / parseInt(limit));

  res.status(200).json(
    ApiResponse.success('Orders retrieved successfully', orders, {
      currentPage: parseInt(page),
      totalPages,
      totalOrders,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    })
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).lean();

  if (!order) {
    return res.status(404).json(
      ApiResponse.error('Order not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Order retrieved successfully', order)
  );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const updateData = { status };
  if (notes !== undefined) updateData.notes = notes;

  const order = await Order.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    return res.status(404).json(
      ApiResponse.error('Order not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Order status updated successfully', order)
  );
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const totalOrders = await Order.countDocuments(query);
  const pendingOrders = await Order.countDocuments({ ...query, status: 'pending' });
  const confirmedOrders = await Order.countDocuments({ ...query, status: 'confirmed' });

  // Total revenue
  const revenueResult = await Order.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // Orders by status
  const statusAgg = await Order.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const ordersByStatus = {};
  statusAgg.forEach(item => { ordersByStatus[item._id] = item.count; });

  // Top products by sales
  const topProducts = await Product.find(query)
    .sort({ sales: -1 })
    .limit(5)
    .lean();
  const topProductsData = topProducts.map(p => ({
    title: p.title,
    sales: p.sales,
    revenue: p.sales * p.price,
  }));

  // Recent orders
  const recentOrders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res.status(200).json(
    ApiResponse.success('Dashboard stats retrieved', {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue,
      ordersByStatus,
      topProducts: topProductsData,
      recentOrders,
    })
  );
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return res.status(404).json(
      ApiResponse.error('Order not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Order deleted successfully')
  );
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardStats,
  createOrderValidation,
  updateOrderStatusValidation,
};
