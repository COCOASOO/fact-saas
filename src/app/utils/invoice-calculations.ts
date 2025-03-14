export function calculateTaxAmount(subtotal: any, taxRate: any): number {
  const numSubtotal = typeof subtotal === 'number' ? subtotal : Number(subtotal) || 0;
  const numTaxRate = typeof taxRate === 'number' ? taxRate : Number(taxRate) || 0;
  
  return (numSubtotal * numTaxRate) / 100;
}

export function calculateIrpfAmount(subtotal: any, irpfRate: any): number {
  const numSubtotal = typeof subtotal === 'number' ? subtotal : Number(subtotal) || 0;
  const numIrpfRate = typeof irpfRate === 'number' ? irpfRate : Number(irpfRate) || 0;
  
  return (numSubtotal * numIrpfRate) / 100;
}

export function calculateTotalAmount(subtotal: any, taxAmount: any, irpfAmount: any): number {
  const numSubtotal = typeof subtotal === 'number' ? subtotal : Number(subtotal) || 0;
  const numTaxAmount = typeof taxAmount === 'number' ? taxAmount : Number(taxAmount) || 0;
  const numIrpfAmount = typeof irpfAmount === 'number' ? irpfAmount : Number(irpfAmount) || 0;
  
  return numSubtotal + numTaxAmount - numIrpfAmount;
}

export function formatCurrency(amount: any): string {
  const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
  return numAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}
  
  