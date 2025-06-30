import React from "react";
import TextInput from "@ux/text-input";

const FilterFreeFormText = ({ eventChange, textValue = "", columnName }) => {
  function handleChange(e) {
    const separator = e.includes(",") ? "," : " ";
    const result = e.split(separator);
    eventChange({ data: result, name: columnName });
  }
  return (
    <TextInput
      label='Paste comma seperated values'
      placeholder='000123, 123455, 823455'
      value={textValue}
      onChange={handleChange}
      name='freeForm'
    />
  );
};
export default FilterFreeFormText;
