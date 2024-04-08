
const fetch = require('@gasket/fetch');
const utility = require('./utils');
import session from './session';
const env = require('../config/.env');
const PROXY_URL = '/aws/secure-data';
console.log(`Hi you are in environment: ${env}`)
const api_calls_production = {
    "table_listing": {
        "method": "GET",
        "url": "https://lojoo506re.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "table_filters": {
        "method": "GET",
        "url": "https://xk89vym7gd.execute-api.us-west-2.amazonaws.com/gddeploy",
        "params": {
            "table_name": "string"
        }
    },
    "table_data_row_count": {
        "method": "POST",
        "url": "https://kby0c37h1j.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_status": {
        "method": "GET",
        "url": "https://x2x9swo6x5.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit_job": {
        "method": "POST",
        "url": "https://70bwwwm445.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "cancel_job": {
        "method": "POST",
        "url": "https://7y9v81tazb.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_results": {
        "method": "GET",
        "url": "https://nk7y0uidib.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "view_summary": {
        "method": "GET",
        "url": "https://jkb6iltdd7.execute-api.us-west-2.amazonaws.com/gddeploy"
    },
    "submit_summary_job": {
        "method": "POST",
        "url": "https://o4aj4d6r36.execute-api.us-west-2.amazonaws.com/gddeploy"
    }
}

const api_calls_development =
{
    table_listing: {
        url: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'GET'
    },
    table_filters: {
        url: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'GET'
    },
    table_data_row_count: {
        url: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'POST'
    },
    view_status: {
        url: `https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'GET'
    },
    submit_job: {
        url: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'POST',
        function: 'submitPromptJob',
        body: {
            table_name: 'string',
            user_id: 'string',
            run_id: 'string',
            model: 'string',
            prompt: 'string',
            count: 'string',
            evaluation: 'string',
            evaluation_model: 'string',
            evaluation_prompt: 'string',
            filterOptions: 'string'
        }
    },
    cancel_job: {
        url: `https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'POST'
    },
    view_results: {
        url: `https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'POST'
    },
    view_summary: {
        url: `https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'GET'
    },
    submit_summary_job: {
        url: `https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev`,
        method: 'POST'
    }
}
const api_calls = env === 'production' ? api_calls_production : api_calls_development;
function getHeaders(additionalHeaders) {
    return {
        'Content-Type': 'application/json',
        ...additionalHeaders,
    }
}
async function secureProxyFetch(endpoint, params = {}, options = {}) {
    let url = '/aws/secure-data';
    options.credentials = 'include';
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const res = await fetch(url, options);
    console.log(res);
    if (res.ok) {
        return await res.json();
    } else {
        return new Error(`Network response was not ok. Status: ${res?.status || 'error'} ${res?.statusText || res.errorMessage}`);
    }
}
async function fetchData(endpoint, params = {}, options = {}) {
    let url = new URL(api_calls[endpoint].url);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    // const res = await fetch(`/aws/secure-data`, options);
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
    const data = await fetchData('view_results', { run_id: run_id }, options);
    return JSON.parse(data.body);
}
async function getStatus() {
    const options = {
        method: 'GET',
        headers: getHeaders(),
    };
    try {
        const data = await fetchData('view_status', {}, options);
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
        const data = await fetchData('cancel_job', {}, options);
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
        const data = await fetchData('submit_summary_job', {}, options);

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
    const data = await fetchData('view_summary', params, options);

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
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newJob),
    };
    try {
        const data = await fetchData('submit_job', {}, options);
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
    cleanFilterOptions = cleanFilterOptions.concat(extras);
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
        const data = await fetchData('table_data_row_count', {}, options);
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
    const data = await fetchData('table_filters', params, options);
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
        headers: getHeaders(),
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
