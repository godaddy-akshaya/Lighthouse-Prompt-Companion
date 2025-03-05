/* eslint-disable */
import fetch from '@gasket/fetch';

export default async function handler(req, res) {
  const URL = process.env.QUICKSIGHT_API || 'https://quicksight.api.dna.int.gdcorp.tools';
  const { id } = req.query;
  const DASHBOARD_ID = id;
  const REGION = 'us-west-2';
  const targetUrl = `${URL}/quicksight-dashboard?dashboardId=${DASHBOARD_ID}&region=${REGION}`;

  // Build the proxy request
  try {
    const proxyRequest = {
      method: 'GET',
      ...req.headers,
      headers: {
        Authorization: `sso-jwt ${req.cookies['auth_jomax']}`, // Add the cookie header
        'Content-Type': 'application/json', // Ensure content type is set
      },
    };
    
    // Forward the request to the target URL
    const response = await fetch(targetUrl, proxyRequest);
    const data = await response.json();
    const { EmbedUrl, Status, AnonymousUserArn } = data;

    // Return the response to the client
    res.status(response.status).json({ EmbedUrl, Status, AnonymousUserArn });
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
