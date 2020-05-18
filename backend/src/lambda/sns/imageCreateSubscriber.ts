import { SNSEvent, SNSHandler } from 'aws-lambda'

import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ELASTICSEARCH_URL

const es = new elasticsearch.Client({
    hosts: [esHost],
    connectionClass: httpAwsEs
})

export const handler: SNSHandler = async (event: SNSEvent) => {
    for (const snsRecord of event.Records) {
        const image = JSON.parse(snsRecord.Sns.Message)

        await es.index({
            index: 'image-index',
            id: image.id,
            body: {
                userId: image.userId,
                imageId: image.id,
                createdDate: image.createdDate,
                name: image.name,
                watermark: image.watermark,
                processed: image.processed,
                uploadUrl: image.uploadUrl
            }
        })
    }
    await es.indices.refresh({ index: 'image-index' })
}