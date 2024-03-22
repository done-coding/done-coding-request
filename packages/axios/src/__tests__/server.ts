import { vi } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http, delay } from "msw";
import { SceneUrlEnum } from "./request";

/** 展示toast */
export const showToast = vi.fn();

/** 失败重拾 */
export const failReloadFn = vi.fn();

export const basePath = `https://${Date.now().toString(36)}.com`;

export const timeout = 10000;

export const timeoutTest = 300;

const getUrl = (path: string) => {
  return `${basePath}${path}`;
};

export const createServer = () => {
  const list = Object.keys(http)
    .map((method) => [
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.FAIL_TIMEOUT),
        async () => {
          await delay(timeoutTest * 2);
          return HttpResponse.json();
        },
      ),
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.SUCCESS_MODEL_ERROR),
        () => {
          return HttpResponse.json();
        },
      ),
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.SUCCESS_BUSINESS_FAIL),
        () => {
          return HttpResponse.json({
            code: 403,
            data: 1,
          });
        },
      ),
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST),
        () => {
          return HttpResponse.json({
            code: 9527,
            data: 1,
            message: SceneUrlEnum.SUCCESS_BUSINESS_FAIL_SHOW_TOAST,
          });
        },
      ),
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.SUCCESS_BUSINESS_SUCCESS),
        () => {
          return HttpResponse.json({
            code: 200,
            data: 1,
            message: "success",
          });
        },
      ),
      http[method as keyof typeof http](
        getUrl(SceneUrlEnum.FAIL_RELOAD),
        () => {
          failReloadFn();
          if (failReloadFn.mock.calls.length === 1) {
            return HttpResponse.json();
          } else {
            return HttpResponse.json({
              code: 200,
              data: 1,
              message: "success",
            });
          }
        },
      ),
    ])
    .flat();

  const server = setupServer(...list);

  server.listen({});

  return server;
};
