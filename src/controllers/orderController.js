const { body } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS } = require('../config/constants');
const { sendFormSubmitEmail } = require('../utils/formSubmitNotifier');

const createOrderValidation = [
  body('customerName').notEmpty().withMessage('Customer name is required').trim(),
  body('phone').notEmpty().withMessage('Phone number is required').trim(),
  body('city').notEmpty().withMessage('City is required').trim(),
  body('address').notEmpty().withMessage('Address is required').trim(),
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('paymentMethodCode').notEmpty().withMessage('Payment method is required').trim(),
  body('paymentReference').optional().trim(),
  body('paymentProofUrl').optional().trim(),
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}`),
  body('notes').optional().trim(),
];

const createOrder = asyncHandler(async (req, res) => {
  const { products, paymentMethodCode, paymentReference, paymentProofUrl } = req.body;
  const settings = await SiteSettings.findOne().lean();
  const paymentMethods = settings?.paymentMethods || [];
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.isActive && method.code === paymentMethodCode) ||
    paymentMethods.find((method) => method.isActive && method.type === 'cod') ||
    paymentMethods[0];

  if (!selectedPaymentMethod) {
    return res.status(400).json(
      ApiResponse.error('Selected payment method is not available', 400)
    );
  }

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

  const deliveryFee = calculatedTotal >= 2000 ? 0 : 150;
  const verifiedTotal = calculatedTotal + deliveryFee;

  const order = await Order.create({
    customerName: req.body.customerName,
    phone: req.body.phone,
    city: req.body.city,
    address: req.body.address,
    products: orderProducts,
    totalAmount: verifiedTotal,
    paymentMethod: {
      code: selectedPaymentMethod.code,
      label: selectedPaymentMethod.label,
      type: selectedPaymentMethod.type,
    },
    paymentDetails: {
      accountTitle: selectedPaymentMethod.accountTitle || '',
      accountNumber: selectedPaymentMethod.accountNumber || '',
      iban: selectedPaymentMethod.iban || '',
      paymentReference: paymentReference || '',
      paymentProofUrl: paymentProofUrl || '',
    },
    paymentStatus: selectedPaymentMethod.type === 'cod' ? 'unpaid' : 'awaiting_verification',
    notes: req.body.notes || '',
  });

  try {
    await sendFormSubmitEmail({
      subject: `New order from ${order.customerName}`,
      replyTo: req.body.email || undefined,
      message: `A new order has been placed for Rs. ${order.totalAmount}.`,
      payload: {
        customerName: order.customerName,
        phone: order.phone,
        city: order.city,
        address: order.address,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod.label,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentDetails.paymentReference || 'N/A',
        orderId: order._id.toString(),
        products: order.products.map(item => `${item.title} x${item.quantity} - Rs. ${item.price}`).join('\n'),
        notes: order.notes || 'N/A',
        submittedAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to send order FormSubmit email:', error.message);
  }

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
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalOrders,
      pages: totalPages,
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

  // Run all queries in parallel for better performance
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    revenueResult,
    statusAgg,
    topProducts,
    recentOrders
  ] = await Promise.all([
    Order.countDocuments(query),
    Order.countDocuments({ ...query, status: 'pending' }),
    Order.countDocuments({ ...query, status: 'confirmed' }),
    Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Product.find().sort({ sales: -1 }).limit(5).lean(),
    Order.find(query).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const ordersByStatus = {};
  statusAgg.forEach(item => { ordersByStatus[item._id] = item.count; });

  const topProductsData = topProducts.map(p => ({
    title: p.title,
    sales: p.sales,
    revenue: p.sales * p.price,
  }));

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
