const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const auth = require('../middleware/auth');

// GET /api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const { status, clientId, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.userId };
    if (status && status !== 'all') query.status = status;
    if (clientId) query.clientId = clientId;
    if (search) query.invoiceNumber = { $regex: search, $options: 'i' };

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(query);
    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET invoices error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId })
      .populate('clientId')
      .populate('userId', 'name email company phone address gstNumber');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ invoice });
  } catch (err) {
    console.error('GET invoice error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/invoices
router.post('/', auth, async (req, res) => {
  try {
    console.log('📥 Create invoice payload:', JSON.stringify(req.body, null, 2));

    const { clientId, items, gstRate, isInterState, dueDate, notes } = req.body;

    // Manual validation with clear messages
    if (!clientId) {
      return res.status(400).json({ message: 'Please select a client.' });
    }
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: 'Invalid client ID.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || String(item.name).trim() === '') {
        return res.status(400).json({ message: `Item ${i + 1}: name is required.` });
      }
      if (item.price === undefined || item.price === null || item.price === '') {
        return res.status(400).json({ message: `Item ${i + 1}: price is required.` });
      }
      if (item.quantity === undefined || item.quantity === null || item.quantity === '') {
        return res.status(400).json({ message: `Item ${i + 1}: quantity is required.` });
      }
    }

    // Verify client exists and belongs to user
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found. Please add this client first.' });
    }

    // Cast and calculate
    const gstRateNum = Number(gstRate) || 18;
    const interstate = isInterState === true || isInterState === 'true';

    const processedItems = items.map((item, i) => {
      const qty = Math.max(Number(item.quantity) || 0, 0);
      const price = Math.max(Number(item.price) || 0, 0);
      return {
        name: String(item.name).trim(),
        description: item.description ? String(item.description).trim() : '',
        quantity: qty,
        price: price,
        total: parseFloat((qty * price).toFixed(2)),
      };
    });

    const subtotal = parseFloat(processedItems.reduce((s, i) => s + i.total, 0).toFixed(2));
    const totalGst = parseFloat(((subtotal * gstRateNum) / 100).toFixed(2));
    const cgst = interstate ? 0 : parseFloat((totalGst / 2).toFixed(2));
    const sgst = interstate ? 0 : parseFloat((totalGst / 2).toFixed(2));
    const igst = interstate ? totalGst : 0;
    const totalAmount = parseFloat((subtotal + totalGst).toFixed(2));

    // Build invoice object
    const invoiceData = {
      userId: req.userId,
      clientId: client._id,
      items: processedItems,
      subtotal,
      gstRate: gstRateNum,
      cgst,
      sgst,
      igst,
      totalGst,
      totalAmount,
      isInterState: interstate,
      notes: notes ? String(notes).trim() : '',
    };

    // Only set dueDate if a real value was provided
    if (dueDate && String(dueDate).trim() !== '') {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        invoiceData.dueDate = parsed;
      }
    }

    console.log('💾 Saving invoice:', JSON.stringify(invoiceData, null, 2));

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    await invoice.populate('clientId', 'name email company');

    console.log('✅ Invoice saved:', invoice.invoiceNumber);
    res.status(201).json({ invoice });

  } catch (err) {
    console.error('❌ Create invoice error:', err.name, err.message);
    if (err.errors) {
      // Mongoose validation error — return the first readable message
      const firstKey = Object.keys(err.errors)[0];
      return res.status(400).json({ message: `Validation error: ${err.errors[firstKey].message}` });
    }
    res.status(500).json({ message: err.message || 'Failed to create invoice.' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }
    const { items, gstRate, isInterState, dueDate, notes, status, paidDate } = req.body;
    const update = {};

    if (items && Array.isArray(items) && items.length > 0) {
      const interstate = isInterState === true || isInterState === 'true';
      const rate = Number(gstRate) || 18;

      const processedItems = items.map(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return {
          name: String(item.name).trim(),
          description: item.description ? String(item.description).trim() : '',
          quantity: qty,
          price: price,
          total: parseFloat((qty * price).toFixed(2)),
        };
      });

      const subtotal = parseFloat(processedItems.reduce((s, i) => s + i.total, 0).toFixed(2));
      const totalGst = parseFloat(((subtotal * rate) / 100).toFixed(2));

      update.items = processedItems;
      update.subtotal = subtotal;
      update.gstRate = rate;
      update.cgst = interstate ? 0 : parseFloat((totalGst / 2).toFixed(2));
      update.sgst = interstate ? 0 : parseFloat((totalGst / 2).toFixed(2));
      update.igst = interstate ? totalGst : 0;
      update.totalGst = totalGst;
      update.totalAmount = parseFloat((subtotal + totalGst).toFixed(2));
      update.isInterState = interstate;
    }

    if (dueDate !== undefined) {
      if (dueDate && String(dueDate).trim() !== '') {
        const parsed = new Date(dueDate);
        update.dueDate = isNaN(parsed.getTime()) ? null : parsed;
      } else {
        update.dueDate = null;
      }
    }
    if (notes !== undefined) update.notes = notes;
    if (status) {
      update.status = status;
      if (status === 'paid') update.paidDate = paidDate ? new Date(paidDate) : new Date();
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true, runValidators: false }
    ).populate('clientId', 'name email company');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ invoice });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ message: err.message || 'Failed to update invoice.' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ message: 'Invoice deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const update = { status };
    if (status === 'paid') update.paidDate = new Date();

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    ).populate('clientId', 'name email company');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
