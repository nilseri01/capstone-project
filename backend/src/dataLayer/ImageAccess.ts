import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { ImageItem } from '../models/ImageItem'

const XAWS = AWSXRay.captureAWS(AWS)

function createDynamoDBClient() {
    return new XAWS.DynamoDB.DocumentClient()
}

export class ImageAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly imagesTable = process.env.IMAGES_TABLE,
        private readonly indexName = process.env.INDEX_NAME,
        private readonly imageIndexName = process.env.IMAGE_INDEX_NAME
    ) { }

    async createImage(imageItem: ImageItem): Promise<ImageItem> {
        await this.docClient.put({
            TableName: this.imagesTable,
            Item: imageItem
        }).promise()

        return imageItem
    }

    async getImages(userId: String): Promise<ImageItem[]> {
        const result = await this.docClient.query({
            TableName: this.imagesTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        const items = result.Items
        return items as ImageItem[]
    }

    async getImageById(imageId: String): Promise<ImageItem[]> {
        const result = await this.docClient.query({
            TableName: this.imagesTable,
            IndexName: this.imageIndexName,
            KeyConditionExpression: 'id = :imageId',
            ExpressionAttributeValues: {
                ':imageId': imageId
            }
        }).promise();

        const items = result.Items
        return items as ImageItem[]
    }

    async deleteImage(imageId: String, userId: String) {
        await this.docClient.delete({
            TableName: this.imagesTable,
            Key: {
                imageId,
                userId
            }
        }).promise();
    }

    async updateUrl(imageId: String, userId: String, uploadUrl: String) {
        var params = {
            TableName: this.imagesTable,
            TableIndex: this.indexName,
            Key: {
                userId: userId,
                imageId: imageId
            },
            UpdateExpression: "set #uploadUrl = :a",
            ExpressionAttributeNames: {
                '#uploadUrl': 'uploadUrl'
            },
            ExpressionAttributeValues: {
                ":a": uploadUrl
            },
            ReturnValues: "UPDATED_NEW"
        };
        await this.docClient.update(params).promise();
    }

    async setProcessed(imageId: String) {
        var params = {
            TableName: this.imagesTable,
            TableIndex: this.indexName,
            Key: {
                imageId: imageId
            },
            UpdateExpression: "set #processed = :a",
            ExpressionAttributeNames: {
                '#processed': 'processed'
            },
            ExpressionAttributeValues: {
                ":a": true
            },
            ReturnValues: "UPDATED_PROCESS"
        };
        await this.docClient.update(params).promise();
    }
}