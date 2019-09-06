import dynamic from "next/dynamic";
import { ReportForm } from "../components/Form";
import React from "react";

const Plot = dynamic(() => import("../components/InnerPlot"), { ssr: false });

type FormState = ReportForm["state"];

export default () => {
  const [formState, setFormState] = React.useState<FormState>();
  const [busy, setBusy] = React.useState(false);

  return (
    <div>
      <ReportForm
        onChange={i => {
          //setFormState(undefined);
          setTimeout(() => {
            setFormState(i);
          });
        }}
        busy={busy}
      />
      {formState && formState.selectedUnits && (
        <Plot
          actors={formState.selectedUnits}
          fight={formState.fight!}
          reportCode={formState.reportCode!}
          onBusyChange={setBusy}
        />
      )}
    </div>
  );
};
