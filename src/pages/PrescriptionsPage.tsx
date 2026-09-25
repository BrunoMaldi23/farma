import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type PrescriptionRow = {
  id: string;
  folio: string;
  prescriptionType: string;
  issueDate: string;
  expirationDate: string | null;
  status: string;
  patient: { firstName: string; lastName: string; rut: string };
  doctor: { firstName: string; lastName: string };
  items: unknown[];
};

export const PrescriptionsPage = () => {
  const selector = useCallback(
    (payload: any) => payload.items as PrescriptionRow[],
    [],
  );
  const { data, loading, error } = useResource<PrescriptionRow[]>(
    "/prescriptions?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Dispensación"
        title="Recetas"
        description="Seguimiento de vigencia, saldo y dispensación de recetas."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && data?.length ? (
        <section className="panel">
          <ResponsiveTable
            rows={data}
            getKey={(row) => row.id}
            columns={[
              { key: "folio", header: "Folio", render: (row) => row.folio },
              {
                key: "patient",
                header: "Paciente",
                render: (row) =>
                  `${row.patient.firstName} ${row.patient.lastName}`,
              },
              {
                key: "doctor",
                header: "Médico",
                render: (row) => `${row.doctor.firstName} ${row.doctor.lastName}`,
              },
              {
                key: "type",
                header: "Tipo",
                render: (row) => row.prescriptionType.replaceAll("_", " "),
              },
              {
                key: "date",
                header: "Emisión",
                render: (row) =>
                  new Date(row.issueDate).toLocaleDateString("es-CL"),
              },
              {
                key: "status",
                header: "Estado",
                render: (row) => <StatusBadge value={row.status} />,
              },
            ]}
          />
        </section>
      ) : null}

      {!loading && data && !data.length ? <EmptyState title="Sin recetas" /> : null}
    </>
  );
};
