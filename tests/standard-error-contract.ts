import assert from "node:assert/strict";

export interface Scenario {
  status: number;
  body: unknown;
  statusText?: string;
  parser?: "custom" | "undefined" | "throw";
  parserCalled?: boolean;
}

export interface ContractError {
  code: string | number;
  message: string;
  isBusinessError: boolean;
  httpStatus?: number;
  kind?: string;
  retryable?: boolean;
  outcome?: string;
  fields?: unknown[];
  requestId?: string;
  cause?: unknown;
}

type Send = (
  scenario: Scenario,
  observe?: (error: ContractError) => void,
) => Promise<unknown>;

// 同一验收矩阵通过三个适配器各自的传输边界运行。
export const standardErrorContract = (
  test: (name: string, fn: () => Promise<void>) => unknown,
  send: Send,
  hasStatusText = true,
) => {
  test("201 成功，保留成功包体和 Location", async () => {
    const result = await send({
      status: 201,
      body: { code: 200, message: "ok", data: { id: "org-1" } },
    });
    assert.equal((result as { code: number }).code, 200);
    assert.deepEqual((result as { data: unknown }).data, { id: "org-1" });
    const metadata = (
      result as { _response: { status: number; headers: unknown } }
    )._response;
    assert.equal(metadata.status, 201);
    const headers = metadata.headers as {
      get?: (name: string) => unknown;
      location?: string;
    };
    assert.equal(
      headers.get ? headers.get("location") : headers.location,
      "/organizations/org-1",
    );
  });

  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    test(`HTTP ${status} 标准业务错误与 beforeError 字段贯通`, async () => {
      const fields = [
        {
          in: "body",
          pointer: "/members/0/name",
          code: "REQUIRED",
          message: "必填",
        },
        {
          in: "query",
          parameter: "page.page",
          code: "INVALID",
          message: "页码错误",
        },
        { in: "path", parameter: "id", code: "INVALID", message: "ID 错误" },
        {
          in: "header",
          parameter: "X-Approval",
          code: "REQUIRED",
          message: "缺少批准",
        },
      ];
      const expected = {
        code: `ERROR_${status}`,
        message: "失败说明",
        httpStatus: status,
        isBusinessError: true,
        kind: "http",
        retryable: status === 429,
        outcome: status === 503 ? "unknown" : "not_executed",
        fields,
        requestId: "req-1",
      };
      let observed = false;
      await assert.rejects(
        send(
          {
            status,
            body: {
              code: expected.code,
              message: expected.message,
              data: null,
              error: {
                retryable: expected.retryable,
                outcome: expected.outcome,
                fields,
              },
              requestId: expected.requestId,
            },
          },
          (error) => {
            observed = true;
            for (const [key, value] of Object.entries(expected)) {
              assert.deepEqual(error[key as keyof ContractError], value);
            }
            assert.ok(error.cause);
          },
        ),
        (error: unknown) => {
          for (const [key, value] of Object.entries(expected)) {
            assert.deepEqual(
              (error as ContractError)[key as keyof ContractError],
              value,
            );
          }
          return true;
        },
      );
      assert.ok(observed);
    });
  }

  for (const body of [
    "not-json",
    "<html>Bad gateway</html>",
    null,
    {},
    { code: null },
    { error: { code: "DO_NOT_READ" } },
  ]) {
    test(`畸形错误包体走 HTTP 兜底：${JSON.stringify(body)}`, async () => {
      await assert.rejects(
        send({ status: 500, statusText: "Server Error", body }),
        {
          code: 500,
          message: hasStatusText ? "Server Error" : "HTTP 500",
          httpStatus: 500,
          kind: "http",
          isBusinessError: false,
        },
      );
    });
  }

  test("显式开启后空 statusText 继续使用 HTTP 文案兜底", async () => {
    await assert.rejects(send({ status: 500, statusText: "", body: null }), {
      code: 500,
      message: "HTTP 500",
      isBusinessError: false,
    });
  });
  test("显式开启后非 2xx 的业务码 200 仍 reject", async () => {
    await assert.rejects(
      send({ status: 403, body: { code: 200, message: "ok" } }),
      {
        code: 200,
        message: "ok",
        isBusinessError: true,
        httpStatus: 403,
      },
    );
  });

  test("定制解析器复用三个 getter", async () => {
    const scenario: Scenario = {
      status: 422,
      statusText: hasStatusText ? "Custom Status" : "",
      parser: "custom",
      body: { code: "CUSTOM", message: "定制文案", data: { nested: true } },
    };
    await assert.rejects(send(scenario), {
      code: "CUSTOM",
      message: "定制文案",
      retryable: false,
      outcome: "unknown",
      fields: ["custom-field"],
      httpStatus: 422,
      kind: "http",
    });
    assert.equal(scenario.parserCalled, true);
  });
  for (const parser of ["undefined", "throw"] as const) {
    test(`定制解析器 ${parser} 时仍走 HTTP 兜底`, async () => {
      const scenario: Scenario = {
        status: 404,
        statusText: "Not Found",
        parser,
        body: { code: "IGNORED" },
      };
      await assert.rejects(send(scenario), {
        code: 404,
        kind: "http",
        httpStatus: 404,
        isBusinessError: false,
      });
      assert.equal(scenario.parserCalled, true);
    });
  }
  test("legacy 恒 200 不调用错误解析器", async () => {
    const scenario: Scenario = {
      status: 200,
      body: { code: 9527, message: "旧错误" },
      parser: "throw",
    };
    await assert.rejects(send(scenario), {
      code: 9527,
      message: "旧错误",
      isBusinessError: true,
    });
    assert.equal(scenario.parserCalled, undefined);
  });
  test("legacy 恒 200 成功", async () => {
    const result = await send({
      status: 200,
      body: { code: 200, message: "ok", data: 0 },
    });
    assert.equal((result as { data: number }).data, 0);
  });
  test("legacy 恒 200 失败不经过非成功 HTTP 解析", async () => {
    await assert.rejects(
      send({
        status: 200,
        body: { code: 9527, message: "旧错误", data: null },
      }),
      {
        code: 9527,
        message: "旧错误",
        isBusinessError: true,
        kind: "business",
        httpStatus: 200,
      },
    );
  });
};

export const networkErrorContract = (
  test: (name: string, fn: () => Promise<void>) => unknown,
  send: (
    scene: string,
    observe: (error: ContractError) => void,
  ) => Promise<unknown>,
  noResponseCode: string,
) => {
  for (const [scene, code] of [
    ["no-response", noResponseCode],
    ["timeout", "NO_RESPONSE_TIMEOUT"],
    ["offline", "NO_RESPONSE_OFFLINE"],
  ]) {
    test(`${scene} 保留网络分类与 cause，不伪造响应状态`, async () => {
      const check = (error: ContractError) => {
        assert.equal(error.code, code);
        assert.equal(error.kind, "network");
        assert.equal(error.isBusinessError, false);
        assert.equal(error.httpStatus, undefined);
        assert.equal(error.requestId, undefined);
        assert.ok(error.cause);
      };
      await assert.rejects(send(scene, check), (error: unknown) => {
        check(error as ContractError);
        return true;
      });
    });
  }
};

export const configuredParser = (scenario: Scenario) =>
  scenario.parser
    ? (
        response: { status: number; statusText: string; body: unknown },
        getters: {
          getBusinessCode: (body: unknown) => string | number;
          getBusinessMsg: (body: unknown) => string;
          getBusinessData: <D = unknown>(body: unknown) => D;
        },
      ) => {
        scenario.parserCalled = true;
        if (scenario.parser === "throw") throw new Error("parser failed");
        if (scenario.parser === "undefined") return undefined;
        assert.equal(response.status, 422);
        assert.equal(response.statusText, scenario.statusText);
        assert.deepEqual(getters.getBusinessData(response.body), {
          nested: true,
        });
        return {
          code: getters.getBusinessCode(response.body),
          message: getters.getBusinessMsg(response.body),
          retryable: false,
          outcome: "unknown" as const,
          fields: ["custom-field"],
        };
      }
    : undefined;
