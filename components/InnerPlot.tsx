import React from "react";
import Plot from "react-plotly.js";

type InnerPlotOpts = {
  actors: (wcl.Unit & { spellDescription })[];
  reportCode: string;
  fight: wcl.Fight;
  onBusyChange: (i: boolean) => void;
};

export default (i: InnerPlotOpts) => {
  const [plotData, setPlotData] = React.useState(null as null | Plotly.Data[]);
  React.useEffect(() => {
    async function run() {
      i.onBusyChange(true);
      console.log("requesting");
      const responses = await Promise.all(
        i.actors.map(unit =>
          fetchPlotFor({
            actor: unit.name,
            reportCode: i.reportCode,
            fight: i.fight,
            spellName: unit.spellDescription
          })
        )
      );
      const plots = responses.map(resp => {
        return {
          x: resp.x,
          y: resp.y,
          type: "scatter",
          mode: "lines",
          name: resp.actor,
          line: { shape: "hv" }
        } as Plotly.Data;
      });
      i.onBusyChange(false);
      setPlotData(plots);
    }
    run();
  }, [i.actors, i.reportCode, i.fight]);

  if (!plotData) return null;

  return (
    <div>
      <Plot
        data={plotData}
        layout={{
          width: 600,
          height: 400,
          yaxis: {
            range: [0, 20],
            autorange: false
          }
        }}
      />
    </div>
  );
};

async function fetchPlotFor(i: {
  actor: string;
  reportCode: string;
  fight: wcl.Fight;
  spellName: string;
}) {
  const response = await fetch("/api/chart-data", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      reportCode: i.reportCode,
      encounterId: i.fight.id,
      actor: i.actor,
      spellName: i.spellName
    })
  });
  const { timeline } = (await response.json()) as { timeline: any[] };
  const x = [] as number[];
  const y = [] as number[];
  for (let it = 0; it < timeline.length; it++) {
    const element = timeline[it];
    x.push(element.timestamp);
    y.push(element.count);
  }
  return { actor: i.actor, x, y };
}
