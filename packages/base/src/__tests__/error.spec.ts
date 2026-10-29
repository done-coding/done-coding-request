import { expect, test } from "vitest";
import { RequestFailResultNetwork } from "../index";

test("Network 错误即使未传 cause 也保留 1.2.3 的必有属性", () => {
  const error = new RequestFailResultNetwork({ code: 500, message: "" });
  expect(Object.prototype.hasOwnProperty.call(error, "cause")).toBe(true);
  expect(error.cause).toBeUndefined();
});

test("Network 错误保留原始 cause 身份", () => {
  const cause = new Error("transport");
  const error = new RequestFailResultNetwork({ code: 500, message: "", cause });
  expect(error.cause).toBe(cause);
});
