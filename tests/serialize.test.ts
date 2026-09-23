import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { toJsDate, serializeTimestamps } from "../lib/serialize.ts";

describe("toJsDate", () => {
  test("returns Date instances as-is", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    assert.equal(toJsDate(d), d);
  });

  test("converts Firestore Timestamp-like objects", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    assert.deepEqual(toJsDate({ toDate: () => d }), d);
  });

  test("returns null for null and undefined", () => {
    assert.equal(toJsDate(null), null);
    assert.equal(toJsDate(undefined), null);
  });

  test("returns null for primitives and objects without toDate", () => {
    assert.equal(toJsDate("2026-01-15"), null);
    assert.equal(toJsDate(1234), null);
    assert.equal(toJsDate({ seconds: 1, nanoseconds: 0 }), null);
  });
});

describe("serializeTimestamps", () => {
  test("converts only the given fields", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    const out = serializeTimestamps({ created_at: { toDate: () => d }, scheduled_at: null, title: "x" }, [
      "created_at",
      "scheduled_at",
    ]);
    assert.equal(out.created_at, d);
    assert.equal(out.scheduled_at, null);
    assert.equal(out.title, "x");
  });

  test("passes through Date values untouched", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    const out = serializeTimestamps({ created_at: d }, ["created_at"]);
    assert.equal(out.created_at, d);
  });

  test("does not mutate the input object", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    const input = { created_at: { toDate: () => d } };
    serializeTimestamps(input, ["created_at"]);
    assert.equal(typeof (input.created_at as { toDate?: unknown }).toDate, "function");
  });
});
