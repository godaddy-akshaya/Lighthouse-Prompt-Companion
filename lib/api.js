
const fetch = require('@gasket/fetch');

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
const _url = 'https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev';

async function getTables() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58',
    };
    const options = {
        method: 'POST',
        headers,
    };
    try {
        const response = await fetch(_url, options);
        console.log(response);
        const data = await response.json();

        return JSON.parse(data.body);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

module.exports = {
    getTables
}
