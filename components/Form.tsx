import {
  Form,
  Card,
  Button,
  Segment,
  Container,
  Grid
} from "semantic-ui-react";
import React from "react";
import dayjs from "dayjs";
import classNames from "classnames";
import "./Form.scss";

class FormState extends React.Component<{
  children: (i: FormState) => JSX.Element;
}> {
  values = new Map<string, any>();

  bind(field: string) {
    return {
      value: this.values.get(field) || "",
      onChange: ev => {
        this.values.set(field, ev.target.value || "");
        this.forceUpdate();
      }
    };
  }

  render() {
    return this.props.children(this);
  }
}

const initialState = {
  reportCode: null as null | string,
  error: null as null | string,
  report: null as null | wcl.Report,
  fight: null as null | wcl.Fight,
  friendList: null as null | (wcl.Unit & { spellDescription })[],
  selectedUnits: [] as (wcl.Unit & { spellDescription })[],
  busy: false
};

export class ReportForm extends React.Component<
  { onChange: (o: ReportForm["state"]) => any; busy: boolean },
  ReportForm["state"]
> {
  state = initialState;

  reportCodeSubmit = (f: FormState) => async ev => {
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({ busy: true });
    const reportCode = f.values.get("reportCode");
    const resp = await fetch("/api/list-fights/" + reportCode);
    if (resp.status !== 200) {
      this.setState({ ...initialState, error: "Error...", busy: false });
      return;
    }
    const json = await resp.json();
    this.setState({ ...initialState, report: json, busy: false, reportCode });
  };

  validClasses = ["Priest", "Paladin"];
  descriptions = {
    Priest: "Atonement",
    Paladin: "Glimmer of Light"
  };

  onSelectFight = (fight: wcl.Fight) => ev => {
    const validFriendlies = this.state
      .report!.friendlies.filter(unit => {
        return this.validClasses.includes(unit.type);
      })
      .map(x => ({ ...x, spellDescription: this.descriptions[x.type] }));
    this.setState({ fight, friendList: validFriendlies });
  };

  onSelectUnit = unit => ev => {
    const found = this.state.selectedUnits.indexOf(unit);
    if (found >= 0) {
      const toset = this.state.selectedUnits.filter(x => x !== unit);
      this.setState({ selectedUnits: toset });
    } else {
      const toset = [...this.state.selectedUnits, unit];
      this.setState({ selectedUnits: toset });
    }
  };

  fireReport = ev => {
    if (!this.state.selectedUnits.length) return;
    this.props.onChange(this.state);
  };

  render() {
    return (
      <Container>
        <FormState>
          {f => (
            <>
              <Card style={{ width: "100%" }}>
                <Card.Content>
                  <Card.Header>Pick a report</Card.Header>
                  <Card.Description>
                    <Form
                      onSubmit={this.reportCodeSubmit(f)}
                      loading={this.state.busy}
                    >
                      <Form.Field>
                        <label>Report code</label>
                        <input {...f.bind("reportCode")}></input>
                      </Form.Field>
                      <Button type="submit">Go</Button>
                    </Form>
                  </Card.Description>
                </Card.Content>
              </Card>

              {this.state.report && (
                <Card style={{ width: "100%" }}>
                  <Card.Content>
                    <Card.Header>Pick a fight</Card.Header>
                    <Card.Description>
                      <Segment placeholder>
                        <Grid columns={4} divided>
                          {splitSize(this.state.report.fights, 4).map(
                            (group, idx) => (
                              <Grid.Row key={idx}>
                                {group.map(fight => (
                                  <Grid.Column
                                    key={fight.id}
                                    className="griditem"
                                    onClick={this.onSelectFight(fight)}
                                  >
                                    <div className="title">{fight.name}</div>
                                    <div className="start">
                                      {dayjs(fight.start_time).format("HH:mm")}
                                    </div>
                                    <div className="duration">
                                      {dayjs(fight.end_time).diff(
                                        fight.start_time,
                                        "second"
                                      ) + "s"}
                                    </div>
                                  </Grid.Column>
                                ))}
                              </Grid.Row>
                            )
                          )}
                        </Grid>
                      </Segment>
                    </Card.Description>
                  </Card.Content>
                </Card>
              )}

              {this.state.friendList && (
                <Card style={{ width: "100%" }}>
                  <Card.Content>
                    <Card.Header>Pick players</Card.Header>
                    <Card.Description>
                      <Segment placeholder>
                        <Grid columns={4} divided>
                          {splitSize(this.state.friendList, 4).map(
                            (group, idx) => (
                              <Grid.Row key={idx}>
                                {group.map(unit => (
                                  <Grid.Column
                                    key={unit.id}
                                    className={classNames(
                                      "griditem",
                                      this.state.selectedUnits.includes(unit) &&
                                        "selected"
                                    )}
                                    onClick={this.onSelectUnit(unit)}
                                  >
                                    <div className="name">{unit.name}</div>
                                    <div className="clas">{unit.type}</div>
                                    <div className="spell">
                                      {unit.spellDescription}
                                    </div>
                                  </Grid.Column>
                                ))}
                              </Grid.Row>
                            )
                          )}
                        </Grid>
                        <Button
                          onClick={this.fireReport}
                          loading={this.state.busy || this.props.busy}
                          style={{ marginTop: "1rem" }}
                        >
                          Go
                        </Button>
                      </Segment>
                    </Card.Description>
                  </Card.Content>
                </Card>
              )}
            </>
          )}
        </FormState>
      </Container>
    );
  }
}

function splitSize<T>(i: T[], size: number): T[][] {
  const out = [] as any[][];
  let current = [] as any[];
  for (let x = 0; x < i.length; x++) {
    const el = i[x];
    current.push(el);
    if (current.length === size) {
      out.push(current);
      current = [];
    }
  }
  return out;
}
