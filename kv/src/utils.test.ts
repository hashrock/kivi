const ut = require("node:test");
const assert = require("node:assert");
import { queryToKvPrefix } from "./utils";

ut("queryToKvPrefix", (t: any) => {
  const result = queryToKvPrefix("user,123");
  assert.deepStrictEqual(result, ["user", 123]);
});
