
const fetch = require('@gasket/fetch');
const utility = require('./utils');
import { filter } from 'lodash';
import session from './session';
const env = require('../config/.env');
const PROXY_URL = '/aws/secure-data/';
console.log(`Hi you are in environment: ${env}`)
console.log('Call out from api.js we are in environment', env);
function getHeaders(additionalHeaders) {
    return {
        'Content-Type': 'application/json',
        ...additionalHeaders,
    }
}
async function secureProxyFetch(endpoint, params = {}, options = {}) {
    console.log('endpoint', endpoint);
    let urlParams = new URLSearchParams(params).toString();
    let url = `${PROXY_URL}${endpoint}`;
    if (urlParams) url += '?' + urlParams;
    //   let url = new URL(urlString);
    console.log(options);
    options.credentials = 'include';
    const res = await fetch(url, options);
    if (res.ok) {
        return await res.json();
    } else {
        return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);
    }
}
async function secureProxyPost(endpoint, params = {}, options = {}) {
    console.log('endpoint', endpoint);
    let urlParams = new URLSearchParams(params).toString();
    let url = '/aws/post-data/' + endpoint;
    if (urlParams) url += '?' + urlParams;
    //   let url = new URL(urlString);
    options.credentials = 'include';
    const res = await fetch(url, options);
    if (res.ok) {
        return await res.json();
    } else {
        return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);
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
async function submitPromptJob(table, job, filterOptions, extras) {
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
        method: 'GET',
        headers: getHeaders(),
        body: JSON.stringify(newJob),
    };
    try {
        const data = await secureProxyPost('submit-job', {}, options);
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    }
}

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
    console.log(filteredExtras);
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
    getTables, getTableFilters, submitRowCountRequest, submitPromptJob, submitSummaryPromptJob, getStatus, cancelJob, getResultsByRunId, getSummaryResultsByRunId
}
