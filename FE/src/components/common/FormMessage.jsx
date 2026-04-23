const ICON_BY_TYPE = {
  error: "bx bx-error-circle",
  success: "bx bx-check-circle",
  info: "bx bx-info-circle",
  hint: "bx bx-bulb",
};

const FormMessage = ({ type = "info", children, className = "" }) => {
  if (!children) return null;

  const safeType = ICON_BY_TYPE[type] ? type : "info";
  const iconClass = ICON_BY_TYPE[safeType];
  const mergedClassName = `form-message form-message--${safeType}${className ? ` ${className}` : ""}`;

  return (
    <div
      className={mergedClassName}
      role={safeType === "error" ? "alert" : "status"}
    >
      <i className={iconClass} aria-hidden="true"></i>
      <span>{children}</span>
    </div>
  );
};

export default FormMessage;
