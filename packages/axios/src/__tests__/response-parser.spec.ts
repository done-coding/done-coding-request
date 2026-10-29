import { test, expect } from "vitest";
import {
  getErrorFromResponse,
  type ErrorResponseGetters,
} from "@done-coding/request-base";

const response = (body: unknown) => ({ status: 422, statusText: "", body });
const getters: ErrorResponseGetters = {
  getBusinessCode: (body) => (body as { code: string }).code,
  getBusinessMsg: (body) => (body as { message: string }).message,
  getBusinessData: <D>(body: unknown) => (body as { data: D }).data,
};

test.each([
  undefined,
  null,
  "<html>error</html>",
  {},
  { code: null },
  { code: false },
])("默认解析器无业务码时返回 undefined：%j", (body) => {
  expect(getErrorFromResponse(response(body), getters)).toBeUndefined();
});

test("默认解析器不从 error.code 另取业务码，并过滤非法额外字段", () => {
  expect(
    getErrorFromResponse(response({ error: { code: "WRONG" } }), getters),
  ).toBeUndefined();
  expect(
    getErrorFromResponse(
      response({
        code: "VALID",
        message: 123,
        error: { retryable: "false", outcome: "not_applied", fields: {} },
      }),
      getters,
    ),
  ).toEqual({
    code: "VALID",
    message: undefined,
    retryable: undefined,
    outcome: undefined,
    fields: undefined,
  });
});

test("文案 getter 抛错仍保留已取得的业务码", () => {
  expect(
    getErrorFromResponse(response({ code: "KNOWN" }), {
      ...getters,
      getBusinessMsg: () => {
        throw new Error("bad message");
      },
    }),
  ).toMatchObject({ code: "KNOWN", message: undefined });
});
