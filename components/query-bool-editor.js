import React, { useEffect, useRef } from 'react';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import * as example2 from '../lib/lexical-search/example-2.json'


const QueryBoolEditor = ({ options, value }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize JSONEditor
    if (containerRef.current) {
      editorRef.current = new JSONEditor(containerRef.current, options);
      console.log(containerRef, editorRef, example2);
      editorRef.current.set(value);
    }

    // Cleanup JSONEditor on component unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [options]);

  return <div id="editor_holder" ref={containerRef} style={{ height: '400px' }} />;
};

export default QueryBoolEditor;