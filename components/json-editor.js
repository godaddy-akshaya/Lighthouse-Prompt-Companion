import React, { useCallback, useEffect, useId, useRef } from 'react';
import classNames from 'classnames';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, jsPropertySyntax: true })
  .addVocabulary(['localizable']);
addFormats(ajv);

// jsoneditor is not compatible with ajv@8 because the format of errors is
// different. We cannot revert to ajv@6 because it doesn't support our config
// rules schema. Monkeypatch so that we can remap errors to the format expected
// by jsoneditor
//
// https://github.com/josdejong/jsoneditor/issues/1371
const origCompile = ajv.compile;
ajv.compile = function (schema) {
  const origValidate = origCompile.call(ajv, schema);

  function validate(json) {
    const isValid = origValidate(json);
    validate.schema = origValidate.schema;
    validate.errors = origValidate.errors?.map(err => ({
      ...err,
      dataPath: err.instancePath
    }));
    return isValid;
  }

  return validate;
};

export const EDIT_MODE_STORAGE_KEY = 'jsonEditingMode';

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export default function JSONEditorComponent({
  className,
  defaultValue,
  id,
  label,
  onChange,
  onError,
  onValidationError,
  readonly,
  schema,
  value
}) {
  const uniqueId = `${id || label || 'json_editor'}${useId()}`;
  const ref = useRef();
  const editor = useRef();

  const handleError = useCallback((e) => {
    if (onError) {
      onError(e.message);
    }
  }, [onError]);

  const handleChange = useCallback(() => {
    try {
      if (onChange) {
        onChange({ value: editor.current?.get() });
      }
    } catch (e) {
      if (onError) {
        onError(e.message);
      }
    }
  }, [editor, onChange, onError]);

  const handleModeChange = useCallback((newMode) => {
    try {
      localStorage.setItem(EDIT_MODE_STORAGE_KEY, newMode);
    } catch (err) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    // jsoneditor doesn't work well with SSR, so we have to require it here
    const JSONEditor = require('jsoneditor');

    let editMode = 'tree';
    try {
      editMode = localStorage.getItem(EDIT_MODE_STORAGE_KEY);
    } catch (err) {
      // Ignore
    }

    const options = readonly
      ? { mode: 'view' }
      : {
        ajv,
        allowSchemaSuggestions: true,
        mode: editMode,
        modes: ['tree', 'code'],
        schema,
        showErrorTable: true,
        onChange: handleChange,
        onError: handleError,
        onModeChange: handleModeChange,
        onValidationError
      };

    editor.current = new JSONEditor(ref.current, options);
    editor.current.set(safeJsonParse(value || defaultValue));

    return () => {
      // Clean up JSONEditor instance
      editor.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (value !== void 0) {
      editor.current?.update(safeJsonParse(value));
    }
  }, [editor, value]);

  useEffect(() => {
    if (schema !== void 0) {
      editor.current?.setSchema(schema);
    }
  }, [editor, schema]);

  return (
    <div
      id={uniqueId}
      aria-label={label || 'Value'}
      className={classNames('json-editor', 'setting-types-json-editor', className)}
      ref={ref}
    />
  );
}