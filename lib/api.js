
const fetch = require('@gasket/fetch');
const utility = require('./utils');
import session from './session';
const env = require('../config/.env');
const PROXY_URL = '/aws/secure-data/';
const PROXY_POST_URL = '/aws/post-data/';

function ensureJSONString(obj) {
    if (typeof obj === 'string') {
        try {
            JSON.parse(obj);
            return obj; // It's already a JSON string
        } catch (e) {
            // It's a string but not a valid JSON string, so we stringify it
            return JSON.stringify(obj);
        }
    } else {
        // It's not a string, so we stringify it
        return JSON.stringify(obj);
    }
}

class NetworkError extends Error {
    constructor(status, statusText, errorMessage) {
        super(errorMessage);
        this.name = 'NetworkError';
        this.status = status;
        this.statusText = statusText;
        this.errorMessage = errorMessage;
    }
}

function getHeaders(additionalHeaders) {
    return {
        'Content-Type': 'application/json',
        'weblogin': `${session.getSessionItem("weblogin") || 'uh-oh-none-here'}`,
        ...additionalHeaders,
    }
}

async function secureProxy(endpoint, params = {}, options = {}, method = 'GET') {
    let urlParams = new URLSearchParams(params).toString();
    let url = `${method === 'GET' ? PROXY_URL : PROXY_POST_URL}${endpoint}`;
    if (urlParams) url += '?' + urlParams;
    options.credentials = 'include';
    const res = await fetch(url, options);
    // const contentType = response.headers.get('Content-Type');
    // console.log(contentType);
    try {
        if (res.ok) {
            return await res.json();
        } else {
            return await res;
        }
    } catch (error) {
        return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);
    }

}
const secureProxyFetch = (endpoint, params, options) => secureProxy(endpoint, params, options, 'GET');
const secureProxyPost = (endpoint, params, options) => secureProxy(endpoint, params, options, 'POST');

async function validateLexicalQuery(query) {
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query })
    };
    try {
        const response = await secureProxyPost('validate-lexical-query', {}, options);
        const data = JSON.parse(response?.body || response);
        return data;
    } catch (error) {
        console.error('Error validating lexical query', error);
        return { error: error };
    }
}
async function getAllLexicalQueries() {
    const body = {
        action: 'get_all'
    };
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    };
    try {
        const response = await secureProxyFetch('get-all-lexical-query', {}, options);

        if (response.body && response.body instanceof ReadableStream) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';
            let done = false;

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                if (value) {
                    result += decoder.decode(value, { stream: !done });
                }
            }

            return JSON.parse(result);
        } else if (response.body) {
            return response.body;
        }

        return response;
    } catch (error) {
        console.log(error);
        return { error: 'Cannot get lexical queries', message: error };
    }
}
async function getAllLexicalQueries2() {
    const body = {
        action: 'get_all'
    }
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    };
    try {
        const response = await secureProxyFetch('get-all-lexical-query', {}, options);

        return JSON.parse(response.body);
    } catch (error) {
        return { error: 'Cannot get lexical queries', message: error };
    }
}


async function deleteLexicalQuery({ query_name, query }) {
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query_name, query, action: 'delete_query' })
    };
    try {
        const response = await secureProxyPost('delete-lexical-query', {}, options);
        const data = JSON.parse(response?.body || response);
        return data;
    } catch (error) {
        console.error('Error validating lexical query', error);
        return { error: error };
    }
}

async function submitLexicalQuery({ query_name, query }) {
    const body = {
        query_name,
        query,
        action: 'insert_query'
    }
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    };
    try {
        const response = await secureProxyPost('submit-lexical-query', {}, options);
        const data = JSON.parse(response?.body || response);
        return data;
    } catch (error) {
        console.error('Error validating lexical query', error);
        return { error: error };
    }
}

async function getResultsByRunId(run_id) {
    const options = {
        method: 'GET',
        headers: getHeaders()
    };
    const data = await secureProxyFetch('view-results', { run_id: run_id }, options);
    return JSON.parse(data.body);
}
async function getStatus() {
    const options = {
        method: 'GET',
        headers: getHeaders(),
    };
    try {
        const data = await secureProxyFetch('view-status', {}, options);
        if (data.body) {
            let finalData = [...JSON.parse(data.body)].map((item) => {
                return {
                    run_id: item.run_id,
                    run_date: item.run_date,
                    last_updated_time: item.last_updated_time,
                    query: item.query,
                    user_id: item.user_id,
                    status: item.status,
                    action: item.status == 'Submitted' || item.status == 'In Progress' ? 'cancel' : item.status == 'Cancelled' ? '' : 'view'
                }
            });
            return utility.sortArray(finalData, 'last_updated_time', false);
        }
        return data;
    } catch (error) {
        return { error: error };
    }
}
async function cancelJob(job) {
    const body = {
        "run_id": job.run_id,
        "user_id": `${session.getSessionItem("weblogin") || 'uh-oh-none-here'}`,
    }
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    }
    try {
        const data = await secureProxyPost('cancel-job', {}, options);
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    }
}

/**
 *  * @param {Object} formData {parent_run_id, new_run_id, model, prompt, count}
 * 
 */

async function submitSummaryPromptJob(formData) {
    const body = {
        user_id: `${session.getSessionItem("weblogin") || 'uh-oh-none-here'}`,
        ...formData
    }
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    }
    try {
        const data = await secureProxyPost('submit-summary-job', {}, options);
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return data;
    } catch (error) {
        return { error: error };
    }
}
async function getSummaryResultsByRunId(run_id) {
    const params = {
        "run_id": run_id,
    };
    const options = {
        method: 'GET',
        headers: getHeaders(),
    };
    const data = await secureProxyFetch('view-summary', params, options);
    if (data?.body) return JSON.parse(data.body);
    if (data.errorMessage) throw new Error(data.errorMessage + ' ' + data.stackTrace);
    return data;
}

/* 
  @param {String} table
  @param {Object} job
  @param {Array} filterOptions
  @param {Array} extras

  in table, job, filterOptions, extras
  out: 
  job : {
        "table_name": `${table}`, // `table_name` is the table name from the dropdown in the UI
        "user_id": `${session.getSessionItem("weblogin") || 'not finding it'}`,
        "run_id": `${job.run_id}`,
        "model": `${job.model}`,
        "prompt": `${job.prompt}`,
        "count": `${job.count}`,
        "evaluation": `${job.evaluation}`,
        "evaluation_model": `${job.evaluation_model}`,
        "evaluation_prompt": `${job.evaluation_prompt}`,
        "filterOptions": cleanFilterOptions
}
  }
*/

async function submitPromptJob(table, job, filterOptions, extras) {
    // Reduce the payload and filter out the rows with no changes
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type,
            null: option.checkbox_columns.find((column) => column.label == 'NULL').value
        }
    });
    cleanFilterOptions = cleanFilterOptions.concat(extras);
    let newJob = {
        "table_name": `${table}`, // `table_name` is the table name from the dropdown in the UI
        "user_id": `${session.getSessionItem("weblogin") || 'not finding it'}`,
        "run_id": `${job.run_id}`,
        "model": `${job.model}`,
        "prompt": `${job.prompt}`,
        "count": `${job.count}`,
        "evaluation": `${job.evaluation}`,
        "evaluation_model": `${job.evaluation_model}`,
        "evaluation_prompt": `${job.evaluation_prompt}`,
        "filterOptions": cleanFilterOptions
    }
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newJob),
    };
    try {
        const data = await secureProxyPost('submit-job', {}, options);
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return JSON.parse(data.body);
    } catch (error) {
        return new Error(error);
    }
}
/* 
*/
async function submitRowCountRequest(table, filterOptions, extras) {
    // Remove extra properties from filterOptions
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type,
            null: option.checkbox_columns.find((column) => column.label == 'NULL').value
        }
    });
    // filter out lexical values if empty
    let filteredExtras = extras.filter((extra) => extra.column_selected_values.length > 0);
    cleanFilterOptions = cleanFilterOptions.concat(filteredExtras);
    const bodyObj = {
        "table_name": table,
        "filterOptions": cleanFilterOptions
    }
    // will change to get in future waiting on aws api
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyObj)
    };
    try {
        const data = await secureProxyPost('row-count', {}, options);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    }
}

async function getTableFilters(table) {
    const options = {
        method: 'GET',
        headers: getHeaders()
    };
    const params = { table_name: table };
    const data = await secureProxyFetch('table-filters', params, options);
    const jsonData = JSON.parse(data.body);
    // Adding additional value to the column_default_values
    const nullOption = { value: true, label: 'NULL' };
    console.log(jsonData);
    let columns = [...jsonData].map((column) => {
        return {
            ...column,
            column_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
            column_selected_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
            column_default_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
            checkbox_columns: (column.column_distinct_value_list.map((value) => { return { value: true, label: value } })).concat(nullOption),
            null: true,
            has_been_modified: false,
            is_multi_select: true,
            label: utility.toTitleCase(column.column_name),
        }
    })
    return columns;
}

async function getTables() {
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

module.exports = {
    getTables,
    getTableFilters,
    submitRowCountRequest,
    submitPromptJob,
    submitSummaryPromptJob,
    getStatus,
    cancelJob,
    getResultsByRunId, getSummaryResultsByRunId, validateLexicalQuery, submitLexicalQuery,
    getAllLexicalQueries,
    deleteLexicalQuery,
    NetworkError
}
