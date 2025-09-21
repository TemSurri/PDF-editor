import { useState, useRef, useContext, useEffect } from "react";
import "./stylesheets/pdfView.css";
import { pdfjs, Document, Page } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url"; 
import { AuthContext } from '../context/AuthContext';
import { Stage, Layer, Line, Text } from 'react-konva';
import api from "../api"

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfViewer = () => {
  const [file, setFile] = useState(null);
  const [pdfSize, setPdfSize] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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
    setPaginatedEdits(
      prev => prev.map((page, idx) => idx === (pageNum -1) ? {...page, Lines: [...page.Lines, line]}
      : page
    ))
  }

  const addTextToPage = (text) => {
    setPaginatedEdits(
      prev => prev.map((page, idx) => idx === (pageNum -1) ? {...page, Texts: [...page.Texts, text]}
    : page)
    )
  }

  const isDrawing = useRef(false);
  const [fontSize, setFontSize] = useState(20)
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
      let line_info = { tool, points: [pointer.x, pointer.y], strokeWidth, strokeColor}
      addLineToPage(line_info)
     
    } else if (tool === "Text") {
      let text_info = { x: pointer.x, y: pointer.y, text: "New text", fontSize: fontSize, id: Date.now() }
      addTextToPage(text_info)
      
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    setPaginatedEdits(prev => {
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
    console.log(tool)
    isDrawing.current = false;
    if (tool === "Text"){
     setTool(null);
   };
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
  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const onDocumentLoadSuccess = (
    { numPages }) => { setNumPages(numPages); 
      setError(null); 
    };
  const onPageLoadSuccess = ({ width, height }) => { setPdfSize({ width, height }); };
  const onDocumentLoadError = (err) => { console.error(err); setError("Failed to load PDF."); };

  const handleProcess = async () => {
  if (!file) {
    alert("No file selected");
    return;
  }
  if (!isLoggedIn) {
    alert("Must Login");
    return;
  }

  try {
    const prePage = pageNum; 
    const formData = new FormData();
    formData.append("pdf", file);

    const data = [];

    const getPixelRatio = () => {
      if (numPages >1000) {
        return 1
      }
      else if (numPages > 300){
        return 2
      }
      else {
        return 3
      }
    }
    const capturePage = (pageIndex) => new Promise((resolve) => {
      setPageNum(pageIndex + 1);

      const checkRender = () => {
       
        if (stageRef.current) {

          const pixel_ratio = getPixelRatio()

          resolve(stageRef.current.toDataURL({pixelRatio : pixel_ratio}));

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

    try {
      const response = await api.post("/protected/", formData, {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

   
      window.open(pdfUrl);
      console.log("Success:", response.data);
    } catch (error) {
      console.error("API Error:", error);
      alert("Error processing PDF on server. Check console.");
    }

    setPageNum(prePage);
    
  } catch (err) {
    console.error("Error in handleProcess:", err);
    alert("An error occurred during PDF processing. Check console.");
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

  const editingInput = editingTextId ? (() => {
    let texts = paginatedEdits[pageNum - 1].Texts
    const t = texts.find(txt => txt.id === editingTextId);
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
          setPaginatedEdits(prev => {
            const updated = [...prev];
            const page = { ...updated[pageNum - 1] }; 
            page.Texts = page.Texts.map(txt =>
              txt.id === editingTextId ? { ...txt, text: inputValue } : txt
            );
            updated[pageNum - 1] = page;
            return updated;
          });

          setEditingTextId(null);
        }}
        onKeyDown={(e) => { if (e.key === "Enter") inputRef.current.blur(); }}
      />
    );
  })() : null;

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
              <button onClick={handleClear} className="clear-btn">Clear</button>
            </div>
          ) : (
          
            <>
              <div className="tool-controls">
                <div className="pagination-controls">
                  <button disabled={tool === "pen"} onClick={() => setTool("pen")}>Draw</button>
                  <button disabled={tool === "eraser"} onClick={() => setTool("eraser")}>Eraser</button>
                  <button disabled={tool === "Text"} onClick={() => setTool("Text")}>TextBox</button>
                  <button disabled={tool === null} onClick={() => setTool(null)}>De-Select</button>
                </div>
                { (tool === "Text") && (
                  <div className="pagination-controls" style={{ marginTop: "8px", gap: "8px" }}>
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

                { (tool === "pen" || tool === "eraser") && (
                  <div className="pagination-controls" style={{ marginTop: "8px", gap: "8px" }}>
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

                    {!(tool === "eraser") && (

                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      Color:
                      {colors.map((c) => (
                        <div
                          key={c}
                          onClick={() => setStrokeColor(c)}
                          style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: c,
                            border: strokeColor === c ? "2px solid black" : "1px solid #ccc",
                            cursor: "pointer"
                          }}
                        />
                      ))}
                    </div>
                    )}
                  </div>
                )}
              </div>

              <Document file={file} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Page pageNumber={pageNum} key={`page_${pageNum}`} renderAnnotationLayer={false} renderTextLayer={false} onRenderSuccess={onPageLoadSuccess} />
                  {pdfSize && paginatedEdits && paginatedEdits[pageNum - 1] && (
                    <>
                     <Stage
                        width={pdfSize.width}
                        height={pdfSize.height}
                        ref = {stageRef}
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
                              stroke = {line.tool === "eraser" ? "#fff": line.strokeColor}
                              strokeWidth={line.strokeWidth}
                              tension={0.5}
                              lineCap="round"
                              lineJoin="round"
                              globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                            />
                          ))
                          }

                          {paginatedEdits[pageNum - 1].Texts.map((t) => {
                            if (t.id === editingTextId) return null; // cuzzo gotta hide thetexts being edited since its diff layer
                            return (
                              <Text
                                key={t.id}
                                x={t.x}
                                y={t.y}
                                text={t.text}
                                fontSize={t.fontSize}
                                draggable
                                onDragEnd={(e) => {
                                  setPaginatedEdits(prev => {
                                    const updated = [...prev];
                                    const page = { ...updated[pageNum - 1] }; 
                                    page.Texts = page.Texts.map(txt =>
                                      txt.id === t.id ? { ...txt, x: e.target.x(), y: e.target.y() } : txt
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
                  <button disabled={pageNum === 1} onClick={() => {setPageNum(pageNum - 1)}}>Previous</button>
                  <span>Page {pageNum} of {numPages}</span>
                  <button disabled={pageNum === numPages} onClick={() => setPageNum(pageNum + 1)}>Next</button>
                </div>
                <button className="process-btn" onClick={handleProcess}>Process PDF</button>
                <button className="clear-btn" onClick={handleClear}>Clear</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
