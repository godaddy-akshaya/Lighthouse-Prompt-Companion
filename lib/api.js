
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');
import session from './session';
// Need to get URL from config file - gasket config or database
const _token = 'e2048a70-aa2a-4665-8843-8e24dba61b58';
const _headers = {
    'Content-Type': 'application/json',
    'token': _token
}
const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
    view_status: `https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_filters: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_data_row_count: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/${enviro}`,
    submit_job: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/${enviro}`,
    cancel_job: `https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/${enviro}`,
    view_results: `https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/${enviro}`
};


async function getResultsByRunId(run_id) {
    const body = {
        "run_id": run_id,
    };
    const options = {
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(body),
    };
    try {
        const response = await fetch(url_config.view_results, options);
        const data = await response.json();
        if (data?.errorMessage) throw new Error(data.errorMessage);
        console.log(data);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    };
}
async function getStatus() {
    const body = {
        "user_id": `${session.getSessionItem("weblogin") || 'uh-oh-none-here'}`,
    };
    const options = {
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(body),
    };
    try {
        const response = await fetch(url_config.view_status, options);
        const data = await response.json();
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
        headers: _headers,
        body: JSON.stringify(body)
    }
    try {
        const response = await fetch(url_config.cancel_job, options);
        const data = await response.json();
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };

    }
}
async function submitPromptJob(table, job, filterOptions, dateFilter) {
    let cleanFilterOptions = filterOptions.filter((option) => option.has_been_modified).map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type,
            null: option.null
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
        headers: _headers,
        body: JSON.stringify(newJob),
    };
    try {
        const response = await fetch(url_config.submit_job, options);
        const data = await response.json();
        if (data?.errorMessage) throw new Error(data.errorMessage);
        return JSON.parse(data.body);
    } catch (error) {
        return { error: error };
    }
}

async function getTableRowCount(table, filterOptions, dateFilter) {
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
    const bodyObj = {
        "table_name": table,
    }
    const options = {
        method: 'POST',
        headers: _headers,
        body: JSON.stringify(bodyObj)
    };
    try {
        const response = await fetch(url_config['table_filters'], options);
        const data = await response.json();
        const jsonData = JSON.parse(data.body);
        // Adding additional value to the column_default_values
        const nullOption = { value: true, label: 'NULL' };
        let columns = [...jsonData].map((column) => {
            console.log(column);
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
        console.log(columns);
        return columns;
    } catch (error) {
        return { error: error };
    }
}

async function getTables() {
    const options = {
        method: 'GET',
        headers: _headers
    };
    try {
        const response = await fetch(url_config.table_listing, options);
        const data = await response.json();
        let jsonData = JSON.parse(data.body);
        return jsonData;
    } catch (error) {
        return { error: error };
    }
}

module.exports = {
    getTables, getTableFilters, getTableRowCount, submitPromptJob, getStatus, cancelJob, getResultsByRunId
}
