/* eslint-disable  */
import utility from './utils.js';


async function columns$(column) {
  const nullOption = { value: true, label: 'NULL' };
  return {
    ...column,
    column_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
    column_selected_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
    column_default_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
    checkbox_columns: (column.column_distinct_value_list.map((value) => { return { value: true, label: value }; })).concat(nullOption),
    null: true,
    has_been_modified: false,
    is_multi_select: true,
    label: utility.toTitleCase(column.column_name)
  };
}
async function filterOptions$(filterOptions) {
  return filterOptions.filter((option) => option.has_been_modified).map((option) => {
    return {
      column_name: option.column_name,
      column_selected_values: option.checkbox_columns.filter((column) => column.label != 'NULL').filter((column) => column.value).map((column) => column.label),
      column_data_type: option.column_data_type,
      null: option.checkbox_columns.find((column) => column.label == 'NULL').value
    };
  });
}
async function promptModel$(model, job, table, session, filterOptions) {
  const promptModel = {
    table_name: `${table}`, // `table_name` is the table name from the dropdown in the UI
    user_id: `${session.getSessionItem('weblogin') || 'not finding it'}`,
    run_id: `${job.run_id}`,
    model: `${job.model.model}`,
    provider: `${job.model.provider}`,
    prompt: `${job.prompt}`,
    count: `${job.count}`,
    evaluation: `${job.evaluation}`,
    evaluation_model: `${job.evaluation_model.model}`,
    evaluation_prompt: `${job.evaluation_prompt}`,
    evaluation_provider: `${job.evaluation_model.provider}`,
    filterOptions: filterOptions
  };
  return { ...promptModel, model };

}

module.exports = { columns$, filterOptions$, promptModel$ };


