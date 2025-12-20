import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import sharp from 'sharp'

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

if (!accountName || !accountKey || !containerName) {
  throw new Error('Azure Storage credentials not configured')
}

// Crear cliente de Blob Storage
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
)

const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName)

export interface UploadOptions {
  folder?: string // Ej: 'avatars', 'products'
  maxWidth?: number // Redimensionar imagen
  maxHeight?: number
  quality?: number // Calidad JPEG (1-100)
}

/**
 * Sube una imagen a Azure Blob Storage
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const {
      folder = 'uploads',
      maxWidth = 800,
      maxHeight = 800,
      quality = 85,
    } = options

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB')
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Procesar imagen con sharp (redimensionar y optimizar)
    const processedBuffer = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside', // Mantiene aspect ratio
        withoutEnlargement: true, // No agranda imágenes pequeñas
      })
      .jpeg({ quality }) // Convierte a JPEG
      .toBuffer()

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = 'jpg' // Siempre JPG después de procesar
    const blobName = `${folder}/${timestamp}-${randomString}.${extension}`

    // Subir a Azure
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    await blockBlobClient.uploadData(processedBuffer, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg',
        blobCacheControl: 'public, max-age=31536000', // Cache 1 año
      },
    })

    // Retornar URL pública
    const url = blockBlobClient.url
    
    console.log(`[Azure] ✅ Image uploaded: ${url}`)
    
    return url
  } catch (error) {
    console.error('[Azure] ❌ Upload error:', error)
    throw error
  }
}

/**
 * Elimina una imagen de Azure Blob Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extraer blob name de la URL
    const url = new URL(imageUrl)
    const blobName = url.pathname.split(`/${containerName}/`)[1]

    if (!blobName) {
      throw new Error('Invalid blob URL')
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.deleteIfExists()

    console.log(`[Azure] ✅ Image deleted: ${blobName}`)
    
    return true
  } catch (error) {
    console.error('[Azure] ❌ Delete error:', error)
    return false
  }
}

/**
 * Obtiene información de una imagen
 */
export async function getImageMetadata(imageUrl: string) {
  try {
    const url = new URL(imageUrl)
    const blobName = url.pathname.split(`/${containerName}/`)[1]

    if (!blobName) {
      throw new Error('Invalid blob URL')
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const properties = await blockBlobClient.getProperties()

    return {
      size: properties.contentLength,
      contentType: properties.contentType,
      lastModified: properties.lastModified,
      exists: true,
    }
  } catch (error) {
    console.error('[Azure] ❌ Metadata error:', error)
    return { exists: false }
  }
}

/**
 * Lista todas las imágenes en una carpeta
 */
export async function listImages(folder: string = 'uploads', limit: number = 100) {
  try {
    const images: string[] = []
    
    for await (const blob of containerClient.listBlobsFlat({ prefix: folder })) {
      if (images.length >= limit) break
      
      const url = `${containerClient.url}/${blob.name}`
      images.push(url)
    }

    return images
  } catch (error) {
    console.error('[Azure] ❌ List error:', error)
    return []
  }
}