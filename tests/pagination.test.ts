import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseListParams,
  paginateInMemory,
  encodeOffsetCursor,
  decodeOffsetCursor,
  encodeValueCursor,
  decodeValueCursor,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_QUERY_FETCH,
} from "../lib/pagination.ts";

describe("list param constants", () => {
  test("constants are sane", () => {
    assert.ok(DEFAULT_PAGE_SIZE >= 1);
    assert.ok(MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE);
    assert.ok(MAX_QUERY_FETCH >= MAX_PAGE_SIZE);
  });
});

describe("parseListParams", () => {
  test("defaults when params are absent", () => {
    assert.deepEqual(parseListParams(new URLSearchParams("")), {
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
    });
  });

  test("clamps limit to [1, MAX_PAGE_SIZE]", () => {
    assert.equal(parseListParams(new URLSearchParams("limit=0")).limit, 1);
    assert.equal(parseListParams(new URLSearchParams("limit=-5")).limit, 1);
    assert.equal(parseListParams(new URLSearchParams("limit=99999")).limit, MAX_PAGE_SIZE);
    assert.equal(parseListParams(new URLSearchParams("limit=50")).limit, 50);
  });

  test("non-numeric limit falls back to default", () => {
    assert.equal(parseListParams(new URLSearchParams("limit=abc")).limit, DEFAULT_PAGE_SIZE);
  });

  test("decodes offset cursor", () => {
    const cursor = encodeOffsetCursor(150);
    assert.equal(parseListParams(new URLSearchParams(`cursor=${cursor}`)).offset, 150);
  });

  test("invalid cursor falls back to offset 0", () => {
    assert.equal(parseListParams(new URLSearchParams("cursor=!!!")).offset, 0);
    assert.equal(parseListParams(new URLSearchParams("cursor=%20")).offset, 0);
  });

  test("negative offset in cursor falls back to 0", () => {
    const raw = Buffer.from(JSON.stringify({ o: -10 }), "utf8").toString("base64url");
    assert.equal(parseListParams(new URLSearchParams(`cursor=${raw}`)).offset, 0);
  });
});

describe("paginateInMemory", () => {
  const items = Array.from({ length: 250 }, (_, i) => i);

  test("first page with next cursor", () => {
    const page = paginateInMemory(items, { limit: 100, offset: 0 });
    assert.deepEqual(page.items, items.slice(0, 100));
    assert.equal(decodeOffsetCursor(page.nextCursor), 100);
    assert.equal(page.total, 250);
  });

  test("middle page", () => {
    const page = paginateInMemory(items, { limit: 100, offset: 100 });
    assert.deepEqual(page.items, items.slice(100, 200));
    assert.equal(decodeOffsetCursor(page.nextCursor!), 200);
  });

  test("final page has null nextCursor", () => {
    const page = paginateInMemory(items, { limit: 100, offset: 200 });
    assert.deepEqual(page.items, items.slice(200));
    assert.equal(page.nextCursor, null);
  });

  test("offset beyond end returns empty page with null cursor", () => {
    const page = paginateInMemory(items, { limit: 100, offset: 500 });
    assert.deepEqual(page.items, []);
    assert.equal(page.nextCursor, null);
  });

  test("mayHaveMore keeps cursor when page is full at window end", () => {
    const window = Array.from({ length: 300 }, (_, i) => i);
    const page = paginateInMemory(window, { limit: 100, offset: 200 }, true);
    assert.equal(page.items.length, 100);
    assert.equal(decodeOffsetCursor(page.nextCursor!), 300);
  });

  test("mayHaveMore does not keep cursor when page is short", () => {
    const page = paginateInMemory(items, { limit: 100, offset: 200 }, true);
    assert.equal(page.items.length, 50);
    assert.equal(page.nextCursor, null);
  });

  test("empty items produce an empty page and null cursor", () => {
    const page = paginateInMemory([], { limit: 100, offset: 0 }, true);
    assert.deepEqual(page.items, []);
    assert.equal(page.nextCursor, null);
  });

  test("follows cursors across pages until exhausted", () => {
    let cursor: string | null = null;
    let offset = 0;
    let seen = 0;
    do {
      const page = paginateInMemory(items, { limit: 100, offset }, false);
      seen += page.items.length;
      offset = decodeOffsetCursor(page.nextCursor);
      cursor = page.nextCursor;
    } while (cursor !== null);
    assert.equal(seen, items.length);
  });
});

describe("value cursors", () => {
  test("roundtrip", () => {
    const iso = "2026-09-20T10:00:00.000Z";
    assert.equal(decodeValueCursor(encodeValueCursor(iso)), iso);
  });

  test("absent and invalid cursors return null", () => {
    assert.equal(decodeValueCursor(null), null);
    assert.equal(decodeValueCursor(undefined), null);
    assert.equal(decodeValueCursor("garbage"), null);
  });

  test("empty value returns null", () => {
    assert.equal(decodeValueCursor(encodeValueCursor("")), null);
  });
});
