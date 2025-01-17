import React from 'react';
import TextInput from '@ux/text-input';


const FilterFreeFormText = ({ eventChange, textValue = '' }) => {
  function handleChange(e) {
    const separator = e.includes(',') ? ',' : ' ';
    const result = e.split(separator);
    eventChange({ data: result, name: 'interaction_id' });
  }
  return (
    <TextInput label='Paste comma seperated values' placeHolder='"000123", "123455", "823455"' value={textValue} onChange={handleChange} name='freeForm' />
  );
};
export default FilterFreeFormText;
