import { requestHandler } from "../utl/requestHandler";
import * as yup from "yup";
import { requester } from "../utl/requester";

export default requestHandler(
  "GET",
  yup.object({ reportCode: yup.string().required() }),
  main
);

async function main(i: { reportCode: string }) {
  const report = await requester<wcl.Report>(
    `/report/fights/${encodeURIComponent(i.reportCode)}`
  );
  report.fights = report.fights.filter(fight => fight.kill !== undefined);
  return report;
}
