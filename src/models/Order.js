const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
          default: '',
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      code: {
        type: String,
        default: 'cod',
        trim: true,
      },
      label: {
        type: String,
        default: 'Cash on Delivery',
        trim: true,
      },
      type: {
        type: String,
        enum: ['cod', 'wallet', 'bank', 'other'],
        default: 'cod',
      },
    },
    paymentDetails: {
      accountTitle: {
        type: String,
        default: '',
        trim: true,
      },
      accountNumber: {
        type: String,
        default: '',
        trim: true,
      },
      iban: {
        type: String,
        default: '',
        trim: true,
      },
      paymentReference: {
        type: String,
        default: '',
        trim: true,
      },
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'awaiting_verification', 'paid'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerName: 'text', phone: 'text', city: 'text' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
