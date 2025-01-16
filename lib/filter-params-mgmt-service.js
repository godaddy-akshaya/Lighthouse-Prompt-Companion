const fetch = require('@gasket/fetch');
import session from './session';
const PROXY_URL = '/aws/secure-data/';
const PROXY_POST_URL = '/aws/post-data/';
function getHeaders(additionalHeaders) {
  return {
    'Content-Type': 'application/json',
    'weblogin': `${session.getSessionItem('weblogin') || 'uh-oh-none-here'}`,
    ...additionalHeaders
  };
}
async function secureProxy(endpoint, params = {}, options = {}, method = 'GET') {
  const urlParams = new URLSearchParams(params).toString();
  let url = `${method === 'GET' ? PROXY_URL : PROXY_POST_URL}${endpoint}`;
  if (urlParams) url += '?' + urlParams;
  options.credentials = 'include';
  const res = await fetch(url, options);
  if (res.ok) {
    return await res.json();
  }
  return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);

}
/*
    filterParms {
        filename: 'string',
        values: ['string']
    }
*/
class FilterParamsMgmtService {
  filterParams = {};
  filterOptions = [];
  constructor() {

  }
  addFilterParam(key, value) {
    this.filterParams[key] = value;
  }
  getFilterParams() {
    return this.filterParams;
  }
  async saveFilterOptions(fileNameAndData) {
    const options = {
      body: JSON.stringify(fileNameAndData),
      headers: getHeaders(),
      method: 'POST'
    };
    // Save the filter params to the database
    const data = await secureProxy('gdlh_save_interaction_ids', {}, options, 'POST');
    return data;
  }
  async getFilterValues(filename) {
    const params = {
      filename: filename
    };
    const data = await secureProxy('gdlh_get_interaction_ids', params, { headers: getHeaders() });
    return JSON.parse(data.body);
  }
  async getFilterOptions() {
    const data = await secureProxy('gdlh_get_interaction_ids', {}, { headers: getHeaders() });
    return JSON.parse(data.body);
  }
}
module.exports = new FilterParamsMgmtService();
