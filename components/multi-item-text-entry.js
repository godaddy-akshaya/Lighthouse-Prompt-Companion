import React, { useCallback, useState, useEffect } from 'react';
import { Lockup } from '@ux/layout';
import Button from '@ux/button';
import text from '@ux/text';
import Tag from '@ux/tag';
import TextEntry from '@ux/text-entry';
import FieldFrame from '@ux/field-frame';
import Add from '@ux/icon/add';
import Remove from '@ux/icon/remove';

// This just needs to spit out a list of items

/* 
     const debounceHandleLexicalSearch = useCallback(debounce((value) => setLexicalSearch({ ...lexicalSearch, column_selected_values: value.split(' ') }), 100), [],);

    function handleLexicalSearch(e) {
        debounceHandleLexicalSearch(e);
    }


*/

const MultiItemTextEntry = ({ items, label, onAddItem, onRemoveItem }) => {
    const [searchInput, setSearchInput] = useState('');
    const handleLexicalSearch = useCallback((e) => {
        setSearchInput(e);
    });
    const handleItemAdd = (e) => {
        onAddItem(searchInput);
    }
    const handleItemRemove = (e) => {
        onRemoveItem(e);
    }
    useEffect(() => {
        setSearchInput('');
    }, [items]);
    return (
        <>
            <text.label as='label' text={label} /><br />
            <FieldFrame >
                <TextEntry type='text' id='lexicalsearch' placeHolder='Type in term or word to search for...' onChange={handleLexicalSearch} value={searchInput} name='lexicalSearch' />
                <Button onClick={() => handleItemAdd()} label='' icon={<Add />} disabled={searchInput.length === 0} />
            </FieldFrame>

            <Lockup>
                {items?.map((item, index) => {
                    return (
                        <Tag className='m-t-1 m-r-1' emphasis='passive'><Button design='inline' onClick={() => handleItemRemove(item)} text={item} icon={<Remove />} /></Tag>
                    )
                })}
            </Lockup>
        </>
    )
};

export default MultiItemTextEntry;