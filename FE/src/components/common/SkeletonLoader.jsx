import React from "react";
import "./SkeletonLoader.css";

const SkeletonLoader = ({ type = "text", lines = 3, className = "" }) => {
  if (type === "product-detail") {
    return (
      <div className={`skeleton-loader product-detail-skeleton ${className}`}>
        <div className="skeleton-rect" style={{ height: "400px", borderRadius: "20px" }}></div>
        <div>
          <div className="skeleton-line" style={{ width: "60%", height: "30px", marginBottom: "20px" }}></div>
          <div className="skeleton-line" style={{ width: "40%", height: "24px", marginBottom: "30px" }}></div>
          <div className="skeleton-line" style={{ width: "80%", marginBottom: "15px" }}></div>
          <div className="skeleton-line" style={{ width: "70%", marginBottom: "15px" }}></div>
          <div className="skeleton-line" style={{ width: "90%", marginBottom: "40px" }}></div>
          <div className="skeleton-rect" style={{ height: "60px", borderRadius: "10px" }}></div>
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`skeleton-loader card-skeleton ${className}`} style={{ padding: "16px" }}>
        <div className="skeleton-line" style={{ width: "40%", height: "24px" }}></div>
        <div className="skeleton-line" style={{ width: "80%" }}></div>
        <div className="skeleton-line" style={{ width: "60%" }}></div>
      </div>
    );
  }

  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        ></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
