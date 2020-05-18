// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'noa5k8rr02'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-2.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'nilseri.auth0.com',            // Auth0 domain
  clientId: 'xIAN3QeoiR437nWgpF01cxog9w4kAaH6',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
