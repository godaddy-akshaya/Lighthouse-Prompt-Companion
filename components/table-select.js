import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { getTables } from '../lib/api';
import { Block } from '@ux/layout';
import Card from '@ux/card';
import text from '@ux/text';
import SelectInput from '@ux/select-input';

const TableSelect = ({ initialTables = null }) => {
    const router = useRouter();
    const [tables, setTables] = useState(initialTables);

    useEffect(() => {
        if (!tables) {
            getTables().then(data => {
                console.log(data);
                setTables(data)
            });
        }
    }, []);
    function handleTableRouteChange(event) {
        const selectedTable = event;
        let display_name = tables.find(table => table.column_name === event).display_name;
        router.push(`/table/${encodeURI(selectedTable)}?display_name=${encodeURI(display_name)}`);
    }
    return (
        <Block as='stack' orientation='vertical'>
            <Card id='table-select-card' className='grey-card'>
                <Block orientation='horizontal' >
                    <text.h4 as='title' text='Get Started' />
                    <text.p as='paragraph' text='To get this party started, select a table from the list below' />
                    {tables &&
                        <SelectInput className='select-table' label='' stretch={true} onChange={handleTableRouteChange} id='tables' name='select'>
                            <option value=''>Select...</option>
                            {tables?.map(table => <option key={table.column_name} value={table.column_name}>{table.display_name}</option>) || null}
                        </SelectInput>
                    }
                </Block>
            </Card>
        </Block>
    )
};



export default TableSelect;
