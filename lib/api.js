
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');
// Need to get URL from config file - gasket config or database
const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_toplevel_insights: `https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_email_insights: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_hosting_insights: `https://nojgwo9ci9.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_fetch_table_data: `not available yet`,
    submit_job: `not available yet`,

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
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(job),
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

/* 
        fetchTableData
        body: {
        table_name: 'table1',
        filterOptions = [{
            column_name: 'column1',
            column_selected_values: ['value1', 'value2', 'value3']
            column_data_type: 'string'
        },
        {
            column_name: 'column2',
            column_selected_values: [0, 2, 3]
            column_data_type: 'int'
        }
        ]
    }

*/
async function fetchTableData(table, filterOptions) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({ table, filterOptions }),
    };
    try {
        const response = await fetch(url_config[gdlh_fetch_table_data], options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return error;
    }
}
/*
    Function: getTableMetaData
    Description: Returns the meta data for the table
    Response: {

    }

*/
async function getTableMetaData(table) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'GET',
        headers,
    };
    try {
        const response = await fetch(url_config[table], options);
        const data = await response.json();
        const jsonData = JSON.parse(data.body);
        let columns = [...jsonData].map((column) => {
            return {
                ...column,
                column_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type),
                column_selected_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type),
                checkbox_columns: column.column_distinct_value_list.map((value) => { return { value: true, label: value } }),
                is_multi_select: true,
                label: utility.toTitleCase(column.column_name),
            }
        })
        return columns;
    } catch (error) {
        console.log(error);
        return error;
    }
}

async function getTables() {
    const headers = {
        'Content-Type': 'application/json',
    };
    const options = {
        method: 'GET',
        headers,
    };
    try {
        const response = await fetch(url_config.table_listing, options);
        const data = await response.json();
        let jsonData = JSON.parse(data.body);
        let tables = [...jsonData].map((table) => {
            return {
                ...table,
                tables: table.column_value_list,
                label: utility.toTitleCase(table.column_name),
            }
        })
        return tables[0] || [];
    } catch (error) {
        console.log(error);
        return error;
    }
}

module.exports = {
    getTables, getTableMetaData
}
