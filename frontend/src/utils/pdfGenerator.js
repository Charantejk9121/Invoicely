import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

export const generateInvoicePDF = (invoice, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const client = invoice.clientId || {};
  const currency = user?.currency || 'INR';

  // Background header
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, w, 42, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.company || user?.name || 'Your Company', 14, 18);

  // Invoice label
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('TAX INVOICE', w - 14, 14, { align: 'right' });

  // Invoice number
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber || 'INV-0001', w - 14, 24, { align: 'right' });

  // Company details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const companyLines = [
    user?.email || '',
    user?.phone || '',
    user?.address || '',
    user?.gstNumber ? `GSTIN: ${user.gstNumber}` : '',
  ].filter(Boolean);
  doc.text(companyLines, 14, 26);

  // Date info
  doc.setFontSize(8);
  const dateLines = [
    `Issue Date: ${formatDate(invoice.createdAt)}`,
    invoice.dueDate ? `Due Date: ${formatDate(invoice.dueDate)}` : '',
  ].filter(Boolean);
  doc.text(dateLines, w - 14, 31, { align: 'right' });

  // Reset text color
  doc.setTextColor(15, 23, 42);

  // Bill To section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 85, 38, 3, 3, 'F');
  doc.roundedRect(111, 50, 85, 38, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILL TO', 20, 57);
  doc.text('PAYMENT STATUS', 117, 57);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name || 'Client Name', 20, 64);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const clientLines = [
    client.email || '',
    client.phone || '',
    client.company || '',
    client.address || '',
    client.gstNumber ? `GSTIN: ${client.gstNumber}` : '',
  ].filter(Boolean);
  doc.text(clientLines.slice(0, 3), 20, 70);

  // Status badge
  const statusColors = {
    paid: [16, 185, 129],
    pending: [245, 158, 11],
    overdue: [239, 68, 68],
    cancelled: [148, 163, 184],
  };
  const [r, g, b] = statusColors[invoice.status] || statusColors.pending;
  doc.setFillColor(r, g, b);
  doc.roundedRect(117, 60, 30, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text((invoice.status || 'PENDING').toUpperCase(), 132, 66, { align: 'center' });

  if (invoice.paidDate) {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Paid on: ${formatDate(invoice.paidDate)}`, 117, 76);
  }

  // Items table
  doc.setTextColor(15, 23, 42);
  const tableRows = (invoice.items || []).map((item, i) => [
    i + 1,
    item.name + (item.description ? `\n${item.description}` : ''),
    item.quantity,
    formatCurrency(item.price, currency),
    formatCurrency(item.total, currency),
  ]);

  autoTable(doc, {
    startY: 96,
    head: [['#', 'Item / Description', 'Qty', 'Rate', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 8, cellPadding: 4, textColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // Totals box
  const totalsX = w - 90;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX - 5, finalY, 95, invoice.isInterState ? 42 : 50, 3, 3, 'F');

  const drawRow = (label, value, y, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 9 : 8);
    doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
    doc.text(label, totalsX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(value, w - 14, y, { align: 'right' });
  };

  let ty = finalY + 8;
  drawRow('Subtotal', formatCurrency(invoice.subtotal, currency), ty);
  ty += 7;

  if (invoice.isInterState) {
    drawRow(`IGST (${invoice.gstRate}%)`, formatCurrency(invoice.igst, currency), ty);
    ty += 7;
  } else {
    drawRow(`CGST (${invoice.gstRate / 2}%)`, formatCurrency(invoice.cgst, currency), ty);
    ty += 7;
    drawRow(`SGST (${invoice.gstRate / 2}%)`, formatCurrency(invoice.sgst, currency), ty);
    ty += 7;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX - 5, ty, w - 9, ty);
  ty += 6;

  // Total
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(totalsX - 5, ty - 4, 95, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT', totalsX, ty + 4);
  doc.text(formatCurrency(invoice.totalAmount, currency), w - 14, ty + 4, { align: 'right' });

  // Notes
  if (invoice.notes) {
    const notesY = Math.max(finalY + 60, ty + 20);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(invoice.notes, 90);
    doc.text(noteLines, 14, notesY + 5);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageH - 14, w, 14, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by Invoicely · Thank you for your business!', w / 2, pageH - 6, { align: 'center' });

  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
};
