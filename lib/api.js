
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');
const { object } = require('prop-types');
// Need to get URL from config file - gasket config or database
const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_filters: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    table_data_row_count: `https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/${enviro}`,
    submit_job: `https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/${enviro}`,
};


/*
    Api Calls
    GET - getTables - returns a list of tables

    Return JSON -> [{table_name: 'table1', table_id: '1'}, {table_name: 'table2', table_id: '2'}]

    GET - getTableFilterOptions(tableID) - return avilable filter options
    Return JSON -> [{column_name: 'column1', values: ['value1', 'value2', 'value3']}]

    GET - getTableData(tableFilterOptions)

    Submit job sends information to run the batch job with prompt information
    POST - submitJob(job) -> returns sometype of acknolwedgement that the job was submitted
    Body: {
            "table_name": "top_level_insights_cc",
            "model": "claude-instant-v1",
            "no_of_transcripts": "200",
            "prompt": "pages and pages of prompt",
            "css_score": ["9","8","10"],
            "repeat_contact_flag": "TRUE",
            "customer_type_name": ["US Independent","Partner"],
            "nps_score": ["9","8","10"]
        }

            GET - getResults(guid) - returns results from the job
            

*/
/* 
    Function: submitPromptJob
    Description: Submits the job to the backend
    Body: {
        job_id: '1234',
        model: 'claude-instant-v1',
        no_of_transcripts: 200,
        prompt: 'pages and pages of prompt',

    }

*/
async function submitPromptJob(job) {
    let newJob = {
        "table_name": "vb_top_level_insights",
        "token": "e2048a70-aa2a-4665-8843-8e24dba61b58",
        "user_id": "userid",
        "run_id": "12345",
        "model": "claude",
        "prompt": "This is the prompt text",
        "count": "1356",
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
        return data;
    } catch (error) {
        console.log(error);
        return error;
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
        "token": 'e2048a70-aa2a-4665-8843-8e24dba61b58',
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
        "table_name": table,
        "token": "e2048a70-aa2a-4665-8843-8e24dba61b58"
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
        "token": 'e2048a70-aa2a-4665-8843-8e24dba61b58'
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
    getTables, getTableFilters, getTableRowCount
}
