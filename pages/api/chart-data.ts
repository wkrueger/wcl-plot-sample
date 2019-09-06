import { requester } from "./utl/requester";
import * as yup from "yup";
import { requestHandler } from "./utl/requestHandler";

export default requestHandler(
  "POST",
  yup.object({
    reportCode: yup.string().required(),
    encounterId: yup.number().required(),
    actor: yup.string().required(),
    spellName: yup.string().required()
  }),
  main
);

async function main(i: {
  reportCode: string;
  encounterId: number;
  actor: string;
  spellName: string;
}) {
  i.reportCode = encodeURIComponent(i.reportCode || "");
  const report = await requester<wcl.Report>(`/report/fights/${i.reportCode}`);
  const foundFight = report.fights.find(fight => fight.id === i.encounterId);
  if (!foundFight) throw Error(`Fight ${i.encounterId} not found.`);
  const foundActor = report.friendlies.find(unit => unit.name === i.actor);
  if (!foundActor) throw Error("Actor not found.");
  const foundSpell = await trySpellId({
    name: i.spellName,
    eventType: "buffs",
    fight: foundFight,
    reportCode: i.reportCode
  });
  if (!foundSpell) throw Error("Spell not found.");

  const eventsIter = events({
    fight: foundFight,
    actorId: foundActor.id,
    eventType: "buffs",
    reportCode: i.reportCode,
    spellId: foundSpell.guid
  });

  const target = new Set<number>();
  const timeline: { count: number; timestamp: number }[] = [];

  for await (let event of eventsIter) {
    switch (event.type) {
      case "applybuff":
      case "refreshbuff":
        target.add(event.targetID);
        break;
      case "removebuff":
        target.delete(event.targetID);
        break;
    }
    timeline.push({ count: target.size, timestamp: event.timestamp });
  }
  return { timeline };
}

async function trySpellId(i: {
  name;
  eventType;
  reportCode;
  fight: wcl.Fight;
}) {
  const tables = await requester<wcl.TableResponse>(
    `/report/tables/${i.eventType}/${i.reportCode}`,
    {
      query: {
        start: i.fight.start_time,
        end: i.fight.end_time
      }
    }
  );
  const foundAura = tables.auras.find(aura => aura.name === i.name);
  return foundAura;
}

async function* events(i: {
  fight: wcl.Fight;
  actorId: number;
  eventType: "buffs" | "casts";
  reportCode: string;
  spellId: number;
}) {
  let eventsResponse: wcl.EventsResponse | null = null;
  const eventType = encodeURIComponent(i.eventType);
  const reportCode = encodeURIComponent(i.reportCode);
  do {
    eventsResponse = await requester<wcl.EventsResponse>(
      `/report/events/${eventType}/${reportCode}`,
      {
        query: {
          start: eventsResponse
            ? eventsResponse.nextPageTimestamp!
            : i.fight.start_time,
          end: i.fight.end_time,
          sourceid: i.actorId,
          abilityid: i.spellId
        }
      }
    );
    const events = eventsResponse.events;
    for (let x = 0; x < events.length; x++) {
      yield events[x];
    }
  } while (eventsResponse && eventsResponse.nextPageTimestamp);
}

declare global {
  namespace wcl {
    interface Report {
      fights: Fight[];
      lang: string;
      friendlies: Unit[];
      enemies: Unit[];
      phases: any[];
      exportedCharacters: any[];
    }

    interface EventsResponse {
      events: Event[];
      nextPageTimestamp?: number;
    }

    interface TableResponse {
      auras: {
        name: string;
        guid: number;
      }[];
      useTargets: boolean;
      totalTime: number;
      startTime: number;
      endTime: number;
    }

    interface Event {
      timestamp: number;
      type: "applybuff" | "removebuff" | "refreshbuff";
      sourceID: number;
      targetID: number;
      ability: {
        name: string;
        guid: number;
        type: number;
        abilityIcon: string;
      };
    }

    interface Fight {
      id: number;
      start_time: number;
      end_time: number;
      boss: number;
      name: string;
      kill?: boolean;
    }

    interface Unit {
      name: string;
      id: number;
      guid: number;
      type: string;
      server: string;
      fights: { id: number }[];
    }
  }
}
