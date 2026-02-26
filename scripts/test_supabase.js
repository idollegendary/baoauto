#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')

async function main(){
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!SUPABASE_URL || !SUPABASE_KEY){
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('Checking storage bucket "car-photos"...')
  try{
    const { data: listData, error: listErr } = await supabase.storage.from('car-photos').list('', { limit: 1 })
    if(listErr){
      console.error('Bucket access error:', listErr.message || listErr)
    }else{
      console.log('Bucket accessible. Sample items count:', Array.isArray(listData)? listData.length : 0)
    }
  }catch(e){
    console.error('Error checking bucket:', e.message || e)
  }

  console.log('\nTesting insert into `cars` table...')
  const testId = `test-${Date.now()}`
  const testCar = {
    id: testId,
    make: 'TestMake',
    title: 'Test Car from script',
    model: 'TS-1',
    generation: 'G1',
    year: 2026,
    km: 10,
    gearbox: 'Manual',
    fuel: 'Petrol',
    price: '€1',
    price_num: 1,
    image: null,
    images: null,
    description: 'Temporary test record'
  }

  try{
    const { data, error } = await supabase.from('cars').insert([testCar]).select().single()
    if(error){
      console.error('Insert error:', error.message || error)
      process.exitCode = 2
    }else{
      console.log('Inserted test car id:', data.id)
      // clean up
      const { error: delErr } = await supabase.from('cars').delete().eq('id', data.id)
      if(delErr) console.warn('Warning: failed to delete test row:', delErr.message || delErr)
      else console.log('Test row deleted successfully')
    }
  }catch(e){
    console.error('Error inserting test car:', e.message || e)
    process.exitCode = 3
  }
}

main()
