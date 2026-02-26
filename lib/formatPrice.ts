export function formatPLN(value:any){
  if(value === null || value === undefined) return ''
  if(typeof value === 'number'){
    const n = Math.round(value)
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n)
  }
  if(typeof value === 'string'){
    const cleaned = value.replace(/[^0-9\,\.]/g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    if(!Number.isNaN(n)){
      const rn = Math.round(n)
      return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(rn)
    }
    return value
  }
  return String(value)
}
