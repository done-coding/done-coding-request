import { test, vi, afterEach } from "vitest";
import { createRequest, getErrorFromResponse } from "../index";
import {
  standardErrorContract,
  configuredParser,
  networkErrorContract,
} from "../../../../tests/standard-error-contract";

afterEach(() => {
  vi.unstubAllGlobals();
});
standardErrorContract(
  test,
  (scenario, observe) => {
    vi.stubGlobal("uni", {
      request: (options: UniApp.RequestOptions) => {
        options.success?.({
          statusCode: scenario.status,
          data: scenario.body as string,
          header: { location: "/organizations/org-1" },
          cookies: [],
          errMsg: "request:ok",
        });
      },
    });
    const request = createRequest<{
      code: string | number;
      message: string;
      data: any;
    }>({
      basePath: "https://standard-error.test",
      timeout: 1000,
      getBusinessCode: (res) => res.data.code,
      getBusinessMsg: (res) => res.data.message,
      getBusinessData: (res) => res.data.data,
      getErrorFromResponse: configuredParser(scenario) ?? getErrorFromResponse,
      beforeError: (error) => {
        observe?.(error);
        return { newError: { ...error }, canShowErrorToast: false };
      },
    });
    return request({ url: "/resource" });
  },
  false,
);

networkErrorContract(
  test,
  (scene, observe) => {
    if (scene === "offline") vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal("uni", {
      request: (options: UniApp.RequestOptions) =>
        options.fail?.({
          errMsg: scene === "timeout" ? "request:fail timeout" : "request:fail",
        }),
    });
    const request = createRequest<{ code: number; message: string; data: any }>(
      {
        basePath: "https://standard-error.test",
        timeout: 1000,

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
  "NO_NETWORK_CODE",
);
