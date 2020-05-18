import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

import { getHeaders } from '../utils'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.IMAGES_TABLE;
const indexName = process.env.INDEX_NAME;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer.principalId;

  // TODO: NilS istenen şekli ile get et, paging vs.
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: indexName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise();

  const items = result.Items;

  return {
    statusCode: 200,
    headers: getHeaders(),
    body: JSON.stringify({
      items
    })
  }
}
