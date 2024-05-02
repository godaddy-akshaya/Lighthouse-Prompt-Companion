import utility from './utils.js';


async function columns$(column) {
    const nullOption = { value: true, label: 'NULL' };
    return {
        ...column,
        column_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        column_selected_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        column_default_values: utility.sortSelectOptions(column.column_distinct_value_list, column.column_data_type).concat('NULL'),
        checkbox_columns: (column.column_distinct_value_list.map((value) => { return { value: true, label: value } })).concat(nullOption),
        null: true,
        has_been_modified: false,
        is_multi_select: true,
        label: utility.toTitleCase(column.column_name)
    }
}

module.exports = { columns$ };


