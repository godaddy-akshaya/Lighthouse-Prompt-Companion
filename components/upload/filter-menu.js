import React, { useCallback, useEffect, useState } from 'react';
import { Block, Lockup } from '@ux/layout';
import Card from '@ux/card';
import Papa from 'papaparse';
import text from '@ux/text';
import Tag from '@ux/tag';
// UXCORE TODO: MenuSeperator has been renamed to MenuSeparator. Make any other adjustments needed
import { Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuSeparator } from '@ux/menu';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import Upload from '@ux/icon/upload';
import Spinner from '@ux/spinner';
import SaveObjectForm from './save-object-form';
import '@ux/icon/x/index.css';
import Alert from '@ux/alert';
import UploadTemplate from './upload-template';
import FieldFrame from '@ux/field-frame';
import TwoColumnLayout from '../layout/two-column-layout';
import filterParamsMgmtService from '../../lib/filter-params-mgmt-service';
import FilterFreeFormText from './filter-free-form-text';
import LoadedFilter from './loaded-filter';



const FilterMenu = ({ onChange, OnCancel }) => {
    const filterMenuRef = React.createRef();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [rowCount, setRowCount] = useState(null);
    const [AlertTag, setAlertTag] = useState(null);
    const [AlertMessage, setAlertMessage] = useState(null);
    const [savedFilters, setSavedFilters] = useState([]);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);

    const processFile = (uploadedFile) => {
        if (uploadedFile) {
            const fileExtension = uploadedFile.name.split('.').pop();
            if (fileExtension === 'csv') {
                processCSVFile(uploadedFile);
            } else {
                window.scrollTo(0, 200);
                setAlertTag('critical');
                setLoading(false);
                setAlertMessage('Use CSV file only, no xlsx or xls files allowed. Thank you!');

            }
        }
    };
    useEffect(() => {
        filterParamsMgmtService.getFilterOptions().then((data) => setSavedFilters(data?.sort()));
    }, []);
    const processCSVFile = (uploadedFile) => {
        try {
            Papa.parse(uploadedFile, {
                error: (error) => {
                    setAlertMessage('Error loading file, please try again');
                    setAlertTag('critical');
                },
                complete: (result) => {
                    const columnName = Object.keys(result.data[0])[0];
                    setRowCount(`${result.data?.length - 1 || 0}`)
                    setFileName(columnName);
                    setFileData(result.data.map((row) => row[columnName]));
                    setAlertTag('success');
                    setAlertMessage('File loaded successfully');
                    setLoading(false);
                    onChange({ data: result.data.map((row) => row[columnName]), name: columnName });
                    // Set message to null after 5 seconds
                    setTimeout(() => {
                        setAlertMessage(null);
                    }, 5000);
                },
                header: true
            });
        } catch (error) {
            setAlertMessage('Error loading file, please try again');
            setLoading(false);
            setAlertTag('critical');
        };
    };
    const handleSaveResults = (e) => {
        setLoading(true);
        filterParamsMgmtService.saveFilterOptions({ value: fileData, filename: e }).then((data) => {
            setHasBeenSaved(true);
            setLoading(false);
        });
    };
    const handleLoadFilter = useCallback((e) => {
        setLoading(true);
        filterParamsMgmtService.getFilterValues(e).then((data) => {
            // Check if string or array
            if (typeof data === 'string') {
                data = data.split(',');
            }
            setRowCount(data?.length);
            setFileData(data);
            setLoading(false);
            onChange({ data: data, column_name: 'interaction_id', name: e });
        }).catch((error) => {
            setLoading(false);
            setFileData([]);
            setRowCount(0);
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
        setHasBeenSaved(false);
        setAlertMessage(null);
        onChange({ data: [], name: '' });
    });
    const handleOpen = useCallback((e) => {
        setOpen(!open);
        setAlertMessage(null);
    })
    const handleFileChange = useCallback((e) => {
        setLoading(true);
        processFile(e.target.files[0]);
    });
    return <>
        {!open &&
            <>
                <Lockup className='lh-container lh-start'>
                    {loading && <Spinner size='sm' />}
                    <Menu ref={filterMenuRef} id='filter-menu'>
                        <MenuButton icon={<Upload />} design='secondary' text='Interaction IDs' />
                        <MenuList style={{ 'overflow-y': 'auto', 'max-height': '250px' }}>
                            <MenuItem onSelect={handleOpen}><Tag type='highlight'>Create New</Tag></MenuItem>
                            <MenuSeparator />
                            <MenuGroup label='Saved Lists'>
                                {savedFilters.map((filter) => <MenuItem onSelect={handleLoadFilter} key={filter}>{filter}</MenuItem>)}
                                {savedFilters.length === 0 && <MenuItem disabled>No saved filters</MenuItem>}
                            </MenuGroup>
                        </MenuList>
                    </Menu>
                </Lockup>
                {rowCount &&
                    <Lockup className='lh-container'>
                        <LoadedFilter rowCount={rowCount} columnName='Loaded Interaction IDs' onClear={handleCancel} />
                    </Lockup>
                }
            </>
        }
        {open &&
            <>
                <Lockup className='m-t-1'>
                    <text.h3 text='Upload Interaction IDs' as='title' />
                </Lockup>
                <Card className='card-dark-background' id='upload' stretch={true}>
                    {AlertMessage &&
                        <Block>
                            <Alert title={AlertMessage}
                                id='critical-message'
                                emphasis={AlertTag}
                                actions={<Button design="inline" text="Close" onClick={() => setAlertMessage(null)} />} />
                        </Block>}
                    <Block>
                        <Lockup>
                            <Tag type='highlight'>Create New</Tag>
                            <text.p as='paragraph' className='m-t-1' text='Please choose one of the options below to upload and save filter options. For file uploads, ensure that `interaction_id` is listed as a header. If you encounter any issues with saving or uploading, please use the provided template.' />
                        </Lockup>
                        {loading && <Spinner size='sm' />}
                        {!fileData &&
                            <>
                                <Block className='m-t-0'>
                                    <Lockup>
                                        <UploadTemplate />
                                    </Lockup>
                                </Block>
                                <Lockup>
                                    <TwoColumnLayout>
                                        <Lockup>
                                            <text.label as='label' text='Upload File Interaction IDs' />
                                            <FieldFrame>
                                                <input className='m-l-1 m-t-1 m-b-1' type="file" onChange={handleFileChange} />
                                            </FieldFrame>
                                        </Lockup>
                                        <Lockup>
                                            <FilterFreeFormText eventChange={handleFilterFreeForm} textValue={fileData?.toString() || null} />
                                        </Lockup>
                                    </TwoColumnLayout>
                                </Lockup>
                            </>}
                        {fileData &&
                            <Lockup>
                                <text.label as='label' text={`Loaded Interaction IDs : ${rowCount} rows`} />
                                <SaveObjectForm hasBeenSaved={hasBeenSaved} onSave={handleSaveResults}></SaveObjectForm>
                            </Lockup>
                        }
                    </Block>
                    <Block>
                        <SiblingSet gap='md'>
                            <Button text='Close' size='small' design='secondary' onClick={handleOpen} />
                            {fileData && <Button text='Reset/Clear' size='small' design='critical' onClick={handleCancel} />}
                        </SiblingSet>
                    </Block>
                </Card>
            </>
        }
    </>;
};
export default FilterMenu;
