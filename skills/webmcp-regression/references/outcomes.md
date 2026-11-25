# Outcomes, ownership and evidence

Every scenario ends in exactly one of these.

| Outcome | Meaning |
|---|---|
| passed | The function works. |
| passed (empty) | The state is empty and the API is proven to send the field: a response read in this run carries it as null, `''`, `[]` or `0`. |
| failed: frontend | Our code is wrong: it throws, calls something that does not exist, sends a payload the requirement does not imply, or reads a response field under the wrong name. |
| failed: api | The API is wrong or missing: a field the screen reads is absent from every response, an endpoint rejects a payload the requirement's UI implies, or no endpoint exists for an action. |
| failed: data | The suite could not reach the state it needs. This is a failure so it stays visible; the fix is to seed the state inside the suite, or to ask for test data. |
| omitted | A run option turned the scenario off (a permanent delete without its opt-in flag). It names the flag, and its coverage row counts as uncovered for that run. |

There is no skipped.

## Labels the runner sets

These cases are decidable in code, so the runner writes the owner into the report and a model only spot-checks them:

| Signal | Label |
|---|---|
| Our code threw (TypeError, undefined function, unknown prop) | frontend |
| A request answered 5xx | api |
| A field the screen reads is absent from every recorded response | api |
| A DOM-layer check fails while the tool-layer scenario for the same row passes | frontend (wiring) |
| The scenario could not reach its state | data |

Everything else is `unlabelled` and goes through the questions below: a 4xx (the payload may be ours), a 2xx with a wrong screen, a key read under another name.

## Who owns a failure

Walk the questions in order and stop at the first yes.

1. **Did our code throw?** A TypeError, an undefined function, a prop the component does not take. Frontend. After a rename or refactor this is the most common cause, so look here first.
2. **Is our payload wrong?** Compare the request with what the requirement's UI collects. Missing, renamed or wrongly typed fields are ours. Frontend.
3. **Did the API refuse a correct payload?** Its status is 4xx or 5xx, or it answered with a rule the requirement does not have. API.
4. **Did the response lack what the screen reads?** Check the key itself on every raw response read, never the value. Absent everywhere: API. Present with an empty value: that is empty data, not a defect.
5. **Did we read the response wrongly?** The key exists under another name, or in another place. Frontend.
6. **None of these:** the scenario is wrong. Fix the suite.

## Sent versus empty

JSON has no undefined. A key the API sends as null is sent; a key missing from every response is not. Test with `key in object` on the raw response, not truthiness, and read enough responses that one lucky row cannot hide a missing key. A key inside a stored JSON blob exists only when something stored it, so its absence there is empty data.

## Evidence

Each failure carries what the owner needs without rerunning it:

- the steps taken, in order, as a user would take them
- the request: method, URL, body
- the response: status and body, raw
- expected: what the requirement says, with where it says it
- actual: what happened
- for a DOM-layer failure, the trace and screenshot

An API failure written this way can go into a ticket as it is. The runner's recorder supplies the requests, as [running.md](running.md) says.
