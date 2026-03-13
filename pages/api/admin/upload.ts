import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import crypto from 'crypto'

// Disable Next's default bodyParser so formidable can parse multipart
export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})

  // lazy-load supabase client inside handler to avoid build-time errors
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:'Supabase not configured'})

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
  const MAX_OUTPUT_BYTES = 6 * 1024 * 1024

  // For formidable v3+, use the factory function and await parsing so Next waits for response
  const form = formidable({ multiples: true, maxFileSize: MAX_UPLOAD_BYTES })
  await new Promise<void>((resolve, reject)=>{
    form.parse(req, async (err: any, fields: any, files: any) => {
      if(err){
        console.error('form.parse error:', err)
        if(String(err?.message || '').toLowerCase().includes('maxfile')){
          res.status(400).json({error:'Файл занадто великий. Максимум 15MB'})
        }else{
          res.status(500).json({error:'parse error', detail: String(err)})
        }
        return resolve()
      }

      try{
        console.log('form.parse fields:', fields)
        console.log('form.parse files keys:', Object.keys(files || {}))
        const fileKeys = Object.keys(files || {})
        if(fileKeys.length === 0){
          console.error('no files in request', { files })
          res.status(400).json({error:'no files uploaded'})
          return resolve()
        }

        const fileKey = fileKeys[0]

        const file = (files as any)[fileKey]
        console.log('uploaded file props:', Object.keys(file || {}))

        // formidable may return an array for the field when multiples=true
        const uploaded = Array.isArray(file) ? file[0] : file
        // handle different formidable versions/fields
        const filepath = uploaded?.filepath || uploaded?.path || uploaded?.file?.filepath || uploaded?.file?.path
        const mime = uploaded?.mimetype || uploaded?.type || 'application/octet-stream'

        if(!filepath){
          console.error('no filepath for uploaded file', { file })
          res.status(500).json({error:'uploaded file missing filepath'})
          return resolve()
        }

        const inputBuffer = await fs.promises.readFile(filepath)
        if(inputBuffer.length > MAX_UPLOAD_BYTES){
          res.status(400).json({error:'Файл занадто великий. Максимум 15MB'})
          return resolve()
        }

        let sharpLib: any = null
        try{
          sharpLib = (await import('sharp')).default
        }catch(e){
          console.warn('sharp is not available, upload without conversion')
        }

        let outputBuffer = inputBuffer
        let outputContentType = mime
        let outputExt = mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'bin'

        if(sharpLib && /^image\//.test(mime)){
          try{
            const source = sharpLib(inputBuffer, { failOnError: false }).rotate()
            const metadata = await source.metadata()
            const targetFormat = inputBuffer.length > 3 * 1024 * 1024 ? 'avif' : 'webp'

            let pipeline = source.resize({
              width: 2200,
              height: 1600,
              fit: 'inside',
              withoutEnlargement: true,
            })

            if(targetFormat === 'avif'){
              outputBuffer = await pipeline.avif({ quality: 52, effort: 4 }).toBuffer()
              outputContentType = 'image/avif'
              outputExt = 'avif'
            }else{
              outputBuffer = await pipeline.webp({ quality: 78, effort: 4 }).toBuffer()
              outputContentType = 'image/webp'
              outputExt = 'webp'
            }

            if(outputBuffer.length > MAX_OUTPUT_BYTES){
              if(targetFormat === 'avif'){
                outputBuffer = await source.resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true }).avif({ quality: 45, effort: 4 }).toBuffer()
                outputContentType = 'image/avif'
                outputExt = 'avif'
              }else{
                outputBuffer = await source.resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true }).webp({ quality: 68, effort: 4 }).toBuffer()
                outputContentType = 'image/webp'
                outputExt = 'webp'
              }
            }

            if(metadata && metadata.width && metadata.height){
              console.log('optimized image', {
                source: `${metadata.width}x${metadata.height}`,
                inputBytes: inputBuffer.length,
                outputBytes: outputBuffer.length,
                format: outputExt,
              })
            }
          }catch(e){
            console.warn('sharp optimization failed, using original file', e)
            outputBuffer = inputBuffer
            outputContentType = mime
          }
        }

        const safeName = `${Date.now()}_${crypto.randomUUID()}.${outputExt}`
        const bucket = 'car-photos'

        // ensure bucket exists (ignore error if exists)
        try{
          await supabase.storage.createBucket(bucket, { public: true })
        }catch(e){ console.warn('createBucket ignored error', String(e)) }

        const { data, error:upErr } = await supabase.storage.from(bucket).upload(safeName, outputBuffer, {contentType: outputContentType})
        if(upErr){
          console.error('supabase upload error:', upErr)
          res.status(500).json({error: upErr.message || String(upErr)})
          return resolve()
        }

        // get public URL
        const pub = supabase.storage.from(bucket).getPublicUrl(data.path)
        // handle both v1/v2 shapes
        const publicURL = (pub as any)?.publicURL || (pub as any)?.data?.publicUrl || (pub as any)?.data?.publicURL || (pub as any)?.data?.publicUrl
        res.status(200).json({url: publicURL})
        return resolve()
      }catch(e:any){
        console.error('upload handler error:', e)
        res.status(500).json({error: e.message || 'upload failed'})
        return resolve()
      }
    })
  })
}
