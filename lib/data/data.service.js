/* eslint-disable eqeqeq */
import fetch from '@gasket/fetch';
import { sortSelectOptions, toTitleCase, sortArray } from '../utils.js'; // for sorting and other utils
import session from '../session.js';
// const PROXY_URL = '/aws/secure-data/';
// const PROXY_POST_URL = '/aws/post-data/';
const PROXY_URL = '/api/aws/';
const PROXY_POST_URL = '/api/aws/';
export class NetworkError extends Error {
  constructor(status, statusText, errorMessage) {
    super(errorMessage);
    this.name = 'NetworkError';
    this.status = status;
    this.statusText = statusText;
    this.errorMessage = errorMessage;
  }
}

export function getHeaders(additionalHeaders) {
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
  try {
    if (res.ok) return await res.json();
  } catch (error) {
    return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);
  }
}
export const secureProxyFetch = (endpoint, params, options) => secureProxy(endpoint, params, options, 'GET');
export const secureProxyPost = (endpoint, params, options) => secureProxy(endpoint, params, options, 'POST');

export async function validateLexicalQuery(query) {
  const _body = JSON.stringify({
    action: 'validate',
    query,
    query_name: '',
    description: ''
  });
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: _body
  };
  try {
    const data = await secureProxyPost('validate-lexical-query', {}, options);
    if (data?.body) {
      return JSON.parse(data.body);
    }
    if (data?.errorMessage) return { error: data.errorMessage };

    return data;
  } catch (error) {
    return { error: error };
  }
}

export async function getLexicalQueryHits(query) {
  const _body = JSON.stringify({ query: query });
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: _body
  };
  try {
    const response = await secureProxyPost('get-lexical-query-hits', {}, options);
    if (response?.body) {
      const data = JSON.parse(response.body);
      let groups = Object.entries(data).map(([key]) => key.split('_')[0]).filter((group) => group != 'total');
      const sections = Object.entries(data).map(([key, value]) => {
        if (key.startsWith('total')) {
          return { name: 'hit_'.concat(key), value };
        }
        return { name: key, value };
      });
      groups = [...new Set(groups)];
      groups = groups.map((group) => {
        return {
          name: group,
          sections: sections.filter((section) => section.name.startsWith(group)),
          count: sections.filter((section) => section.name === `${group}_count` || section.name === `${group}_hit_count`)[0]?.value || 0,
          total: sections.filter((section) => section.name === `${group}_total_count`)[0]?.value || 0,
          percentage: sections.filter((section) => section.name === `${group}_percentage` || section.name === `${group}_hit_percentage`)[0]?.value || 0
        };
      });
      return groups;
    }
    if (response?.errorMessage) return { error: response.errorMessage };
    if (response?.message) return { error: response.message };

    return [];
  } catch (error) {
    console.error('Error validating lexical query', error);
    return { error: 'There has been an issue.' };
  }
}

export async function getAllLexicalQueries() {
  const body = {
    action: 'get_all',
    query: {},
    query_name: ''
  };
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  };
  try {
    const data = await secureProxyPost('get-all-lexical-queries', {}, options);
    if (data?.body) {
      return JSON.parse(data.body);
    }
    return data;
  } catch (error) {
    return { error: 'Cannot get lexical queries', message: error };
  }
}

export async function deleteLexicalQuery({ queryId }) {
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query_name: queryId, query: {}, action: 'delete_query' })
  };
  try {
    const data = await secureProxyPost('delete-lexical-query', {}, options);
    if (data?.body) {
      return JSON.parse(data.body);
    }
    return data;
  } catch (error) {
    console.error('Error validating lexical query', error);
    return { error: error };
  }
}

export async function submitLexicalQuery({ query_name, query, description }) {
  const body = {
    query_name,
    description,
    query,
    action: 'insert_query'
  };
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  };
  try {
    const data = await secureProxyPost('submit-lexical-query', {}, options);
    if (data?.body) {
      return JSON.parse(data.body);
    }
    return data;
  } catch (error) {
    console.error('Error validating lexical query', error);
    return { error: error };
  }
}

export async function getResultsByRunId(run_id) {
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  const data = await secureProxyFetch('view-results', { run_id: run_id }, options);
  return JSON.parse(data.body);
}

export async function getStatus() {
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  try {
    const data = await secureProxyFetch('view-status', {}, options);
    if (data.body) {
      const finalData = [...JSON.parse(data.body)].map((item) => {
        return {
          run_id: item.run_id,
          run_date: item.run_date,
          last_updated_time: item.last_updated_time,
          query: item.query,
          user_id: item.user_id,
          status: item.status,
          action: item.status == 'Submitted' || item.status == 'In Progress' ? 'cancel' : item.status == 'Cancelled' ? '' : 'view'
        };
      });
      return sortArray(finalData, 'last_updated_time', false);
    }
    return data;
  } catch (error) {
    return { error: error };
  }
}

export async function cancelJob(job) {
  const body = {
    run_id: job.run_id,
    user_id: `${session.getSessionItem('weblogin') || 'uh-oh-none-here'}`
  };
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  };
  try {
    const data = await secureProxyPost('cancel-job', {}, options);
    if (data?.errorMessage) return new Error(data.errorMessage);
    return JSON.parse(data.body);
  } catch (error) {
    return { error: error };
  }
}

export async function submitSummaryPromptJob(formData) {
  const body = {
    user_id: `${session.getSessionItem('weblogin') || 'uh-oh-none-here'}`,
    ...formData
  };
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  };
  try {
    const data = await secureProxyPost('submit-summary-job', {}, options);
    if (data?.errorMessage) throw new Error(data.errorMessage);
    return data;
  } catch (error) {
    return { error: error };
  }
}

export async function getSummaryResultsByRunId(run_id) {
  const params = {
    run_id: run_id
  };
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  const data = await secureProxyFetch('view-summary', params, options);
  if (data?.body) return JSON.parse(data.body);
  if (data.errorMessage) throw new Error(data.errorMessage + ' ' + data.stackTrace);
  return data;
}

export async function submitPromptJob(table, job, filterOptions, extras) {
  try {
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
      return {
        column_name: option.column_name,
        column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
        column_data_type: option.column_data_type,
        null: option.checkbox_columns.find((column) => column.label == 'NULL').value
      };
    });
    cleanFilterOptions = cleanFilterOptions.concat(extras);
    const newJob = {
      table_name: `${table}`,
      user_id: `${session.getSessionItem('weblogin') || 'not finding it'}`,
      run_id: `${job.run_id}`,
      model: `${job?.model?.model.model_name}`,
      provider: `${job?.model?.model.provider}`,
      prompt: `${job?.prompt}`,
      count: `${job?.count}`,
      evaluation: `${job?.evaluation || false}`,
      evaluation_model: `${job.evaluation_model?.model || ''}`,
      evaluation_provider: `${job?.evaluation_model?.provider || ''}`,
      evaluation_prompt: `${job?.evaluation_prompt || ''}`,
      filterOptions: cleanFilterOptions
    };
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newJob)
    };
    const data = await secureProxyPost('submit-job', {}, options);
    if (data?.errorMessage) throw new Error(data.errorMessage);
    return data;
  } catch (error) {
    const payload = { errorMessage: 'An error occurred during saving', error: 'Error' };
    return payload;
  }
}

export async function submitRowCountRequest(table, filterOptions, extras) {
  let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
    return {
      column_name: option.column_name,
      column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
      column_data_type: option.column_data_type,
      null: option.checkbox_columns.find((column) => column.label == 'NULL').value
    };
  });
  const filteredExtras = extras.filter((extra) => extra.column_selected_values.length > 0);
  cleanFilterOptions = cleanFilterOptions.concat(filteredExtras);
  const bodyObj = {
    table_name: table,
    filterOptions: cleanFilterOptions
  };
  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bodyObj)
  };
  try {
    const data = await secureProxyPost('row-count', {}, options);

    if (data?.errorMessage) throw new Error(data.errorMessage);
    return JSON.parse(data.body);
  } catch (error) {
    return { error: error };
  }
}

export async function getTableFilters(table) {
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  const params = { table_name: table };
  try {
    const data = await secureProxyFetch('table-filters', params, options);
    if (data?.errorMessage) {
      return { errorMessage: data.errorMessage };
    };
    const jsonData = JSON.parse(data.body);
    const nullOption = { value: true, label: 'NULL' };
    const columns = [...jsonData].map((column) => {
      return {
        ...column,
        column_values: sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        column_selected_values: sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        column_default_values: sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        checkbox_columns: (column.column_distinct_value_list.map((value) => { return { value: true, label: value }; })).concat(nullOption),
        null: true,
        has_been_modified: false,
        is_multi_select: true,
        label: toTitleCase(column.column_name)
      };
    });
    return columns;
  } catch (error) {
    return { errorMessage: error };
  }
}

export async function getTables() {
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  try {
    const data = await secureProxyFetch('table-listing', {}, options);
    return JSON.parse(data.body);
  } catch (error) {
    return { error: error };
  }
}

export async function getModelList() {
  const options = {
    method: 'GET',
    headers: getHeaders()
  };
  try {
    const data = await secureProxyFetch('dynamic-model-list', {}, options);
    if (data?.body) return JSON.parse(data.body);
    return data;
  } catch (error) {
    return { error: 'Error getting dynamic list' };
  }
}