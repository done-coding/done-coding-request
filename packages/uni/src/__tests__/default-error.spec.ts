import { test, afterEach, vi } from "vitest";
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
    vi.stubGlobal("uni", {
      request: (options: UniApp.RequestOptions) => {
        if (scenario.scene)
          options.fail?.({
            errMsg:
              scenario.scene === "timeout"
                ? "request:fail time out"
                : scenario.scene === "uni-timeout"
                ? "request:fail timeout"
                : scenario.scene === "cancel"
                ? "request:fail abort"
                : "request:fail",
          });
        else
          options.success?.({
            statusCode: scenario.status!,
            data: scenario.body,
            header: {},
            cookies: [],
            errMsg: scenario.errMsg!,
          });
      },
    });
    const request = createRequest<any>({
      basePath: "https://compat.test",
      timeout: 1000,
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
    return request({ url: "/resource" });
  },
  {
    adapter: "uni",
    network: RequestFailResultNetwork,
    business: RequestFailResultBusiness,
  },
);
