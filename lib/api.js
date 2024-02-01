
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');
import session from './session';
// Need to get URL from config file - gasket config or database
const _token = 'e2048a70-aa2a-4665-8843-8e24dba61b58';
const _headers = {
    'Content-Type': 'application/json'
}
const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
    results: `https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_filters: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_data_row_count: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/${enviro}`,
    submit_job: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/${enviro}`,
    cancel_job: `https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/${enviro}`
};

async function getResults() {
    const body = {
        "token": _token, // token for some reason needs to be on top.
        "user_id": `${session.getSessionItem("weblogin") || 'uh-oh-none-here'}`,
    };
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    };
    try {
        const response = await fetch(url_config.results, options);
        const data = await response.json();
        if (data.body) {
            let finalData = [...JSON.parse(data.body)].map((item) => {
                return {
                    run_id: item.run_id,
                    run_date: item.run_date,
                    user_id: item.user_id,
                    status: item.status,
                    action: item.status === 'Submitted' || item.status === 'In Progress' ? 'cancel' : '',
                }
            });
            return finalData;
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
async function submitPromptJob(job) {
    let newJob = {
        "token": _token,
        "table_name": "gdlh_ai_email_insights_cln",
        "user_id": `${session.getSessionItem("weblogin") || 'test'}`,
        "run_id": `${job.guid}`,
        "model": "claude",
        "prompt": "This is the prompt text",
        "count": "24",
        "evaluation": "true/false",
        "evaluation_model": "evaluation model text",
        "evaluation_prompt": "This is the evaluation prompt text",
        "filterOptions": [
            {
                "column_name": "related_to_known_issue",
                "column_selected_values": [
                    "Unclear",
                    "No",
                    "Unknown"
                ],
                "column_data_type": "string"
            },
            {
                "column_name": "issue_resolution",
                "column_selected_values": [
                    "I don't know",
                    "Yes"
                ],
                "column_data_type": "string"
            },
            {
                "column_name": "rpt_mst_date",
                "column_selected_values": [
                    "2024-01-01",
                    "2024-01-10"
                ],
                "column_data_type": "date"
            }
        ]
    }
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'POST',
        headers,
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
    let cleanFilterOptions = filterOptions.map((option) => {
        return {
            column_name: option.column_name,
            column_selected_values: option.checkbox_columns.filter((column) => column.value).map((column) => column.label),
            column_data_type: option.column_data_type
        }
    });
    cleanFilterOptions.push(dateFilter);
    const bodyObj = {
        "token": _token,
        "table_name": table,
        "filterOptions": cleanFilterOptions
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    const options = {
        method: 'POST',
        headers,
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
        "token": _token,
        "table_name": table,

    }
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj)
    };
    try {
        const response = await fetch(url_config['table_filters'], options);
        const data = await response.json();
        const jsonData = JSON.parse(data.body);
        let columns = [...jsonData].map((column) => {
            return {
                ...column,
                column_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type),
                column_selected_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type),
                column_default_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type),
                checkbox_columns: column.column_distinct_value_list.map((value) => { return { value: true, label: value } }),
                is_multi_select: true,
                label: utility.toTitleCase(column.column_name),
            }
        })
        return columns;
    } catch (error) {
        return { error: error };
    }
}

async function getTables() {
    const bodyObj = {
        "token": _token
    }
    const headers = {
        'Content-Type': 'application/json',

    };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj)
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
    getTables, getTableFilters, getTableRowCount, submitPromptJob, getResults, cancelJob
}
