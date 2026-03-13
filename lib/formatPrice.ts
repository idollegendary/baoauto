export function parsePriceNumber(value:any){
  if(value === null || value === undefined) return null
  if(typeof value === 'number') return Number.isFinite(value) ? value : null
  if(typeof value === 'string'){
    const cleaned = value.replace(/[^0-9\,\.]/g, '').replace(',', '.')
    if(!cleaned) return null
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function getCarPricePLN(car:any){
  if(!car) return null
  const candidates = [car.price_pln, car.pricePln, car.price_num, car.priceNum, car.price]
  for(const c of candidates){
    const n = parsePriceNumber(c)
    if(n !== null) return n
  }
  return null
}

export function getCarPriceUSD(car:any){
  if(!car) return null
  const candidates = [car.price_usd, car.priceUsd]
  for(const c of candidates){
    const n = parsePriceNumber(c)
    if(n !== null) return n
  }
  return null
}

export function formatPLN(value:any){
  const n = parsePriceNumber(value)
  if(n === null) return ''
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Math.round(n))
}

export function formatCarPricePLN(car:any){
  const n = getCarPricePLN(car)
  if(n === null) return ''
  return formatPLN(n)
}

export function formatUSD(value:any){
  const n = parsePriceNumber(value)
  if(n === null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Math.round(n))
}

export function formatCarPriceUSD(car:any){
  const usd = getCarPriceUSD(car)
  if(usd === null) return ''
  return formatUSD(usd)
}
