import { test, afterEach, vi } from "vitest";
import { createFetch } from "ofetch";
import {
  createRequest,
  RequestFailResultNetwork,
  RequestFailResultBusiness,
} from "../index";
import { defaultErrorContract } from "../../../../tests/default-error-contract";

afterEach(() => {
  vi.unstubAllGlobals();
});
defaultErrorContract(
  test,
  (scenario, getter, observe) => {
    if (scenario.scene === "offline" || scenario.offline)
      vi.stubGlobal("navigator", { onLine: false });
    const controller = new AbortController();
    if (scenario.scene === "cancel") controller.abort();
    const request = createRequest<any>({
      basePath: "https://compat.test",
      timeout: 1000,
      Fetch: createFetch({
        fetch: async (_input, options) => {
          if (options?.signal?.aborted) throw options.signal.reason;
          if (scenario.scene)
            throw new Error(
              scenario.scene === "timeout" ? "timeout" : "Network Error",
            );
          return new Response(
            typeof scenario.body === "string"
              ? scenario.body
              : JSON.stringify(scenario.body),
            {
              status: scenario.status,
              statusText: scenario.statusText ?? "",
              headers: { "content-type": "application/json" },
            },
          );
        },
      }),
      instanceCreateConfig: { retry: false },
      getBusinessCode: (res) => {
        getter();
        return res.code;
      },
      getBusinessMsg: (res) => {
        getter();
        return res.message;
      },
      getBusinessData: (res) => {
        getter();
        return res.data;
      },
      beforeError: (error) => {
        observe(error);
        return { newError: error, canShowErrorToast: false };
      },
    });
    const config = { url: "/resource", signal: controller.signal };
    return request(config);
  },
  {
    adapter: "ofetch",
    network: RequestFailResultNetwork,
    business: RequestFailResultBusiness,
  },
);
