import assert from "node:assert/strict";

export interface DefaultScenario {
  status?: number;
  statusText?: string;
  body?: any;
  errMsg?: string;
  scene?: "network" | "timeout" | "cancel" | "offline" | "uni-timeout";
  offline?: boolean;
}

type Send = (
  scenario: DefaultScenario,
  getter: () => void,
  observe: (error: any) => void,
) => Promise<any>;

// 期望取自 fb7514b 实际执行；仅两个注明的独立 bug 修复与旧版不同。
export const defaultErrorContract = (
  test: (name: string, fn: () => Promise<void>) => unknown,
  send: Send,
  {
    adapter,
    ...errors
  }: {
    adapter: "axios" | "ofetch" | "uni";
    network: new (...args: any[]) => Error;
    business: new (...args: any[]) => Error;
  },
) => {
  const runFailure = async (
    scenario: DefaultScenario,
    expected: {
      code: string | number;
      message?: string;
      isBusinessError: boolean;
    },
  ) => {
    let getterCalls = 0;
    const observed: unknown[] = [];
    const check = (error: any) => {
      assert.ok(
        error instanceof
          (expected.isBusinessError ? errors.business : errors.network),
      );
      assert.equal(error.name, "DC Request ERROR");
      for (const [key, value] of Object.entries(expected))
        assert.deepEqual((error as any)[key], value);
      if (!expected.isBusinessError)
        assert.ok(Object.prototype.hasOwnProperty.call(error, "cause"));
    };
    await assert.rejects(
      send(
        scenario,
        () => getterCalls++,
        (error) => {
          observed.push(error);
        },
      ),
      (error: unknown) => {
        check(error);
        return true;
      },
    );
    assert.equal(observed.length, 1);
    check(observed[0]);
    assert.equal(getterCalls, expected.isBusinessError ? 2 : 0);
  };

  for (const status of [200, 201]) {
    test(`未配置：HTTP ${status} 成功保留旧字段与原始包体`, async () => {
      let getterCalls = 0;
      const body = { code: 200, message: "ok", data: 0 };
      const result = await send(
        { status, body },
        () => getterCalls++,
        () => assert.fail("成功不调用 beforeError"),
      );
      assert.equal(result.code, 200);
      assert.equal(result.message, "ok");
      assert.equal(result.data, 0);
      assert.deepEqual(
        adapter === "ofetch" ? result._raw : result._raw.data,
        body,
      );
      assert.equal(getterCalls, 3);
    });
  }
  test("未配置：恒 200 业务失败保持旧类和业务字段", () =>
    runFailure(
      { status: 200, body: { code: 401, message: "登录失效", data: null } },
      { code: 401, message: "登录失效", isBusinessError: true },
    ));

  for (const body of [
    { code: 401, message: "登录失效", data: null },
    {
      code: "DENIED",
      message: "禁止访问",
      error: { retryable: false, outcome: "not_executed", fields: [] },
      requestId: "req-1",
    },
    { code: 200, message: "ok", data: null },
    "<html>Forbidden</html>",
    null,
    undefined,
    {},
  ]) {
    for (const statusText of ["Forbidden", ""]) {
      test(`未配置：非 2xx 不读业务 getter，保留旧字段 ${JSON.stringify(
        body,
      )} / ${JSON.stringify(statusText)}`, () =>
        runFailure(
          { status: 403, statusText, body, errMsg: "request:ok" },
          {
            code: 403,
            message: adapter === "uni" ? "request:ok" : statusText,
            isBusinessError: false,
          },
        ));
    }
  }
  if (adapter === "uni") {
    for (const [status, errMsg, message] of [
      [500, undefined, "500"],
      [500, "", ""],
      [0, undefined, "0"],
    ] as const) {
      test(`未配置：uni 旧 errMsg 规则 ${status} / ${JSON.stringify(
        errMsg,
      )}`, () =>
        runFailure(
          { status, errMsg, body: null },
          { code: status, message, isBusinessError: false },
        ));
    }
  }
  const noResponse = adapter === "uni" ? "NO_NETWORK_CODE" : "NO_RESPONSE";
  for (const [scene, code, message] of [
    [
      "network",
      noResponse,
      adapter === "axios"
        ? "Network Error"
        : adapter === "uni"
        ? "请求失败"
        : '[GET] "https://compat.test/resource": <no response> Network Error',
    ],
    ["timeout", "NO_RESPONSE_TIMEOUT", "请求超时"],
    [
      "cancel",
      adapter === "axios" ? "REQUEST_ERROR" : noResponse,
      adapter === "axios"
        ? "canceled"
        : adapter === "uni"
        ? "请求失败: abort"
        : '[GET] "https://compat.test/resource": <no response> This operation was aborted',
    ],
    ["offline", "NO_RESPONSE_OFFLINE", "网络未连接"],
  ] as const) {
    test(`未配置：${scene} 保留旧网络分类与文案`, () =>
      runFailure(
        { scene },
        {
          code,
          ...(message === undefined ? {} : { message }),
          isBusinessError: false,
        },
      ));
  }
  if (adapter === "uni") {
    test("独立 bug 修复：request:fail timeout 不再被后续平台分支覆盖", () =>
      runFailure(
        { scene: "uni-timeout" },
        {
          code: "NO_RESPONSE_TIMEOUT",
          message: "请求超时",
          isBusinessError: false,
        },
      ));
  }
  if (adapter === "ofetch") {
    test("独立 bug 修复：已有 HTTP 响应优先于 navigator 离线状态", () =>
      runFailure(
        {
          status: 403,
          statusText: "Forbidden",
          body: { code: 401 },
          offline: true,
        },
        { code: 403, message: "Forbidden", isBusinessError: false },
      ));
  }
};
