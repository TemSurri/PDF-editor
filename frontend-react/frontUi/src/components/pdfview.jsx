import { useState, useRef, useContext, useEffect } from "react";
import "./stylesheets/pdfView.css";
import { pdfjs, Document, Page } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { AuthContext } from "../context/AuthContext";
import { Stage, Layer, Line, Text } from "react-konva";
import api from "../api";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfViewer = () => {
  const [file, setFile] = useState(null);
  const [pdfSize, setPdfSize] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [logerror, setLogError] = useState(false);

  const { isLoggedIn } = useContext(AuthContext);
  const stageRef = useRef(null);

  const [paginatedEdits, setPaginatedEdits] = useState([]);

  useEffect(() => {
    if (!numPages) return;
    const edits = [];
    for (let i = 0; i < numPages; i++) {
      edits.push({ Texts: [], Lines: [] });
    }
    setPaginatedEdits(edits);
  }, [numPages]);

  const addLineToPage = (line) => {
    setPaginatedEdits((prev) =>
      prev.map((page, idx) =>
        idx === pageNum - 1 ? { ...page, Lines: [...page.Lines, line] } : page
      )
    );
  };

  const addTextToPage = (text) => {
    setPaginatedEdits((prev) =>
      prev.map((page, idx) =>
        idx === pageNum - 1 ? { ...page, Texts: [...page.Texts, text] } : page
      )
    );
  };

  const isDrawing = useRef(false);
  const [fontSize, setFontSize] = useState(20);
  const [editingTextId, setEditingTextId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef();

  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const colors = ["#df4b26", "#000000", "#007bff", "#28a745", "#ffc107"];
  const [tool, setTool] = useState(null);

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (tool === "pen" || tool === "eraser") {
      isDrawing.current = true;
      const line_info = {
        tool,
        points: [pointer.x, pointer.y],
        strokeWidth,
        strokeColor,
      };
      addLineToPage(line_info);
    } else if (tool === "Text") {
      const text_info = {
        x: pointer.x,
        y: pointer.y,
        text: "New text",
        fontSize,
        id: Date.now(),
      };
      addTextToPage(text_info);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setPaginatedEdits((prev) => {
      const updated = [...prev];
      const page = { ...updated[pageNum - 1] };
      if (!page.Lines.length) return prev;
      const lastLine = { ...page.Lines[page.Lines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      page.Lines = [...page.Lines.slice(0, -1), lastLine];
      updated[pageNum - 1] = page;
      return updated;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (tool === "Text") setTool(null);
  };

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

  const handleDragOver = (e) => e.preventDefault();
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

  const onPageLoadSuccess = ({ width, height }) => {
    setPdfSize({ width, height });
  };

  const onDocumentLoadError = (err) => {
    console.error(err);
    setError("Failed to load PDF.");
  };

  const handleProcess = async (num) => {
    if (!file) {
      setError("No file selected.");
      return;
    }
    if (!isLoggedIn) {
      setLogError("Login or signup for free unlimited use.");
      return;
    }

    setLoading(true);
    try {
      const prePage = pageNum;
      const formData = new FormData();
      formData.append("way", num);
      formData.append("pdf", file);

      if (num == 1) {
        const editsPayload = paginatedEdits.map((page, index) => ({
          page: index + 1,
          lines: page.Lines.map((line) => ({
            points: line.points,
            strokeColor: line.strokeColor,
            strokeWidth: line.strokeWidth,
            tool: line.tool,
          })),
          texts: page.Texts.map((t) => ({
            x: t.x,
            y: t.y,
            text: t.text,
            fontSize: t.fontSize,
          })),
        }));
        formData.append("edits", JSON.stringify(editsPayload));
      } else {
        const data = [];
        const getPixelRatio = () => {
          let pages_edited = 0;
          for (let i = 0; i < numPages; i++) {
            if (
              paginatedEdits[i].Texts.length + paginatedEdits[i].Lines.length >
              0
            ) {
              pages_edited++;
            }
          }
          if (pages_edited > 10) return 1;
          else if (pages_edited > 5) return 2;
          else return 3;
        };
        const capturePage = (pageIndex) =>
          new Promise((resolve) => {
            setPageNum(pageIndex + 1);
            const checkRender = () => {
              if (stageRef.current) {
                const pixel_ratio = getPixelRatio();
                resolve(stageRef.current.toDataURL({ pixelRatio: pixel_ratio }));
              } else {
                requestAnimationFrame(checkRender);
              }
            };
            requestAnimationFrame(checkRender);
          });
        for (let i = 0; i < numPages; i++) {
          const edits = paginatedEdits[i];
          if (!edits || (edits.Lines.length === 0 && edits.Texts.length === 0)) {
            data.push({ index: i, png: null });
            continue;
          }
          const uri = await capturePage(i);
          data.push({ index: i, png: uri });
        }
        formData.append("edits", JSON.stringify(data));
      }

      const response = await api.post("/protected/", formData, {
        responseType: "blob",
      });
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      if (num == 0) {
        link.download = "exported_Heavy_100Percent.pdf";
      }
      if (num == 1) {
        link.download = "exported_Light_80Percent.pdf";
      }
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
      console.log("Success:", response.data);
      setPageNum(prePage);
    } catch (err) {
      console.error("Error in handleProcess:", err);
      alert("An error occurred during PDF processing. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageNum(1);
    setPaginatedEdits(null);
    setNumPages(null);
    setEditingTextId(null);
    setInputValue("");
    setError(null);
  };

  const editingInput = editingTextId
    ? (() => {
        const texts = paginatedEdits[pageNum - 1].Texts;
        const t = texts.find((txt) => txt.id === editingTextId);
        if (!t) return null;
        return (
          <input
            ref={inputRef}
            style={{
              position: "absolute",
              top: t.y,
              left: t.x,
              fontSize: t.fontSize,
              padding: 0,
              border: "1px solid #ccc",
              background: "transparent",
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              setPaginatedEdits((prev) => {
                const updated = [...prev];
                const page = { ...updated[pageNum - 1] };
                page.Texts = page.Texts.map((txt) =>
                  txt.id === editingTextId ? { ...txt, text: inputValue } : txt
                );
                updated[pageNum - 1] = page;
                return updated;
              });
              setEditingTextId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") inputRef.current.blur();
            }}
          />
        );
      })()
    : null;

  const scale = pdfSize ? Math.min(window.innerWidth / pdfSize.width, 1) : 1;

  return (
    <div className="pdf-container">
      {loading && <div className="loading-overlay">Loading...</div>}
      {!file ? (
        <>
          <div className="upload-container">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                if (!isLoggedIn) return;
                const selectedFile = e.target.files[0];
                if (selectedFile && selectedFile.type === "application/pdf") {
                  setFile(selectedFile);
                  setError(null);
                } else {
                  setError("Please select a valid PDF file.");
                }
              }}
            />
            <div className="upload-wrapper">
              <button
                className={`upload-btn ${!isLoggedIn ? "disabled-btn" : ""}`}
                onClick={() => {
                  if (!isLoggedIn) return;
                  fileInputRef.current.click();
                }}
              >
                Upload PDF
              </button>
              {!isLoggedIn && (
                <div className="hover-dropdown">
                  <p>
                    <strong>Login</strong> or <strong>Sign Up</strong> for free
                    unlimited use
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="dropzone-wrapper">
            <div
              className={`drop-zone ${error ? "drop-error" : ""} ${
                isDragging ? "active" : ""
              } ${!isLoggedIn ? "disabled-drop" : ""}`}
              onDrop={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  return;
                }
                handleDrop(e);
              }}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <p>{error ? error : "Drag & Drop a PDF here"}</p>
            </div>
            {!isLoggedIn && (
              <div className="hover-dropdown">
                <p>
                  <strong>Login</strong> or <strong>Sign Up</strong> for free
                  unlimited use
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="pdf-preview">
          {logerror ? (
            <>
              <div className="error-box">
                <div>{logerror}</div>
                <button
                  className="error-dismiss"
                  onClick={() => setLogError(null)}
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="tool-controls">
                <div className="pagination-controls">
                  <button disabled={tool === "pen"} onClick={() => setTool("pen")}>
                    Draw
                  </button>
                  <button
                    disabled={tool === "eraser"}
                    onClick={() => setTool("eraser")}
                  >
                    Eraser
                  </button>
                  <button
                    disabled={tool === "Text"}
                    onClick={() => setTool("Text")}
                  >
                    TextBox
                  </button>
                  <button disabled={tool === null} onClick={() => setTool(null)}>
                    UnSelect
                  </button>
                </div>
                {tool === "Text" && (
                  <div
                    className="pagination-controls"
                    style={{ marginTop: "8px", gap: "8px" }}
                  >
                    <label>
                      Font Size for New Text:
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        style={{ width: "50px", marginLeft: "4px" }}
                      />
                    </label>
                  </div>
                )}
                {(tool === "pen" || tool === "eraser") && (
                  <div
                    className="pagination-controls"
                    style={{ marginTop: "8px", gap: "8px" }}
                  >
                    <label>
                      Size:
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        style={{ width: "50px", marginLeft: "4px" }}
                      />
                    </label>
                    {tool !== "eraser" && (
                      <div
                        style={{ display: "flex", gap: "4px", alignItems: "center" }}
                      >
                        Color:
                        {colors.map((c) => (
                          <div
                            key={c}
                            onClick={() => setStrokeColor(c)}
                            style={{
                              width: "20px",
                              height: "20px",
                              backgroundColor: c,
                              border:
                                strokeColor === c
                                  ? "2px solid black"
                                  : "1px solid #ccc",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Page
                    pageNumber={pageNum}
                    key={`page_${pageNum}`}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onRenderSuccess={onPageLoadSuccess}
                  />
                  {pdfSize && paginatedEdits && paginatedEdits[pageNum - 1] && (
                    <>
                      <Stage
                        width={pdfSize.width * scale}
                        height={pdfSize.height * scale}
                        scaleX={scale}
                        scaleY={scale}
                        ref={stageRef}
                        style={{ position: "absolute", top: 0, left: 0 }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                      >
                        <Layer>
                          {paginatedEdits[pageNum - 1].Lines.map((line, i) => (
                            <Line
                              key={i}
                              points={line.points}
                              stroke={line.tool === "eraser" ? "#fff" : line.strokeColor}
                              strokeWidth={line.strokeWidth}
                              tension={0.5}
                              lineCap="round"
                              lineJoin="round"
                              globalCompositeOperation={
                                line.tool === "eraser"
                                  ? "destination-out"
                                  : "source-over"
                              }
                            />
                          ))}
                          {paginatedEdits[pageNum - 1].Texts.map((t) => {
                            if (t.id === editingTextId) return null;
                            return (
                              <Text
                                key={t.id}
                                x={t.x * scale}
                                y={t.y * scale}
                                text={t.text}
                                fontSize={t.fontSize * scale}
                                draggable
                                onDragEnd={(e) => {
                                  setPaginatedEdits((prev) => {
                                    const updated = [...prev];
                                    const page = { ...updated[pageNum - 1] };
                                    page.Texts = page.Texts.map((txt) =>
                                      txt.id === t.id
                                        ? {
                                            ...txt,
                                            x: e.target.x() / scale,
                                            y: e.target.y() / scale,
                                          }
                                        : txt
                                    );
                                    updated[pageNum - 1] = page;
                                    return updated;
                                  });
                                }}
                                onClick={() => {
                                  setEditingTextId(t.id);
                                  setInputValue(t.text);
                                  setTimeout(() => inputRef.current?.focus(), 0);
                                }}
                              />
                            );
                          })}
                        </Layer>
                      </Stage>
                      {editingInput}
                    </>
                  )}
                </div>
              </Document>
              <div className="controls">
                <div className="pagination-controls">
                  <button
                    disabled={pageNum === 1}
                    onClick={() => setPageNum(pageNum - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pageNum} of {numPages}
                  </span>
                  <button
                    disabled={pageNum === numPages}
                    onClick={() => setPageNum(pageNum + 1)}
                  >
                    Next
                  </button>
                </div>
                <button className="fprocess-btn" onClick={() => handleProcess(1)}>
                  Export PDF 80% Detail (Slow download/Light file)
                </button>
                <button className="process-btn" onClick={() => handleProcess(0)}>
                  Export PDF 100% Detail (Fast download/Heavy file)
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
