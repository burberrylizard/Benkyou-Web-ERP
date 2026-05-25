export function LoadingState({ message = "Loading..." }) {
  return (
    <div style={stateStyles.box}>
      <div style={stateStyles.title}>{message}</div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div style={{ ...stateStyles.box, ...stateStyles.errorBox }}>
      <div style={stateStyles.title}>Unable to load data</div>
      <div style={stateStyles.message}>{error?.message || "Please try again."}</div>
      {onRetry && (
        <button type="button" onClick={onRetry} style={stateStyles.button}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No records yet." }) {
  return (
    <div style={stateStyles.box}>
      <div style={stateStyles.message}>{message}</div>
    </div>
  );
}

const stateStyles = {
  box: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 24,
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 24,
  },
  errorBox: {
    borderColor: "#fecaca",
    background: "#fef2f2",
    color: "#991b1b",
  },
  title: {
    fontWeight: 600,
    color: "#111827",
    marginBottom: 6,
  },
  message: {
    lineHeight: 1.5,
  },
  button: {
    marginTop: 14,
    background: "#185fa5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
  },
};
