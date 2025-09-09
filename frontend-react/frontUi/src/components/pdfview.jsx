import React, { useState, useContext } from "react";
import "./stylesheets/pdfView.css";
import { pdfjs, Document, Page } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url"; // 👈 let Vite handle it
import { AuthContext } from '../context/AuthContext'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfViewer = () => {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isLoggedIn } = useContext(AuthContext);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid PDF file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF render error:", err);
    setError("Failed to load PDF. Please try another file.");
  };

  const handleProcess = () => {
    if (!file) return;
    if (!isLoggedIn) {
      alert(`Must Login`);
      return;
    }
    alert(`Processing PDF: ${file.name}`);
  };

  const handleClear = () => {
    setFile(null);
    setNumPages(null);
    setError(null);
  };

  return (
    <div className="pdf-container">
      {!file ? (
        <div
          className={`drop-zone ${error ? "drop-error" : ""} ${isDragging ? "hover" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <p>{error ? error : "Drag & Drop a PDF here"}</p>
        </div>
      ) : (
        <div className="pdf-preview">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={handleClear} className="clear-btn">
                Clear
              </button>
            </div>
          ) : (
            <>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    pageNumber={index + 1}
                    key={`page_${index}`}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                ))}
              </Document>

              <div className="controls">
                <button className="process-btn" onClick={handleProcess}>
                  Process PDF
                </button>
                <button className="clear-btn" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
