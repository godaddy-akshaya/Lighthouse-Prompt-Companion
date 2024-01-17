
const fetch = require('@gasket/fetch');
const enviro = 'dev';
const utility = require('./utils');

const url_config = {
    table_listing: `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_toplevel_insights: `https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_email_insights: `https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/${enviro}`,
    gdlh_hosting_insights: `https://nojgwo9ci9.execute-api.us-west-2.amazonaws.com/${enviro}`,

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
// Need to get URL from config file - gasket config

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
