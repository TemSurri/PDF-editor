import React from "react";
import "./stylesheets/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} <span>PDF Editor</span>. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;