import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice) {
  const doc = new jsPDF();

  // Header background
  doc.setFillColor(10, 12, 15);
  doc.rect(0, 0, 210, 50, 'F');

  // Company name
  doc.setTextColor(0, 212, 170);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.from_name || 'Your Business', 14, 20);

  // Invoice label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('INVOICE', 160, 20);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  doc.text(`#${invoice.invoice_number}`, 160, 27);
  doc.text(`Date: ${invoice.date}`, 160, 33);
  if (invoice.due_date) {
    doc.text(`Due: ${invoice.due_date}`, 160, 39);
  }

  // From and To
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 14, 62);
  doc.text('TO', 110, 62);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(invoice.from_name || '', 14,  70);
  doc.text(invoice.to_name   || '', 110, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.from_email || '', 14,  77);
  doc.text(invoice.to_email   || '', 110, 77);

  const fromLines = doc.splitTextToSize(invoice.from_address || '', 80);
  const toLines   = doc.splitTextToSize(invoice.to_address   || '', 80);
  doc.text(fromLines, 14,  84);
  doc.text(toLines,   110, 84);

  // Line items table
  const tableData = invoice.items
    .filter(item => item.description)
    .map(item => [
      item.description,
      item.quantity,
      `$${parseFloat(item.price || 0).toFixed(2)}`,
      `$${(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}`,
    ]);

  autoTable(doc, {
    startY: 105,
    head:   [['Description', 'Qty', 'Unit Price', 'Amount']],
    body:   tableData,
    theme:  'striped',
    headStyles: {
      fillColor: [0, 212, 170],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20,  halign: 'center' },
      2: { cellWidth: 35,  halign: 'right'  },
      3: { cellWidth: 35,  halign: 'right'  },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });

  if (invoice.tax_rate > 0) {
    doc.text(`Tax (${invoice.tax_rate}%):`, 140, finalY + 7);
    doc.text(`$${invoice.tax.toFixed(2)}`, 196, finalY + 7, { align: 'right' });
  }

  // Total box
  doc.setFillColor(0, 212, 170);
  doc.rect(130, finalY + 12, 66, 10, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 134, finalY + 19);
  doc.text(`$${invoice.total.toFixed(2)}`, 194, finalY + 19, { align: 'right' });

  // Notes
  if (invoice.notes) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', 14, finalY + 30);
    const noteLines = doc.splitTextToSize(invoice.notes, 180);
    doc.text(noteLines, 14, finalY + 37);
  }

  // Footer
  doc.setFillColor(10, 12, 15);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 14, 290);
  doc.setTextColor(0, 212, 170);
  doc.text(invoice.from_email || '', 196, 290, { align: 'right' });

  // Save
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
}