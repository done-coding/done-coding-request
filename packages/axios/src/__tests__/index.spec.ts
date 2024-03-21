import { describe, test, expect, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";

import { InnerErrorCode, createRequest } from "@/index";

let server: ReturnType<typeof setupServer>;

let request: ReturnType<typeof createRequest>;

const basePath = "https://test.com";

const getUrl = (path: string) => {
  return `${basePath}${path}`;
};

enum SceneUrlEnum {
  /** 请求前出错 */
  FAIL_BEFORE_REQUEST = "/get/fail/beforeRequest",
  /** 请求前未响应 */
  FAIL_NO_RESPONSE = "/get/fail/noResponse",
  /** 请求成功但业务结构错误 */
  SUCCESS_MODEL_ERROR = "/get/success/modelError",
  /** 请求成功且业务成功 */
  SUCCESS_BUSINESS_SUCCESS = "/get/success/businessSuccess",
  /** 请求成功但业务失败 */
  SUCCESS_BUSINESS_FAIL = "/get/success/businessFail",
}

beforeAll(() => {
  request = createRequest<{
    code: number;
    data: any;
    message: string;
  }>({
    basePath,
    timeout: 1000,
    businessSuccessCodeList: [200],
    getBusinessCode: ({ data: { code } }) => {
      return code;
    },
    getBusinessData: ({ data: { data } }) => {
      return data;
    },
    getBusinessMsg: ({ data: { message } }) => {
      return message;
    },
    beforeRequest: (config) => {
      return config;
    },
    dealError: (error) => {
      if (error.isBusinessError) {
        return {
          canShowErrorToast: true,
          newError: error,
        };
      } else {
        return {
          canShowErrorToast: true,
          newError: error,
        };
      }
    },
    showToast: (message, show) => {
      console.log(message, show);
    },
    debug: true,
  });

  server = setupServer(
    ...[
      http.get(getUrl(SceneUrlEnum.SUCCESS_MODEL_ERROR), () => {
        return HttpResponse.json(1);
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_BUSINESS_FAIL), () => {
        return HttpResponse.json({
          code: 403,
          data: [1],
          message: "success",
        });
      }),
      http.get(getUrl(SceneUrlEnum.SUCCESS_BUSINESS_SUCCESS), () => {
        return HttpResponse.json({
          code: 200,
          data: [1],
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
        message: "发起请求出错",
        isBusinessError: false,
      });
  });

  test.skip("get请求失败-未响应", async () => {
    await expect
      .soft(
        request({
          url: SceneUrlEnum.FAIL_NO_RESPONSE,
          method: "get",
        }),
      )
      .rejects.toMatchObject({
        code: InnerErrorCode.NO_RESPONSE,
        message: "未响应",
        isBusinessError: false,
      });
  });

  test.skip("get请求成功但业务结构错误", async () => {
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

  test.skip("get请求成功但业务失败", async () => {
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

  test.skip("get请求成功且业务成功", async () => {
    await expect
      .soft(
        request({
          url: SceneUrlEnum.SUCCESS_BUSINESS_SUCCESS,
          method: "get",
        }),
      )
      .resolves.toMatchObject({
        code: 200,
        data: [1],
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
