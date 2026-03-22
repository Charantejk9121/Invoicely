const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const auth = require('../middleware/auth');

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Summary stats
    const [allInvoices, totalClients] = await Promise.all([
      Invoice.find({ userId }).populate('clientId', 'name'),
      Client.countDocuments({ userId }),
    ]);

    const totalRevenue = allInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const pendingAmount = allInvoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const overdueCount = allInvoices.filter(i => {
      return i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date();
    }).length;

    // Monthly revenue (last 12 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const month = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const revenue = allInvoices
        .filter(inv => inv.status === 'paid' && new Date(inv.updatedAt) >= d && new Date(inv.updatedAt) < end)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      
      const invoiceCount = allInvoices.filter(
        inv => new Date(inv.createdAt) >= d && new Date(inv.createdAt) < end
      ).length;

      monthlyData.push({ month, revenue, invoiceCount });
    }

    // Top clients by revenue
    const clientRevenue = {};
    allInvoices.filter(i => i.status === 'paid').forEach(inv => {
      const cid = inv.clientId?._id?.toString();
      const cname = inv.clientId?.name || 'Unknown';
      if (cid) {
        if (!clientRevenue[cid]) clientRevenue[cid] = { name: cname, revenue: 0, count: 0 };
        clientRevenue[cid].revenue += inv.totalAmount;
        clientRevenue[cid].count++;
      }
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent invoices
    const recentInvoices = await Invoice.find({ userId })
      .populate('clientId', 'name email company')
      .sort({ createdAt: -1 })
      .limit(5);

    // Status breakdown
    const statusBreakdown = {
      paid: allInvoices.filter(i => i.status === 'paid').length,
      pending: allInvoices.filter(i => i.status === 'pending').length,
      overdue: overdueCount,
      cancelled: allInvoices.filter(i => i.status === 'cancelled').length,
    };

    res.json({
      stats: {
        totalRevenue,
        pendingAmount,
        totalInvoices: allInvoices.length,
        totalClients,
        overdueCount,
      },
      monthlyData,
      topClients,
      recentInvoices,
      statusBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
