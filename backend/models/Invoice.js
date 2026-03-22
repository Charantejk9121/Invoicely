const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceNumber: { type: String },           // not required — set by pre-save hook
  items: [itemSchema],
  subtotal: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalGst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
  },
  dueDate: { type: Date, default: null },
  paidDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  isInterState: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
  try {
    if (!this.isNew) return next();
    const count = await this.constructor.countDocuments({ userId: this.userId });
    this.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
