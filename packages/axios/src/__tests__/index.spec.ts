import { describe, test, expect, beforeAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http, delay } from "msw";
import { getRequest, SceneUrlEnum } from "./request";

import type { createRequest } from "@/index";
import { InnerErrorCode } from "@/index";

let server: ReturnType<typeof setupServer>;

let request: ReturnType<typeof createRequest>;

const basePath = `https://${Date.now().toString(36)}.com`;

const timeout = 1000;

const getUrl = (path: string) => {
  return `${basePath}${path}`;
};

const showToast = vi.fn();

beforeAll(() => {
  request = getRequest({
    basePath,
    timeout,
    showToast,
    beforeError: (error, { apiConfig: { url } }) => {
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
  });

  server = setupServer(
    ...[
      http.get(getUrl(SceneUrlEnum.FAIL_TIMEOUT), async () => {
        await delay(timeout * 2);
        return HttpResponse.json();
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_MODEL_ERROR), () => {
        return HttpResponse.json();
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_BUSINESS_FAIL), () => {
        return HttpResponse.json({
          code: 403,
          data: 1,
        });
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST), () => {
        return HttpResponse.json({
          code: 9527,
          data: 1,
          message: SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
        });
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_BUSINESS_SUCCESS), () => {
        return HttpResponse.json({
          code: 200,
          data: 1,
          message: "success",
        });
      }),
    ],
  );

  server.listen({});
});

describe("axios正常配置", () => {
  test("get请求失败-发起请求出错", async () => {
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

  test("get请求失败-超时", async () => {
    await expect
      .soft(
        request({
          url: SceneUrlEnum.FAIL_TIMEOUT,
          method: "get",
        }),
      )
      .rejects.toMatchObject({
        code: InnerErrorCode.NO_RESPONSE_TIMEOUT,
        isBusinessError: false,
      });
  });

  test("get请求失败-未响应", async () => {
    await expect
      .soft(
        request({
          url: SceneUrlEnum.FAIL_OFFLINE,
          method: "get",
        }),
      )
      .rejects.toMatchObject({
        code: InnerErrorCode.NO_RESPONSE,
        isBusinessError: false,
      });
  });

  test("get请求成功但业务结构错误", async () => {
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

  describe("get请求成功但业务失败", () => {
    test("get请求成功但业务失败-失败结果", async () => {
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

    test("显示错误提示", async () => {
      showToast.mockClear();
      await expect
        .soft(
          request({
            url: SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
            method: "get",
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

    test("不显示错误提示", async () => {
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

  test("get请求成功且业务成功", async () => {
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
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
