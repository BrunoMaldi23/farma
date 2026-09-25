const normalize = (value: string) => value.toLowerCase().replaceAll("_", "-");

export const StatusBadge = ({ value }: { value: string }) => (
  <span className={`status-badge status-badge--${normalize(value)}`}>
    {value.replaceAll("_", " ")}
  </span>
);
