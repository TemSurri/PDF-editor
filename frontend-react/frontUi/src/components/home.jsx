import React, {useContext} from "react";
import "./stylesheets/home.css";
import PdfViewer from "./pdfview.jsx";
import {AuthContext} from "../context/AuthContext.jsx"

const Home = () => {
  const {isLoggedIn, username} = useContext(AuthContext);
  
  return (
    <>
    <div className="page">
      <div className="center-box">
        {isLoggedIn ? 
        (<h2>Welcome {username}</h2>):
        (<h2>Welcome to PDF Editor</h2>)}
        
        <p>Edit, manage, and save your PDFs with ease.</p>
      </div>
    </div>
    <div className="page">
      <div className="center-box">
        <PdfViewer/>
      </div>
    </div>
    </>
  );
};

export default Home;
