import { ImageAccess } from '../dataLayer/imageAccess'
import { ImageItem } from '../models/ImageItem'

const imageAccess = new ImageAccess();
const bucketName = process.env.IMAGES_S3_BUCKET;

export async function createImage(image): Promise<ImageItem> {
    image.createdDate = new Date().toISOString()
    image.processed = false
    image.uploadUrl = `https://${bucketName}.s3.amazonaws.com/${image.id}`
    return await imageAccess.createImage(image);
}

export async function getImages(userId) {
    return await imageAccess.getImages(userId)
}

export async function deleteImage(imageId, userId) {
    return await imageAccess.deleteImage(imageId, userId)
}