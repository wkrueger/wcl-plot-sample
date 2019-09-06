import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

export function requestHandler(
  method: "GET" | "POST",
  schema: yup.ObjectSchema,
  handler: (i: any) => Promise<Record<string, any>>
) {
  return async (req: NextApiRequest, resp: NextApiResponse) => {
    try {
      if (req.method !== method) throw Error("Invalid method.");
      const inputs = schema.validateSync(
        method === "GET" ? req.query : req.body,
        { stripUnknown: true }
      );
      const result = await handler(inputs);
      return resp.status(200).json(result);
    } catch (err) {
      console.log(err);
      resp.status(400).json({ error: err.message || err });
    }
  };
}
