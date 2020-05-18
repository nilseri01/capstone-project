import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

import { deleteImage } from '../../businessLayer/Image';
import { getHeaders, getUserId } from '../utils';
import { createLogger } from '../../utils/logger';

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.IMAGES_S3_BUCKET
const thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET

const logger = createLogger('image-delete')
const snsArn = process.env.SNS_ARN_DELETE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const imageId = event.pathParameters.imageId

    var params = { Bucket: bucketName, Key: imageId };
    s3.deleteObject(params);

    params = { Bucket: thumbnailBucketName, Key: imageId };
    s3.deleteObject(params);

    await deleteImage(imageId, userId);

    const snsClient = new XAWS.SNS();
    let imageRequest = {
      id: imageId
    }
    var snsParams = {
      Message: JSON.stringify(imageRequest),
      Subject: "[IMAGE-DELETION]",
      TopicArn: snsArn
    };

    await snsClient.publish(snsParams).promise();

    return {
      statusCode: 200,
      headers: getHeaders(),
      body: JSON.stringify({
      })
    }
  } catch (error) {
    logger.error(error.errorMessage)

    return {
      statusCode: 500,
      headers: getHeaders(),
      body: "Failed to delete image item"
    }
  }
}
