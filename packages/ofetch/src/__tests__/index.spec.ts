/* eslint-disable max-nested-callbacks */
import { describe, test, expect, beforeAll, vi } from "vitest";
import { getRequest, SceneUrlEnum } from "./request";

import { InnerErrorCode } from "@/index";
import _omit from "lodash/omit";
import {
  createServer,
  basePath,
  timeout,
  timeoutTest,
  showToast,
  failReloadFn,
} from "./server";

let server: ReturnType<typeof createServer>;

const requestConfig: Parameters<typeof getRequest>[0] = {
  basePath,
  timeout,
  showToast,
  beforeRequest: (config) => {
    if (config.url === SceneUrlEnum.FAIL_BEFORE_REQUEST) {
      throw new Error("请求前出错测试");
    }
    return config;
  },
  beforeError: (error, { apiConfig: { url } }) => {
    if (url === SceneUrlEnum.FAIL_RELOAD) {
      return {
        reload: true,
      };
    }

    if (error.isBusinessError) {
      return {
        newError: error,
        canShowErrorToast:
          url === SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
      };
    } else {
      return {
        newError: error,
        canShowErrorToast: true,
      };
    }
  },
};

const request = getRequest(requestConfig);

const noBeforeRequestRequest = getRequest({
  ..._omit(requestConfig, ["beforeRequest"]),
});

const noShowToastRequest = getRequest({
  ..._omit(requestConfig, ["showToast"]),
});

const noBeforeErrorRequest = getRequest({
  ..._omit(requestConfig, ["beforeError"]),
});

beforeAll(() => {
  server = createServer();
});

["get"].forEach((method) => {
  failReloadFn.mockClear();
  describe(`${method}请求`, () => {
    describe("发起请求前出错", () => {
      test("配置beforeRequest 请求发起前出错情况", async () => {
        await expect
          .soft(
            request({
              url: SceneUrlEnum.FAIL_BEFORE_REQUEST,
              method: "get",
            }),
          )
          .rejects.toMatchObject({
            code: InnerErrorCode.REQUEST_ERROR,
            isBusinessError: false,
          });
      });

      test("配置beforeRequest 请求发起前出错情况2[错误未RequestFailResultBase实例]", async () => {
        // const msg = Date.now().toString(36);
        await expect
          .soft(
            request({
              url: "http://www.baidu.com",
              method: "get",
              params: {
                // message: msg,
                blob: new Blob([]),
              },
            }),
          )
          .rejects.toMatchObject({
            code: InnerErrorCode.REQUEST_ERROR,
            isBusinessError: false,
            // message: msg,
          });
      });

      test(`不配置beforeRequest 不存在code=${InnerErrorCode.REQUEST_ERROR}`, async () => {
        await expect
          .soft(
            noBeforeRequestRequest({
              url: SceneUrlEnum.FAIL_BEFORE_REQUEST,
              method: "get",
            }),
          )
          .rejects.not.toMatchObject({
            code: InnerErrorCode.REQUEST_ERROR,
            isBusinessError: false,
          });
      });
    });

    /**
     * @vitest-environment node
     * !!!此处 在jsdom环境下超时测不了 实测回符合期望 应该是jsdom问题 此处不纠结
     */
    test("超时", async () => {
      await expect
        .soft(
          request({
            url: SceneUrlEnum.FAIL_TIMEOUT,
            method: "get",
            timeout: timeoutTest,
          }),
        )
        .rejects.toMatchObject({
          code: InnerErrorCode.NO_RESPONSE_TIMEOUT,
          isBusinessError: false,
        });
    });

    test("未响应 默认网络错误", async () => {
      await expect
        .soft(
          noBeforeErrorRequest({
            url: SceneUrlEnum.FAIL_OFFLINE,
            method: "get",
          }),
        )
        .rejects.toMatchObject({
          code: InnerErrorCode.NO_RESPONSE,
          isBusinessError: false,
        });
    });

    test("断网", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      await expect
        .soft(
          request({
            url: SceneUrlEnum.FAIL_OFFLINE,
            method: "get",
          }),
        )
        .rejects.toMatchObject({
          code: InnerErrorCode.NO_RESPONSE_OFFLINE,
          isBusinessError: false,
        });
      vi.unstubAllGlobals();
    });

    test("响应404", async () => {
      await expect
        .soft(
          request({
            url: SceneUrlEnum.FAIL_NETWORK_CODE_404,
            method: "get",
          }),
        )
        .rejects.toMatchObject({
          code: 404,
          isBusinessError: false,
        });
    });

    test("请求成功但业务结构错误", async () => {
      await expect
        .soft(
          request({
            url: SceneUrlEnum.SUCCESS_MODEL_ERROR,
            method: "get",
          }),
        )
        .rejects.toMatchObject({
          code: InnerErrorCode.DISPATCH_RESPONSE,
          isBusinessError: false,
        });
    });

    describe("请求成功但业务失败", () => {
      // eslint-disable-next-line max-nested-callbacks
      test("失败结果", async () => {
        await expect
          .soft(
            request({
              url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL,
              method: "get",
            }),
          )
          .rejects.toMatchObject({
            isBusinessError: true,
          });
      });

      describe("配置showToast", () => {
        test("uiConfig.uiConfig=true 执行showToast", async () => {
          showToast.mockClear();
          await expect
            .soft(
              request({
                url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
                method: "get",
                uiConfig: {
                  errorToast: true,
                },
              }),
            )
            .rejects.toMatchObject({
              isBusinessError: true,
            });
          expect(showToast).toBeCalledTimes(1);
          expect(showToast).toHaveBeenCalledWith(
            SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
          );
        });

        test("uiConfig.uiConfig=false 不执行showToast", async () => {
          showToast.mockClear();
          await expect
            .soft(
              request({
                url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL,
                method: "get",
                uiConfig: {
                  errorToast: false,
                },
              }),
            )
            .rejects.toMatchObject({
              isBusinessError: true,
            });
          expect(showToast).toBeCalledTimes(0);
        });
      });

      describe("不配置showToast", () => {
        test("uiConfig.uiConfig=true 仍不执行showToast", async () => {
          showToast.mockClear();
          await expect
            .soft(
              noShowToastRequest({
                url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
                method: "get",
                uiConfig: {
                  errorToast: true,
                },
              }),
            )
            .rejects.toMatchObject({
              isBusinessError: true,
            });
          expect(showToast).toBeCalledTimes(0);
        });

        test("uiConfig.uiConfig=true 不执行showToast", async () => {
          showToast.mockClear();
          await expect
            .soft(
              noShowToastRequest({
                url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL,
                method: "get",
                uiConfig: {
                  errorToast: false,
                },
              }),
            )
            .rejects.toMatchObject({
              isBusinessError: true,
            });
          expect(showToast).toBeCalledTimes(0);
        });
      });
    });

    test("请求成功且业务成功", async () => {
      await expect
        .soft(
          request({
            url: SceneUrlEnum.SUCCESS_BUSINESS_SUCCESS,
            method: "get",
          }),
        )
        .resolves.toMatchObject({
          code: 200,
          data: 1,
          message: "success",
        });
    });

    test("请求失败静默重新请求", async () => {
      await expect
        .soft(
          request({
            url: SceneUrlEnum.FAIL_RELOAD,
            method: "get",
          }),
        )
        .resolves.toMatchObject({
          code: 200,
          data: 1,
          message: "success",
        });
      expect(failReloadFn).toBeCalledTimes(2);
    });
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
