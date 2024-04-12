import React, { useCallback } from 'react';
import { useState } from 'react';
import { debounce, has } from 'lodash';
import FilterCards from './filter-cards';
import Card from '@ux/card';
import { Module, Block, Lockup } from '@ux/layout';
import DateInput from '@ux/date-input';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import Button from '@ux/button';
import FilterUpload from './upload/filter-upload';

const TableFilter = ({ filters, onSubmit }) => {
    const today = new Date();
    const formRef = React.createRef();
    const minDateValue = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const [endDateValue, setEndDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`]);
    const [startDateValue, setStartDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`]);
    const [filterOptions, setFilterOptions] = useState([...filters]);
    const [showDateError, setShowDateError] = useState(false);
    const [page, setPage] = useState('2024-04-01');
    const [dateValue, setDateValue] = useState({
        column_name: 'rpt_mst_date',
        column_selected_values: [startDateValue[0], endDateValue[0]],
        column_data_type: 'date',
    });
    const [uploadData, setUploadData] = useState({
        column_name: '',
        column_selected_values: [],
        column_data_type: 'string',
        has_been_modified: false,
    });
    const [lexicalSearch, setLexicalSearch] = useState('');

    function handleTableRowSubmit(e) {
        const lexicalSearchModel = {
            column_name: 'lexicalsearch',
            column_selected_values: lexicalSearch.split(' '), // split the string into an array of words
            column_data_type: 'string',
        };
        const extras = [lexicalSearchModel, dateValue, uploadData];
        onSubmit(filterOptions, extras);
    }
    const debounceHandleLexicalSearch = useCallback(debounce((value) => setLexicalSearch(value), 100), [],);

    function handleLexicalSearch(e) {
        debounceHandleLexicalSearch(e);
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
    //const handleStartDateValue = useCallback((e) => setDateValue({ ...dateValue, column_selected_values: [e[0], endDateValue[0]] }), []);
    function checkDateMinValue(e) {
        return new Date(minDateValue) < new Date(e[0]);
    }
    function handleStartDateValue(e) {
        if (checkDateMinValue(e)) {
            setStartDateValue(e);
            setDateValue({ ...dateValue, column_selected_values: [e[0], endDateValue[0]] });
        } else {
            setShowDateError(true);
            setStartDateValue([minDateValue]);
            setDateValue({ ...dateValue, column_selected_values: [minDateValue, endDateValue[0]] });
        }

    }
    function handleUploadChange(e) {
        setUploadData({ ...uploadData, column_selected_values: e.data, column_name: e.name, has_been_modified: true })
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
        <>  <text.h3 as='title' text='Available Filters' />
            <Card id='table-params-card' stretch={true}>
                <Module ref={formRef}>
                    <Block>
                        <Lockup>
                            <div className='lh-filter-container'>
                                <div className='lh-container lh-between'>
                                    <DateInput id='start' name='start-date' onFocus={() => formRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })}
                                        page={page}
                                        onPaginate={setPage}
                                        className='m-r-1 lh-date-on-top'
                                        value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                                    <DateInput id='end' name='end-date' className='lh-date-on-top' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                                </div>
                                {showDateError && <text.span emphasis='critical' as='paragraph' text='Sorry, cannot retrieve records from more than a year ago.' />}
                            </div>
                        </Lockup>
                    </Block>


                    <Block>
                        <Lockup>
                            <TextInput onFocus={() => formRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })} id='lexicalsearch' stretch={true} onChange={handleLexicalSearch} label='Transcripts that contain text' name='lexicalSearch' />
                        </Lockup>
                    </Block>
                    <Block>
                        <Lockup>
                            <FilterUpload onChange={handleUploadChange} />
                        </Lockup>

                    </Block>
                    <Block>
                        <div className='lh-filter-container'>
                            {
                                filterOptions?.map((field, index) =>
                                    <FilterCards key={field.column_name} open={false} id={field.column_name} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} onChange={handleFilterChange} label={field.label} options={field} />
                                )
                            }
                        </div>
                    </Block>

                    <Button text="Fetch Results" aria-label='Submit Results' onClick={handleTableRowSubmit} design='primary' />
                </Module>
            </Card>       </>
    )
}


export default TableFilter;