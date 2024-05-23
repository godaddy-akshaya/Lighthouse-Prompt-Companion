import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { debounce, get, has, set } from 'lodash';
import FilterCards from './filter-card/filter-cards';
import Card from '@ux/card';
import { Module, Block, Lockup } from '@ux/layout';
import FieldFrame from '@ux/field-frame';
import DateInput from '@ux/date-input';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import Button from '@ux/button';
import FilterMenu from './upload/filter-menu';
import LoadedFilter from './upload/loaded-filter';
import filterParamsMgmtService from '../lib/filter-params-mgmt-service';


// Object to hold the filter options
const DefaultFilterModel = {
    column_name: '',
    column_selected_values: [],
    has_been_modified: false,
    column_data_type: 'string',
};


const TableFilter = ({ filters, onSubmit }) => {
    const today = new Date();
    const formRef = React.createRef();
    const [dateOpen, setDateOpen] = useState(false);
    const minDateValue = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const [endDateValue, setEndDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`]);
    const [startDateValue, setStartDateValue] = useState([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`]);
    const [filterOptions, setFilterOptions] = useState([...filters]);
    const [enableFilterMenu, setEnableFilterMenu] = useState(true);
    const [showDateError, setShowDateError] = useState(false);
    const [page, setPage] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    const [dateValue, setDateValue] = useState({
        column_name: 'rpt_mst_date',
        column_selected_values: [startDateValue[0], endDateValue[0]],
        column_data_type: 'date',
        has_been_modified: true
    });

    const [uploadData, setUploadData] = useState({
        ...DefaultFilterModel,
        column_name: 'interaction_id',
        column_selected_values: [],
        column_data_type: 'string',
        has_been_modified: false,
    });
    const [lexicalSearch, setLexicalSearch] = useState({
        ...DefaultFilterModel,
        column_name: 'lexicalsearch',
        column_selected_values: [],
        column_data_type: 'string',
        has_been_modified: false
    });

    function handleTableRowSubmit(e) {
        const extras = [lexicalSearch, dateValue, uploadData].filter(extra => extra.column_selected_values.length > 0);
        onSubmit(filterOptions, extras);
    }
    const debounceHandleLexicalSearch = useCallback(debounce((value) => setLexicalSearch({ ...lexicalSearch, column_selected_values: value.split(' ') }), 100), [],);

    function handleLexicalSearch(e) {
        debounceHandleLexicalSearch(e);
    }

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

    function handleOpenChange(e) {
        setDateOpen(e);
    }
    function handleUploadChange(e) {
        setUploadData({ ...uploadData, column_selected_values: e.data, column_name: 'interaction_id', has_been_modified: true })
    }
    function handleCancelFilterLoad(e) {
        setUploadData({ ...uploadData, column_name: 'interaction_id', column_selected_values: [], has_been_modified: false });
    }
    function handleFilterMenuOpen() {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setEnableFilterMenu(!enableFilterMenu);
    }
    function handleEndDateValue(e) {
        setEndDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [startDateValue[0], e[0]] });
    }

    function handleFilterChange({ rowIndex, fresh_values }) {
        // Find index of the filter
        if (rowIndex === -1) return;
        console.log(rowIndex);
        let _filters = [...filterOptions];
        _filters[rowIndex] = {
            ..._filters[rowIndex],
            has_been_modified: true,
            checkbox_columns: [...fresh_values],
            column_selected_values: fresh_values.filter(column => column.value).map(column => column.label)
        }
        console.log(_filters[rowIndex]);
        setFilterOptions(_filters);
    }
    useEffect(() => {
        console.log('Filter Options have been updated', filterOptions);
    }, [filterOptions])
    return (
        <>  <text.h3 as='title' text='Available Filters' />
            <Card id='table-params-card' stretch={true}>
                <Module ref={formRef}>
                    <Block>
                        <div className='lh-container lh-between'>
                            <DateInput id='start' name='start-date' className={`m-r-1 ${dateOpen} ? 'z-me' : ''`} onOpenChange={handleOpenChange} onFocus={() => formRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })}
                                page={page}
                                onPaginate={setPage}
                                value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                            <DateInput id='end' name='end-date' className='lh-date-on-top' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                        </div>
                        {showDateError && <text.span emphasis='critical' as='paragraph' text='Sorry, cannot retrieve records from more than a year ago.' />}
                    </Block>
                    <Block>
                        {enableFilterMenu &&
                            <Lockup>
                                <FilterMenu onOpen={handleFilterMenuOpen} onFocus={() => formRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })} onChange={handleUploadChange} />
                            </Lockup>
                        }
                        {uploadData.column_selected_values.length > 0 &&
                            <Lockup>
                                <LoadedFilter rowCount={uploadData?.column_selected_values.length} columnName='Loaded Interaction IDs' onClear={handleCancelFilterLoad} />
                            </Lockup>
                        }
                    </Block>
                    <Block>
                        <Lockup>
                            <TextInput onFocus={() => formRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })} id='lexicalsearch' stretch='true' onChange={handleLexicalSearch} label='Transcripts that contain text' name='lexicalSearch' />
                        </Lockup>
                    </Block>
                    <Block>
                        <div className='lh-filter-container'>
                            {
                                filterOptions?.map((field, index) =>
                                    <FilterCards key={index} id={field.column_name} onChange={handleFilterChange} rowIndex={index} label={field.label} options={field.checkbox_columns} />
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