import React, { useEffect, useState } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import { Lockup, Block } from '@ux/layout';
import TextInput from '@ux/text-input';
import Button from '@ux/button';
import Checkbox from '@ux/checkbox';
import text from '@ux/text';
import { debounce, filter, set } from 'lodash';
import SiblingSet from '@ux/sibling-set';


const ItemFilterSearch = ({ items, onSubmit, OnCancel }) => {
    const restore = [...items];
    const myRef = React.createRef();
    const [selectAllChkBox, setSelectAllChkBox] = useState({
        value: true,
        label: 'Select All',
        static: true
    });
    const [selectAllSearchResultsChkBox, setSelectAllSearchResultsChkBox] = useState({
        value: true,
        'label': 'Select All Search Results',
        'static': true
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState(items);

    // Debounced filter function
    const debouncedFilter = debounce((term) => {
        if (!term || term.length === 0) return setFilteredItems(items);
        const filtered = items.filter(item =>
            item.label.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredItems(filtered);
    }, 300);
    const handleSubmitChanges = (e) => {
        onSubmit(filteredItems);
    }
    // Update state on input change
    const handleInputChange = (e) => {
        setSearchTerm(e);
        debouncedFilter(e);
    };

    const handleOnCancel = (items) => {
        setSearchTerm('');
        setFilteredItems(restore);
        setSelectAllChkBox({ ...selectAllChkBox, value: true });
        setSelectAllSearchResultsChkBox({ ...selectAllSearchResultsChkBox, value: true });
        OnCancel(restore);
    }

    const handleSelectAll = (e) => {
        setSelectAllChkBox({ ...selectAllChkBox, value: !selectAllChkBox.value });
        const updatedItems = [...filteredItems].map((item) => { return { ...item, value: !selectAllChkBox.value } });
        setFilteredItems(updatedItems);
    }
    useEffect(() => {
        // Perform initial filter if necessary
        debouncedFilter(searchTerm);
    }, [items]);

    const toggleChk = (e) => {
        const newModel = [...filteredItems];
        newModel[e].value = !newModel[e].value;
        setFilteredItems(newModel);
    }
    // Row component for react-window
    const Row = ({ index, style }) => (
        <div style={style} key={filteredItems[index]?.label} className='column'>
            <Checkbox key={filteredItems[index]?.label} id={filteredItems[index]?.label} onChange={() => toggleChk(index)} label={filteredItems[index]?.label}
                name={filteredItems[index]?.label} checked={filteredItems[index]?.value} />
        </div>
    );
    return (
        <>
            <Lockup>
                <text.label as='caption' text={`${filteredItems?.filter(item => item.value).length} of ${items.length}`} />
            </Lockup>
            <Lockup>
                <TextInput ref={myRef} onFocus={() => myRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })} type='search' id='search-term' label='' defaultValue={searchTerm} onChange={handleInputChange} placeholder='Just start typing...' />
            </Lockup>
            {filteredItems.length === 0 && <Lockup><text.p text='No results found' /></Lockup>}
            {filteredItems.length > 0 &&
                <>
                    {searchTerm === '' &&
                        <Lockup className='m-t-1'>
                            <Checkbox id={selectAllChkBox.label} label={selectAllChkBox.label} name={selectAllChkBox.label} onClick={handleSelectAll} checked={selectAllChkBox.value} />
                        </Lockup>
                    }
                    {searchTerm !== '' &&
                        <Lockup className='m-t-1'>
                            <Checkbox id={selectAllSearchResultsChkBox.label} label={selectAllSearchResultsChkBox.label} name={selectAllSearchResultsChkBox.label} onClick={handleSelectAll} checked={selectAllSearchResultsChkBox.value} />
                        </Lockup>
                    }
                </>}

            <List
                height={200} // Adjust the height as needed
                itemCount={filteredItems.length}
                itemData={filteredItems}
                itemSize={35} // Adjust the item size as needed
                width={'100%'}
                children={Row}
            />
            <Lockup className='m-t-1 m-b-1'>
                <SiblingSet stretch={true} gap='sm'>
                    <Button design='primary' text='OK' size='small' onClick={() => handleSubmitChanges(filteredItems)} />
                    <Button design='secondary' text='Cancel' size='small' onClick={() => handleOnCancel(filteredItems)} />
                </SiblingSet>
            </Lockup>
        </>

    );
};


export default ItemFilterSearch;

