import React, { useCallback, useEffect, useState } from "react";
import Box from "@ux/box";
import Card from "@ux/card";
import Papa from "papaparse";
import text from "@ux/text";
import Tag from "@ux/tag";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuSeparator,
} from "@ux/menu";
import Button from "@ux/button";
import Upload from "@ux/icon/upload";
import Spinner from "@ux/spinner";
import SaveObjectForm from "./save-object-form";

import Alert from "@ux/alert";
import UploadTemplate from "./upload-template";
import FieldFrame from "@ux/field-frame";
import filterParamsMgmtService from "../../lib/filter-params-mgmt-service";
import FilterFreeFormText from "./filter-free-form-text";
import LoadedFilter from "./loaded-filter";

const BaseMenu = ({ onChange, menuText, enableSave = false, columnName }) => {
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
      const fileExtension = uploadedFile.name.split(".").pop();
      if (fileExtension === "csv") {
        processCSVFile(uploadedFile);
        setOpen(false);
      } else {
        window.scrollTo(0, 200);
        setAlertTag("critical");
        setLoading(false);
        setAlertMessage(
          "Use CSV file only, no xlsx or xls files allowed. Thank you!"
        );
      }
    }
  };
  useEffect(() => {
    filterParamsMgmtService
      .getFilterOptions()
      .then((data) => setSavedFilters(data?.sort()));
  }, []);

  const processCSVFile = (uploadedFile) => {
    try {
      Papa.parse(uploadedFile, {
        error: () => {
          setAlertMessage("Error loading file, please try again");
          setAlertTag("critical");
        },
        complete: (result) => {
          const _fileColumnName = Object.keys(result.data[0])[0];
          setRowCount(`${result.data?.length - 1 || 0}`);
          setFileName(columnName);
          setFileData(result.data.map((row) => row[_fileColumnName]));
          setAlertTag("success");
          setAlertMessage("File loaded successfully");
          setLoading(false);
          console.log(result.data.map((row) => row[_fileColumnName]));
          // Call onChange with the data and column name
          onChange({
            data: result.data
              .map((row) => row[_fileColumnName])
              .filter((row) => row !== undefined && row !== null && row !== ""),
            name: columnName,
          });
          // Set message to null after 5 seconds
          setTimeout(() => {
            setAlertMessage(null);
          }, 5000);
        },
        header: true,
      });
    } catch (error) {
      setAlertMessage("Error loading file, please try again");
      setLoading(false);
      setAlertTag("critical");
    }
  };
  const handleSaveResults = (e) => {
    setLoading(true);
    filterParamsMgmtService
      .saveFilterOptions({ value: fileData, filename: e })
      .then((data) => {
        setHasBeenSaved(true);
        setLoading(false);
      });
  };
  const handleLoadFilter = useCallback((e) => {
    setLoading(true);
    filterParamsMgmtService
      .getFilterValues(e)
      .then((data) => {
        // Check if string or array
        if (typeof data === "string") {
          data = data.split(",");
        }
        setRowCount(data?.length);
        setFileData(data);
        setLoading(false);
        onChange({
          data: data,
          column_name: `${columnName}`,
          name: columnName,
        });
      })
      .catch((error) => {
        setLoading(false);
        setFileData([]);
        setRowCount(0);
      });
  });
  const handleFilterFreeForm = (event) => {
    setRowCount(event.data.length);
    setFileData(event.data);
    setOpen(false);
    onChange({ data: event.data, name: event.name || columnName });
  };
  const handleCancel = useCallback(() => {
    setRowCount(null);
    setLoading(false);
    setFileData(null);
    setOpen(false);
    setHasBeenSaved(false);
    setAlertMessage(null);
    onChange({ data: [], name: `${columnName}` });
  });
  const handleOpen = useCallback((e) => {
    setOpen(!open);
    setAlertMessage(null);
  });
  const handleFileChange = useCallback((e) => {
    setLoading(true);
    processFile(e.target.files[0]);
  });

  return (
    <Box gap='sm' className='upload-menu'>
      {!open && rowCount && (
        <>
          <LoadedFilter
            rowCount={rowCount}
            columnName={`Loaded ${menuText}`}
            onClear={handleCancel}
          />
          {fileData && enableSave && (
            <Card id='save-upload' space={{ block: "md", inline: "md" }}>
              <text.label as='label' text={`Loaded Ids: ${rowCount} rows`} />
              <SaveObjectForm
                hasBeenSaved={hasBeenSaved}
                onSave={handleSaveResults}
              ></SaveObjectForm>
            </Card>
          )}
        </>
      )}
      {!open && !rowCount && (
        <Menu id={`id${columnName}`} ref={filterMenuRef}>
          <MenuButton icon={<Upload />} design='secondary' text={menuText} />
          <MenuList style={{ overflowY: "auto", maxHeight: "250px" }}>
            <MenuItem onSelect={handleOpen}>
              <Tag type='highlight'>Upload</Tag>
            </MenuItem>
            {enableSave && (
              <>
                <MenuSeparator />
                {loading && <Spinner size='sm' />}
                <MenuGroup label='Saved Lists'>
                  {savedFilters.map((filter) => (
                    <MenuItem onSelect={handleLoadFilter} key={filter}>
                      {filter}
                    </MenuItem>
                  ))}
                  {savedFilters.length === 0 && (
                    <MenuItem disabled>No saved filters</MenuItem>
                  )}
                </MenuGroup>
              </>
            )}
          </MenuList>
        </Menu>
      )}

      {AlertMessage && (
        <Box>
          <Alert
            title={AlertMessage}
            id='critical-message'
            emphasis={AlertTag}
            actions={
              <Button
                design='inline'
                text='Close'
                onClick={() => setAlertMessage(null)}
              />
            }
          />
        </Box>
      )}
      {open && (
        <Box orientaion='horizontal' inlinePadding='md'>
          <Button
            id='close-button'
            design='secondary'
            text='Cancel'
            onClick={handleOpen}
          />

          {!fileData && (
            <Box orientation='vertical'>
              <Card
                id='upload'
                space={{ block: "sm", inline: "sm" }}
                className='m-t-1'
              >
                <Box
                  orientaion='horizontal'
                  inlineAlignChildren='start'
                  blockPadding='sm'
                  inlinePadding='sm'
                >
                  <Box>
                    <text.h3 text={menuText} as='title' />
                    <Box>
                      {loading && <Spinner size='sm' />}

                      <text.p
                        as='paragraph'
                        text={`Choose one of the options below. For file uploads, ensure that ${columnName} 
                     is listed as a header. 
                     If you encounter any issues with saving or uploading, please use the provided template.`}
                      />
                      <UploadTemplate />
                      <Box gap='md' blockPadding='sm'>
                        <FieldFrame>
                          <input
                            className='m-l-1 m-t-1 m-b-1'
                            type='file'
                            onChange={handleFileChange}
                          />
                        </FieldFrame>
                        <FilterFreeFormText
                          eventChange={handleFilterFreeForm}
                          textValue={fileData?.toString() || null}
                          columnName={columnName}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BaseMenu;
