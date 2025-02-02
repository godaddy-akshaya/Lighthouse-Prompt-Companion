import React, { useEffect, useState } from 'react';
import Card from '@ux/card';
import text from '@ux/text';
import Collapsible from '@ux/collapsible';
import ItemFilterSearch from './item-filter-search';

const FilterCardTitle = ({ isOpen, label, count }) => {
  const [showCount, setShowCount] = useState(false);
  useEffect(() => { setShowCount(!isOpen); }, [isOpen]);
  return (
    <>
      <div className='lh-title'>
        <text.label as='label' text={label} /><br />
        {showCount && <text.label as='caption' text={`${count}`} />}
      </div>
    </>
  );
};


const FilterCards = ({ options, label, id, rowIndex, onChange }) => {
  const orgState = [...options];
  const [checkboxColumns, setCheckboxColumns] = useState(options);
  const [open, setOpen] = useState(false);
  const handleCollapsibleChange = (e) => {
    if (open) {
      handleOnCancel(e);
    } else setOpen(open => !open);
  };
  const handleOnSumbit = (newOptions) => {
    // Need to return all of the options with the new values
    const opts = checkboxColumns.map((obj1) => {
      const obj2 = newOptions.find((obj2) => obj1.label === obj2.label);
      if (!obj2) return { ...obj1, value: false };
      return JSON.stringify(obj1) !== JSON.stringify(obj2) ? Object.assign(obj1, obj2) : obj1;
    });

    setCheckboxColumns(opts);
    // This returns the filter that they want to use
    onChange({ rowIndex, fresh_values: opts });
    setOpen(false);
  };

  const handleOnCancel = (e) => {
    setCheckboxColumns(orgState);
    setOpen(false);
  };
  return (
    <>
      <Card className='lh-filter-card' stretch id={id} space={{ block: true, inline: true, as: 'block' }}>
        <Collapsible defaultOpen={open} open={open} id={`${id}-coll`} onChange={handleCollapsibleChange} aria-label='collaspible-container' className='lh-no-padding'
          title={<FilterCardTitle count={`${checkboxColumns?.filter(r => r.value).length} of ${checkboxColumns?.length}`} label={label} isOpen={open} />}>
          <div className='lh-content'>
            <ItemFilterSearch items={checkboxColumns} onSubmit={handleOnSumbit} OnCancel={handleOnCancel} />
          </div>
        </Collapsible>
      </Card>
    </>
  );
};

export default FilterCards;
