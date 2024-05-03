const fetch = require('@gasket/fetch');
const utility = require('./utils');
import session from './session';

function getHeaders(additionalHeaders) {
    return {
        'Content-Type': 'application/json',
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

export default class ClientApi {
    constructor(env) {
        this.env = env;
    }

    async getResultsByRunId(run_id) {
        const options = {
            method: 'GET',
            headers: getHeaders()
        };
        const data = await fetchData('view_results', { run_id: run_id }, options);
        return JSON.parse(data.body);
    }
    async getStatus() {
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
    async cancelJob(job) {
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

    async submitSummaryPromptJob(formData) {
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
    async getSummaryResultsByRunId(run_id) {
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
    async submitPromptJob(table, job, filterOptions, dateFilter) {
        console.log('submitPromptJob', table, job, filterOptions, dateFilter);
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

    async submitRowCountRequest(table, filterOptions, dateFilter) {
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
            headers: getHeaders(),
            body: JSON.stringify(bodyObj)
        };
        try {
            const data = await fetchData('table_data_row_count', {}, options);
            console.log(JSON.parse(data.body));
            return JSON.parse(data.body);
        } catch (error) {
            return { error: error };
        }
    }

    async getTableFilters(table) {
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

    async getTables() {
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

}