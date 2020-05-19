import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getHeaders } from '../utils'

import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

import { createLogger } from '../../utils/logger';

const logger = createLogger('image-get-es-list')

const esHost = process.env.ELASTICSEARCH_URL
const es = new elasticsearch.Client({
    hosts: [esHost],
    connectionClass: httpAwsEs
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const queryWord = event.queryStringParameters["query"]
    const userId = event.requestContext.authorizer.principalId;
    const result = await es.search({
        index: 'image-index',

        body: {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "name": queryWord
                            }
                        },
                        {
                            "match": {
                                "userId": userId
                            }
                        }
                    ]
                }
            }
        }
    })

    let response = []
    try {
        logger.info("get elasticsearch images success")
        response = result.hits.hits[0]._source;
    } catch (error) {
        logger.error(error)
        response = []
    }

    return {
        statusCode: 200,
        headers: getHeaders(),
        body: JSON.stringify({
            response
        })
    }
}