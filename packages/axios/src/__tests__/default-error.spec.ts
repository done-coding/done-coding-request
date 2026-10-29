import { test, afterEach, vi } from "vitest";
import axios, { AxiosError } from "axios";
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
    if (scenario.scene === "offline")
      vi.stubGlobal("navigator", { onLine: false });
    const controller = new AbortController();
    if (scenario.scene === "cancel") controller.abort();
    const request = createRequest<any>({
      basePath: "https://compat.test",
      timeout: 1000,
      axios,
      instanceCreateConfig: {
        adapter: async (config) => {
          if (scenario.scene)
            throw new AxiosError(
              scenario.scene === "timeout"
                ? "timeout of 1ms exceeded"
                : "Network Error",
              "ERR_NETWORK",
              config,
              {},
            );
          const response = {
            status: scenario.status!,
            statusText: scenario.statusText ?? "",
            data: scenario.body,
            headers: {},
            config,
          };
          if (response.status < 200 || response.status >= 300)
            throw new AxiosError(
              "HTTP failure",
              "ERR_BAD_RESPONSE",
              config,
              {},
              response,
            );
          return response;
        },
      },
      getBusinessCode: (res) => {
        getter();
        return res.data.code;
      },
      getBusinessMsg: (res) => {
        getter();
        return res.data.message;
      },
      getBusinessData: (res) => {
        getter();
        return res.data.data;
      },
      beforeError: (error) => {
        observe(error);
        return { newError: error, canShowErrorToast: false };
      },
    });
    return request({ url: "/resource", signal: controller.signal });
  },
  {
    adapter: "axios",
    network: RequestFailResultNetwork,
    business: RequestFailResultBusiness,
  },
);
