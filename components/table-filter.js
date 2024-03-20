import React from 'react';
import { useState } from 'react';
import FilterCards from './filter-cards';
import Card from '@ux/card';
import { Module } from '@ux/layout';
import DateInput from '@ux/date-input';
import text from '@ux/text';
import Button from '@ux/button';
import SiblingSet from '@ux/sibling-set';

const TableFilter = ({ filters, onSubmit }) => {
    const today = new Date();
    const [endDateValue, setEndDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`]);
    const [startDateValue, setStartDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`]);
    const [filterOptions, setFilterOptions] = useState([...filters]);
    const [dateValue, setDateValue] = useState({
        column_name: 'rpt_mst_date',
        column_selected_values: [startDateValue[0], endDateValue[0]],
        column_data_type: 'date',
    });
    function handleTableRowSubmit(e) {
        console.log(filterOptions.length);
        onSubmit({ filterOptions, dateValue })
    }
    function handleSelectAll(e) {
        let _filters = [...filterOptions.map(filter => {
            if (filter.column_name === e.column_name) {
                return {
                    ...filter,
                    checkbox_columns: e.checkbox_columns.map(x => ({ ...x, value: true })),
                    column_selected_values: e.checkbox_columns.map(x => x.label)
                };
            }
            return filter;
        })];
        setFilterOptions(_filters);
    }
    function handleDeselectAll(e) {
        let _columns = [...filterOptions.map(column => {
            if (column.column_name === e.column_name) {
                return {
                    ...column,
                    checkbox_columns: e.checkbox_columns.map(x => ({ ...x, value: false })),
                    column_selected_values: []
                };
            }
            return column;
        })];
        setFilterOptions(_columns);

    }
    function handleStartDateValue(e) {
        setStartDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [e[0], endDateValue[0]] });
    }
    function handleEndDateValue(e) {
        setEndDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [startDateValue[0], e[0]] });
    }
    function handleFilterChange(e) {
        let _filters = filterOptions?.map(filter => {
            if (filter.column_name.toLowerCase() === e.column.toLowerCase()) {
                return {
                    ...filter,
                    has_been_modified: true,
                    checkbox_columns: filter.checkbox_columns.map(checkbox_column => {
                        if (checkbox_column.label === e.label) {
                            return { ...checkbox_column, value: e.value };
                        }
                        return checkbox_column;
                    })
                };
            }
            return filter;
        });
        setFilterOptions(_filters);
    }
    return (
        <Card id='table-params-card' stretch={true} title='Parameters'>
            <Module>
                {filterOptions?.length > 0 ? <text.h4 as='title' text='Available Filters' /> : null}
                {/* <SiblingSet gap='sm' stretch={true} >
                        <DateInput id='start' name='start-date' value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                        <DateInput id='end' name='end-date' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                    </SiblingSet> */}
                <div className='lh-filter-container'>
                    <div className='lh-container lh-between'>
                        <DateInput id='start' name='start-date' value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                        <DateInput id='end' name='end-date' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                    </div>
                </div>
                <div className='lh-filter-container'>
                    {
                        filterOptions?.map((field, index) =>
                            <FilterCards key={field.column_name} open={false} id={field.column_name} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} onChange={handleFilterChange} label={field.label} options={field} />
                        )
                    }
                </div>
                <Button text="Fetch Results" aria-label='Submit Results' onClick={handleTableRowSubmit} design='primary' />
            </Module>
        </Card>
    )
}


export default TableFilter;