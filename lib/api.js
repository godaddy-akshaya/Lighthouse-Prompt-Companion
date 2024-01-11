
const fetch = require('@gasket/fetch');

// Need to get URL from config file - gasket config
const _url = 'https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev';
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

async function getTables() {
    const headers = {
        'Content-Type': 'application/json',
        'host': 'localhost',
        'Access-Control-Allow-Origin': '*',
        'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58',
        'token': 'e2048a70-aa2a-4665-8843-8e24dba61b58'
    }
    const response = await fetch(`${_url}`, {
        method: 'POST', headers
    });

    return response.json();
}
// async function getTableFilterOptions(tableID) {
//     const response = await fetch(`${_url}/${tableID}`, {
//         method: 'GET',
//         headers: new Headers({
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': '*',
//             'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58'
//         })
//     })
//     return response.json();
// }

// async function getTableData(tableFilterOptions) {
//     const response = await fetch(`https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev/${tableFilterOptions}`, {
//         method: 'GET',
//         headers: new Headers({
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': '*',
//             'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58'
//         })
//     })
//     return response.json();
// }

// async function submitJob(job) {
//     const response = await fetch(`https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev`, {
//         method: 'POST',
//         headers: new Headers({
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': '*',
//             'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58'
//         }), body: job
//     })
//     return response.json();
// }
// async function getResults(guid) {
//     const response = await fetch(`${_url}/${guid}`, {
//         method: 'GET',
//         headers: new Headers({
//             'Content-Type': 'application/json',
//             'Access-Control-Allow-Origin': '*',
//             'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58'
//         })
//     })
//     return response.json();
// }
const fakeData = [
    {
        "values": "{'7', '0', '5', '10', '9', '8', '6', '2', '3', '4', '1'}",
        "column_name": "css_score"
    }
    ,
    {
        "values": "{'TRUE', 'FALSE'}",
        "column_name": "repeat_contact_flag"
    }
    ,
    {
        "values": "{'Germany', 'Canada', 'India', 'United Kingdom', 'United States', 'Australia', 'China', 'Rest of World (RoW)'}",
        "column_name": "customer_type_name"
    }
    ,
    {
        "values": "{'7', '0', '5', '10', '9', '8', '6', '2', '3', '4', '1'}",
        "column_name": "nps_score"
    }
]

module.exports = {
    getTables
}
