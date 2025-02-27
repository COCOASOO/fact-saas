export function calculateTaxAmount(subtotal: number, taxRate: number): number {
    return (subtotal * taxRate) / 100
  }
  
  export function calculateIrpfAmount(subtotal: number, irpfRate: number): number {
    return (subtotal * irpfRate) / 100
  }
  
  export function calculateTotalAmount(subtotal: number, taxAmount: number, irpfAmount: number): number {
    return subtotal + taxAmount - irpfAmount
  }
  
  export function formatCurrency(amount: number, currency = "EUR"): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }
  
  export function formatDate(date: string): string {
    return new Intl.DateTimeFormat("es-ES").format(new Date(date))
  }
  
  