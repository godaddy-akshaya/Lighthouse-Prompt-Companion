import React, { use, useCallback, useEffect, useState } from 'react';
import { Block, Lockup } from '@ux/layout';
import Card from '@ux/card';
import Alert from '@ux/alert';
import Papa from 'papaparse';
import text from '@ux/text';
import Tag from '@ux/tag';
import TextInput from '@ux/text-input';
import SelectInput from '@ux/select-input';
import { Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuSeperator } from '@ux/menu';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import FileUpload from '@ux/file-upload';
import Upload from '@ux/icon/upload';
import Flyout from '@ux/flyout';
import Filter from '@ux/icon/filter';
import Spinner from '@ux/spinner';
import Table from '@ux/table';
import Add from '@ux/icon/add';
import X from '@ux/icon/x';
import '@ux/icon/x/index.css';
import UploadTemplate from './upload-template';
import Download from '@ux/icon/download';
import Settings from '@ux/icon/settings';
import FieldFrame from '@ux/field-frame';
import TwoColumnLayout from '../layout/two-column-layout';
import SaveObjectForm from './save-object-form';
import { set } from 'lodash';
import filterParamsMgmtService from '../../lib/filter-params-mgmt-service';
const UPLOAD_LIMIT = 10000;



const FilterFreeFormText = ({ eventChange, textValue = '' }) => {
    function handleChange(e) {
        let separator = e.includes(',') ? ',' : ' ';
        let result = e.split(separator);
        eventChange({ data: result, name: 'interaction_id' });
    }
    return (
        <TextInput label='Paste comma seperated values' placeHolder='"000123", "123455", "823455"' value={textValue} onChange={handleChange} name='freeForm' />
    )
}
const FilterUpload = ({ onChange }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [rowCount, setRowCount] = useState(null);
    const [filterDataMeta, setFilterDataMeta] = useState(null);
    const [preCheckTag, setPreCheckTag] = useState(null);
    const [savedFilters, setSavedFilters] = useState([]);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);

    const processFile = (uploadedFile) => {
        if (uploadedFile) {
            const fileExtension = uploadedFile.name.split('.').pop();
            if (fileExtension === 'csv') {
                processCSVFile(uploadedFile);
            } else {
                alert('Invalid file type');
            }
        }
    };
    const handleSaveResults = (e) => {
        console.log(e);
        filterParamsMgmtService.saveFilterOptions({ value: fileData, filename: e }).then((data) => {
            console.log(data);
            setHasBeenSaved(true);
        });
    };
    useEffect(() => {
        filterParamsMgmtService.getFilterOptions().then((data) => setSavedFilters(data?.sort()));
    }, []);
    const processCSVFile = (uploadedFile) => {
        Papa.parse(uploadedFile, {
            error: (error) => {
                setPreCheck('Error parsing file');
                setPreCheckTag('error');
            },
            complete: (result) => {
                const columnName = Object.keys(result.data[0])[0];

                setRowCount(`${result.data?.length - 1 || 0}`)
                setFileName(columnName);
                setFileData(result.data.map((row) => row[columnName]));
                setPreCheckTag('success');
                setLoading(false);
                onChange({ data: result.data.map((row) => row[columnName]), name: columnName });
            },
            header: true
        });
    };
    const handleLoadFilter = useCallback((e) => {
        setLoading(true);
        filterParamsMgmtService.getFilterValues(e).then((data) => {
            // Check if string or array
            if (typeof data === 'string') {
                data = data.split(',');
            }
            setRowCount(data.length);
            console.log(data);
            setFileData(data);
            setLoading(false);
            onChange({ data: data, column: 'interaction_id', name: e });
        });

    });
    const handleFilterFreeForm = ((data) => {
        setRowCount(data.data.length);
        setFileData(data.data);
        onChange(data);
    });
    const handleCancel = useCallback(() => {
        setRowCount(null);
        setLoading(false);
        setFileData(null);
        setOpen(false);
        onChange({ data: [], name: '' });
    });
    const handleOpen = useCallback((e) => {
        setOpen(!open);
    })
    const handleFileChange = useCallback((e) => {
        setLoading(true);
        processFile(e.target.files[0]);
    });
    return (
        <>
            <Lockup className='lh-container lh-end'>
                {loading && <Spinner size='sm' />}
                <Menu id='filter-menu'>
                    <MenuButton icon={<Filter />} text='Interaction IDs' />
                    <MenuList>
                        <MenuItem onSelect={handleOpen}><Tag type='highlight'>Create New</Tag></MenuItem>
                        <MenuSeperator />
                        <MenuGroup label='Saved Lists'>
                            {savedFilters.map((filter) => <MenuItem onSelect={handleLoadFilter} key={filter}>{filter}</MenuItem>)}
                            {savedFilters.length === 0 && <MenuItem disabled>No saved filters</MenuItem>}
                        </MenuGroup>
                    </MenuList>
                </Menu>
            </Lockup>
            {open &&
                <>
                    <Lockup>
                        <text.h3 text='Upload Interaction IDs' as='title' />
                    </Lockup>
                    <Card className='card-dark-background' id='upload' stretch={true}>
                        <Block>
                            <Lockup>
                                <Tag type='highlight'>Create New</Tag>
                                <text.p as='paragraph' className='m-t-1' text='Chose one of the options below to upload and save filter options' />
                            </Lockup>
                            {loading && <Spinner size='sm' />}
                            {!fileData &&
                                <Block>
                                    <TwoColumnLayout>
                                        <Lockup>
                                            <text.label as='label' text='Upload File Interaction IDs' />
                                            <FieldFrame helpMessage={<UploadTemplate className='m-t-1' />}>
                                                <input className='m-l-1 m-t-1 m-b-1' type="file" onChange={handleFileChange} />
                                            </FieldFrame>
                                        </Lockup>
                                        <Lockup>
                                            <FilterFreeFormText eventChange={handleFilterFreeForm} textValue={fileData?.toString() || null} />
                                        </Lockup>
                                    </TwoColumnLayout>
                                </Block>
                            }
                            {fileData &&
                                <Lockup>
                                    <text.label as='label' text={`Loaded Interaction IDs : ${rowCount} rows`} />
                                    <SaveObjectForm hasBeenSaved={hasBeenSaved} onSave={handleSaveResults}></SaveObjectForm>
                                </Lockup>
                            }
                        </Block>

                        <Block>
                            <SiblingSet gap='sm'>
                                {fileData && <Button text='Cancel' size='small' design='critical' onClick={handleCancel} />}
                                <Button text='Close' size='small' design='secondary' onClick={() => setOpen(false)} />
                            </SiblingSet>
                        </Block>
                    </Card>

                </>
            }
            <Block>

            </Block>
        </>
    )
};

export default FilterUpload;
