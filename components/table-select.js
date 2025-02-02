import React from 'react';
import { useRouter } from 'next/router';
import Box from '@ux/box';
import text from '@ux/text';
import SelectInput from '@ux/select-input';
import useTableList from '../hooks/use-table-list';
import Spinner from '@ux/spinner';


const TableSelect = () => {
  const { tables, loading, error } = useTableList();
  const router = useRouter();

  function handleTableRouteChange(event) {
    const selectedTable = event;
    const display_name = tables.find(table => table.column_name === event).display_name;
    router.push(`/table/${encodeURI(selectedTable)}?display_name=${encodeURI(display_name)}`);
  }
  return (
    <Box>
      {error && <text.p as='paragraph' text={error} />}
      {loading && <Box alignSelf='center' blockPadding='md' inlinePadding='md'><Spinner size='sm' /></Box>}
      {!loading && <>
        {tables?.length === 0 && <text.p as='paragraph' text='No tables found. Please contact the Lighthouse team for assistance' />}
        {tables?.length > 0 &&
          <SelectInput visualSize='lg' className='select-table' label='' helpMessage={loading ? 'loadding' : ''} stretch onChange={handleTableRouteChange} id='tables' name='select'>
            <option value=''>Select...</option>
            {tables?.map(table => <option key={table.column_name} value={table.column_name}>{table.display_name}</option>) || null}
          </SelectInput>
        } </>}
    </Box>
  );
};

export default TableSelect;
