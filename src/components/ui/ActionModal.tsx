import { X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export type ActionFieldOption = {
  value: string;
  label: string;
};

export type ActionField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "password" | "select" | "textarea" | "checkbox";
  placeholder?: string;
  required?: boolean;
  min?: number;
  step?: number;
  options?: ActionFieldOption[];
  disabled?: boolean;
};

type Props = {
  open: boolean;
  title: string;
  description?: string;
  fields: ActionField[];
  initialValues?: Record<string, unknown>;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string | number | boolean>) => void | Promise<void>;
};

const normalizeInitial = (
  fields: ActionField[],
  initialValues?: Props["initialValues"],
) => {
  const result: Record<string, string | number | boolean> = {};

  fields.forEach((field) => {
    const value = initialValues?.[field.name];

    if (field.type === "checkbox") {
      result[field.name] = Boolean(value);
    } else if (field.type === "number") {
      result[field.name] = value === null || value === undefined ? "" : Number(value);
    } else {
      result[field.name] = value === null || value === undefined ? "" : String(value);
    }
  });

  return result;
};

export const ActionModal = ({
  open,
  title,
  description,
  fields,
  initialValues,
  confirmLabel = "Guardar",
  busy = false,
  error,
  onClose,
  onSubmit,
}: Props) => {
  const initial = useMemo(
    () => normalizeInitial(fields, initialValues),
    [fields, initialValues],
  );
  const [values, setValues] = useState(initial);

  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit(values);
  };

  return (
    <div className="action-modal__backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="action-modal__header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="action-modal__body">
            {fields.map((field) => {
              const value = values[field.name];

              if (field.type === "checkbox") {
                return (
                  <label className="action-field action-field--checkbox" key={field.name}>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      disabled={field.disabled}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.checked,
                        }))
                      }
                    />
                    <span>{field.label}</span>
                  </label>
                );
              }

              return (
                <label className="action-field" key={field.name}>
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={field.disabled}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={String(value ?? "")}
                      required={field.required}
                      disabled={field.disabled}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Seleccionar...</option>
                      {(field.options ?? []).map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={field.disabled}
                      min={field.min}
                      step={field.step}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]:
                            field.type === "number"
                              ? event.target.value === ""
                                ? ""
                                : Number(event.target.value)
                              : event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              );
            })}

            {error ? <div className="alert alert--error">{error}</div> : null}
          </div>

          <footer className="action-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? "Guardando..." : confirmLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
