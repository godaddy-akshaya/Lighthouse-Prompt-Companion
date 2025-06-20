import fetch from '@gasket/fetch';
import gasket from '../../../gasket.js';
import { parseAwsApiResponse } from '../../../lib/api-parse-aws-response.js';

const getUrlForProxy = async (id) => {
  try {
    const config = await gasket.actions.getGasketData();
    if (!config || !config.api) {
      console.error('No API configuration found.');
      return ''; 
    }
    const target = config.api[id];
    return target.url || ''; 
  } catch (error) {
    console.error('Error in getUrlForProxy:', error);
    return '';
  }
};

export default async function handler(req, res) {
  const { id, ...queryParams } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  const targetUrl = await getUrlForProxy(id);
  const logger = await gasket.actions.getLogger();
  if (!targetUrl) {
    logger.error(`No target URL found for id: ${id}`);
    return res.status(400).json({ error: 'Invalid target URL' });
  }
  let fullUrl = targetUrl;
  if (queryParams) {
    const queryString = new URLSearchParams(queryParams).toString();
    fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
  }
  
  logger.info(JSON.stringify({ message: 'Proxy request', id, targetUrl, fullUrl }));
  const { host, ...incomingHeaders } = req.headers;
  const headers = {
    ...incomingHeaders,
    Authorization: `sso-jwt ${req.cookies.auth_jomax}`,
  };

  const options = {
    method: req.method,
    headers,
    ...(req.method === 'POST' && { body: JSON.stringify(req.body) }),
  };

  try {
    const response = await fetch(fullUrl, options);
    const result = await parseAwsApiResponse(response);
    if (result.error) {
      logger.error(`Error from target URL: ${result.error}`);
      return res.status(result.status || 500).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
