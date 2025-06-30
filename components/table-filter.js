import React, { useCallback } from "react";
import { useState } from "react";
import { debounce, update } from "lodash";
import FilterCards from "./filter-card/filter-cards";
import Card from "@ux/card";
import { Block, Lockup } from "@ux/layout";
import DateInput from "@ux/date-input";
import TextInput from "@ux/text-input";
import text from "@ux/text";
import Button from "@ux/button";
import Box from "@ux/box";
import ShopperIds from "./upload/shopper-ids";
import InteractionIds from "./upload/interaction-ids";
import upload from "@ux/icon/upload";

// Object to hold the filter options
const DefaultFilterModel = {
  column_name: "",
  column_selected_values: [],
  has_been_modified: false,
  column_data_type: "string",
};

const TableFilter = ({ filters, onSubmit }) => {
  const uploadOptions = ["interaction_id", "shopper_id"];
  const today = new Date();
  const formRef = React.createRef();
  const [dateOpen, setDateOpen] = useState(false);
  const minDateValue = `${today.getFullYear() - 1}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [endDateValue, setEndDateValue] = useState([
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`,
  ]);
  const [startDateValue, setStartDateValue] = useState([
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`,
  ]);
  const [filterOptions, setFilterOptions] = useState([...filters]);
  const [enableFilterMenu, setEnableFilterMenu] = useState(true);
  const [showDateError, setShowDateError] = useState(false);
  const [lexicalSearchItems, setLexicalSearchItems] = useState([]);
  const [page, setPage] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`
  );
  const [dateValue, setDateValue] = useState({
    column_name: "rpt_mst_date",
    column_selected_values: [startDateValue[0], endDateValue[0]],
    column_data_type: "date",
    has_been_modified: true,
  });

  // Initialize uploadData with the uploadOptions
  const [uploadData, setUploadData] = useState([]);

  const [lexicalSearch, setLexicalSearch] = useState({
    column_name: "lexicalsearch",
    column_selected_values: [],
    column_data_type: "string",
    has_been_modified: false,
  });
  function handleAddSearchItem(e) {
    const _search = [...lexicalSearchItems];
    _search.push(e);
    setLexicalSearchItems(_search);
  }
  const handleLexicalSearch = (e) => {
    const value = [];
    value.push(e);
    debounceHandleLexicalSearch(value);
  };
  const debounceHandleLexicalSearch = useCallback(
    debounce(
      (value) =>
        setLexicalSearch({
          ...lexicalSearch,
          column_selected_values: value,
          has_been_modified: true,
        }),
      100
    ),
    []
  );

  function handleRemoveSearchItem(e) {
    const _search = [...lexicalSearchItems];
    _search.splice(_search.indexOf(e), 1);
    setLexicalSearchItems(_search);
  }
  function handleTableRowSubmit() {
    console.log(uploadData);
    const extras = [lexicalSearch, dateValue]
      .concat(uploadData)
      .filter((extra) => extra.column_selected_values?.length > 0);
    onSubmit(filterOptions, extras);
  }

  function checkDateMinValue(e) {
    return new Date(minDateValue) < new Date(e[0]);
  }
  function handleStartDateValue(e) {
    if (checkDateMinValue(e)) {
      setStartDateValue(e);
      setDateValue({
        ...dateValue,
        column_selected_values: [e[0], endDateValue[0]],
      });
    } else {
      setShowDateError(true);
      setStartDateValue([minDateValue]);
      setDateValue({
        ...dateValue,
        column_selected_values: [minDateValue, endDateValue[0]],
      });
    }
  }

  function handleOpenChange(e) {
    setDateOpen(e);
  }
  function handleUploadChange(e) {
    console.log("handleUploadChange", e);
    const index = uploadData.findIndex((item) => item.column_name === e.name);
    if (index !== -1) {
      // Update existing item
      const updatedItem = {
        ...uploadData[index],
        column_selected_values: [...e.data],
        has_been_modified: true,
      };
      setUploadData((prevData) =>
        prevData.map((item, i) => (i === index ? updatedItem : item))
      );
    } else {
      // Add new item
      setUploadData((prevData) => [
        ...prevData,
        {
          column_name: e.name,
          column_selected_values: [...e.data],
          has_been_modified: true,
          column_data_type: "string",
        },
      ]);
    }
  }
  function handleCancelFilterLoad(e) {
    setUploadData({
      ...uploadData,
      column_name: e.column_name,
      column_selected_values: [],
      has_been_modified: true,
      column_data_type: "string",
    });
  }
  function handleCancelFilterLoad(e) {
    setUploadData({
      ...uploadData,
      column_name: e.column_name,
      column_selected_values: [],
      has_been_modified: false,
    });
  }
  function handleFilterMenuOpen() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEnableFilterMenu(!enableFilterMenu);
  }
  function handleEndDateValue(e) {
    setEndDateValue(e);
    setDateValue({
      ...dateValue,
      column_selected_values: [startDateValue[0], e[0]],
    });
  }
  function handleOnFocus(e) {
    formRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }
  function handleFilterChange({ rowIndex, fresh_values }) {
    // Find index of the filter
    if (rowIndex === -1) return;
    const _filters = [...filterOptions];
    _filters[rowIndex] = {
      ..._filters[rowIndex],
      has_been_modified: true,
      checkbox_columns: [...fresh_values],
      column_selected_values: fresh_values
        .filter((column) => column.value)
        .map((column) => column.label),
    };
    setFilterOptions(_filters);
  }
  return (
    <>
      <text.h3 as='title' text='Available Filters' />
      <Card
        id='table-params-card'
        stretch
        space={{ block: "lg", inline: "lg" }}
      >
        {filters.length > 0 && (
          <Box ref={formRef}>
            <Box
              orientation='horizontal'
              inlineAlignChildren='start'
              blockPadding='lg'
              inlinePadding='lg'
            >
              <DateInput
                id='start'
                name='start-date'
                className={`m-r-1 ${dateOpen} ? 'z-me' : ''`}
                onOpenChange={handleOpenChange}
                onFocus={() =>
                  formRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                  })
                }
                page={page}
                onPaginate={setPage}
                value={startDateValue}
                onChange={handleStartDateValue}
                label='Start Date'
              />
              <DateInput
                id='end'
                name='end-date'
                className='lh-date-on-top'
                value={endDateValue}
                onChange={handleEndDateValue}
                label='End Date'
              />
              {showDateError && (
                <text.span
                  emphasis='critical'
                  as='paragraph'
                  text='Sorry, cannot retrieve records from more than a year ago.'
                />
              )}
            </Box>
            <Box
              orientation='horizontal'
              blockPadding='lg'
              inlinePadding='lg'
              inlineAlignChildren='start'
              gap='lg'
            >
              <Box>
                <InteractionIds
                  onChange={handleUploadChange}
                  ionFocus={() => handleOnFocus()}
                />
              </Box>
              <Box inlineAlignChildren='start'>
                <ShopperIds
                  onChange={handleUploadChange}
                  onFocus={() => handleOnFocus()}
                />
              </Box>
            </Box>
            <Block onFocus={handleOnFocus}>
              <Lockup>
                <TextInput
                  onFocus={() =>
                    formRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                      inline: "nearest",
                    })
                  }
                  id='lexicalsearch'
                  stretch
                  onChange={handleLexicalSearch}
                  label='Transcripts that contain text'
                  name='lexicalSearch'
                />
              </Lockup>
            </Block>
            <Box blockPadding='lg' inlinePadding='lg'>
              {filterOptions
                ?.sort((a, b) =>
                  a.column_name
                    .toString()
                    .localeCompare(b.column_name.toString())
                )
                .map((field, index) => (
                  <FilterCards
                    key={index}
                    id={field.column_name}
                    onChange={handleFilterChange}
                    rowIndex={index}
                    label={field.label}
                    options={field.checkbox_columns}
                  />
                ))}
            </Box>
            <Box
              orientation='horizontal'
              blockAlignChildren='end'
              inlinePadding='lg'
            >
              <Button
                text='Fetch Results'
                aria-label='Submit Results'
                onClick={handleTableRowSubmit}
                design='primary'
              />
            </Box>
          </Box>
        )}
      </Card>
    </>
  );
};

export default TableFilter;
