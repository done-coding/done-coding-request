import { test, beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http } from "msw";
import axios, { AxiosError } from "axios";
import { createRequest, getErrorFromResponse } from "../index";
import {
  standardErrorContract,
  configuredParser,
  networkErrorContract,
} from "../../../../tests/standard-error-contract";

const server = setupServer();
const url = "https://standard-error.test/resource";
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

standardErrorContract(test, (scenario, observe) => {
  server.use(
    http.get(url, () => {
      const init = {
        status: scenario.status,
        statusText: scenario.statusText,
        headers: { location: "/organizations/org-1" },
      };
      return typeof scenario.body === "string"
        ? new Response(scenario.body, init)
        : new Response(JSON.stringify(scenario.body), {
            ...init,
            headers: { ...init.headers, "content-type": "application/json" },
          });
    }),
  );
  const request = createRequest<{
    code: string | number;
    message: string;
    data: any;
  }>({
    basePath: "",
    timeout: 1000,
    axios,
    instanceCreateConfig: { proxy: false },
    getBusinessCode: (res) => res.data.code,
    getBusinessMsg: (res) => res.data.message,
    getBusinessData: (res) => res.data.data,
    getErrorFromResponse: configuredParser(scenario) ?? getErrorFromResponse,
    beforeError: (error) => {
      observe?.(error);
      // 普通对象重包装后也应保留上下文。
      return { newError: { ...error }, canShowErrorToast: false };
    },
  });
  return request({ url });
});

networkErrorContract(
  test,
  (scene, observe) => {
    if (scene === "offline") vi.stubGlobal("navigator", { onLine: false });

    const request = createRequest<{ code: number; message: string; data: any }>(
      {
        basePath: "https://standard-error.test",
        timeout: 1000,
        axios,
        instanceCreateConfig: {
          adapter: async () => {
            throw new AxiosError(
              scene === "timeout" ? "timeout of 1ms exceeded" : "Network Error",
              "ERR_NETWORK",
              undefined,
              {},
            );
          },
        },
        getBusinessCode: (res) => res.data.code,
        getBusinessMsg: (res) => res.data.message,
        getBusinessData: (res) => res.data.data,
        beforeError: (error) => {
          observe(error);
          return { newError: { ...error }, canShowErrorToast: false };
        },
      },
    );
    return request({ url: "/resource" });
  },
  "NO_RESPONSE",
);
