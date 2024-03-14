
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');
import session from './session';
// Need to get URL from config file - gasket config or database
//const _token = process.env.AWS_API_TOKEN;
const _token = 'e2048a70-aa2a-4665-8843-8e24dba61b58';
const _headers = {
    'Content-Type': 'application/json',
    'token': _token
}
/*
getting table's list - GET method (api gateway1)
getting criteria/filters -  GET method (api gateway2)
get count - GET method (api gateway3)
submit option - POST method (api gateway4)
status page - GET method (api gateway5)
cancel option - POST method (api gateway6)
view results -  GET method (api gateway7)

*/
const api_calls =
{
    table_listing: {
        url: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'GET',
        function: 'getTables'
    },
    table_filters: {
        url: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'GET',
        function: 'getTableFilters'
    },
    table_data_row_count: {
        url: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'POST',
        function: 'submitRowCountRequest',
        body: {
            table_name: 'string',
            filterOptions: 'string'
        }
    },
    view_status: {
        url: `https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'GET',
        function: 'getStatus'
    },
    submit_job: {
        url: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/${enviro}`,
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
        url: `https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'POST',
        function: 'cancelJob',
        body: {
            run_id: 'string'
        }
    },
    view_results: {
        url: `https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'POST',
        body: {
            run_id: 'string'
        },
        function: 'getResultsByRunId'
    },
    view_summary: {
        url: `https://6n03hx5990.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'GET',
        queryParams: {
            run_id: 'string'
        },
        function: 'getSummaryResultsByRunId'
    },
    submit_summary_job: {
        url: `https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/${enviro}`,
        method: 'POST',
        body: {
            parent_run_id: 'string',
            new_run_id: 'string',
            model: 'string',
            prompt: 'string',
            count: 'string'
        },
        function: 'submitSummaryPromptJob'
    }

}
const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`, // Get
    view_status: `https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/${enviro}`, // GET
    table_filters: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`, // GET
    table_data_row_count: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/${enviro}`, //POST
    submit_job: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/${enviro}`, // POST
    cancel_job: `https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/${enviro}`, // POST
    view_results: `https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/${enviro}`, // POST
    view_summary: `https://6n03hx5990.execute-api.us-west-2.amazonaws.com/${enviro}`, // POST
    submit_summary_job: `https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/${enviro}` // POST
};
function getHeaders(additionalHeaders) {
    return {
        'Content-Type': 'application/json',
        'token': _token,
        ...additionalHeaders
    }
}
async function fetchData(endpoint, params = {}, options = {}) {
    let url = new URL(url_config[endpoint]);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
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
        "token": _token,
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
        const response = await fetch(url_config.submit_summary_job, options);
        const data = await response.json();
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
async function submitPromptJob(table, job, filterOptions, dateFilter) {
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type,
            null: option.checkbox_columns.find((column) => column.label == 'NULL').value
        }
    });
    cleanFilterOptions.push(dateFilter);
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

async function submitRowCountRequest(table, filterOptions, dateFilter) {
    // Remove extra properties from filterOptions
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type,
            null: option.checkbox_columns.find((column) => column.label == 'NULL').value
        }
    });
    cleanFilterOptions.push(dateFilter);
    const bodyObj = {
        "table_name": table,
        "filterOptions": cleanFilterOptions
    }
    // will change to get in future waiting on aws api
    const options = {
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(bodyObj)
    };
    try {
        const response = await fetch(url_config['table_data_row_count'], options);
        const data = await response.json();
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
        const data = await fetchData('table_listing', {}, options);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    }
}

module.exports = {
    getTables, getTableFilters, submitRowCountRequest, submitPromptJob, submitSummaryPromptJob, getStatus, cancelJob, getResultsByRunId, getSummaryResultsByRunId
}
