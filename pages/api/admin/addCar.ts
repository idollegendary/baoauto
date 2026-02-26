import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).end()
  try{
    const body = req.body
    const secret = body.secret
    const ADMIN_SECRET = process.env.ADMIN_SECRET
    if(ADMIN_SECRET && secret !== ADMIN_SECRET && process.env.NODE_ENV !== 'development'){
      return res.status(403).json({error: 'invalid secret'})
    }

    const userFile = path.join(process.cwd(), 'data', 'userCars.json')
    let userCars:any[] = []
    if(fs.existsSync(userFile)){
      const raw = await fs.promises.readFile(userFile, 'utf8')
      userCars = JSON.parse(raw || '[]')
    }

    const newCar = Object.assign({}, body.car || {})
    newCar.id = (Date.now()).toString()
    // normalize images field
    if(newCar.images && typeof newCar.images === 'string'){
      newCar.images = newCar.images.split(',').map((s:string)=>s.trim()).filter(Boolean)
    }

    userCars.unshift(newCar)
    await fs.promises.writeFile(userFile, JSON.stringify(userCars, null, 2), 'utf8')

    res.status(201).json({ok:true, car:newCar})
  }catch(err){
    console.error(err)
    res.status(500).json({error: 'failed to save car'})
  }
}
