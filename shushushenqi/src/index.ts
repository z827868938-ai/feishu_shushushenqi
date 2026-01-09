import $ from "jquery";
import { bitable } from "@lark-base-open/js-sdk";
import "./index.scss";

/**
 * =========================
 * 1) 配置区：你这份是可用的，我不动
 * =========================
 */
const COZE_API_BASE = "https://api.coze.cn";
const COZE_WORKFLOW_ID = "7593155326733434915";
const COZE_PAT =
    "sat_TKKXdcbl480LV9AhNjwrsoPloL0otWQ4WzrWj6TzUkNwbOt7Pa1jg9gNjWWc29sK";

/** 输出到页面 */
function print(obj: any) {
  $("#output").text(typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
}

function setStatus(text: string) {
  $("#status").text(text);
}

/**
 * ✅ 你的富文本转纯文本（保持不变）
 */
function cellValueToString(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);

  if (Array.isArray(val)) {
    const looksLikeRichText = val.every(
        (seg) =>
            seg &&
            typeof seg === "object" &&
            typeof seg.type === "string" &&
            ("text" in seg || "mention" in seg || "link" in seg)
    );

    if (looksLikeRichText) {
      return val
          .map((seg) => {
            if (typeof (seg as any).text === "string") return (seg as any).text;
            if (typeof (seg as any).name === "string") return (seg as any).name;
            if (typeof (seg as any).url === "string") return (seg as any).url;
            return "";
          })
          .join("");
    }

    return val
        .map((x) => {
          if (x === null || x === undefined) return "";
          if (typeof x === "string") return x;
          if (typeof x === "number" || typeof x === "boolean") return String(x);
          if (typeof x === "object") {
            if (typeof (x as any).name === "string") return (x as any).name;
            if (typeof (x as any).text === "string") return (x as any).text;
          }
          return "";
        })
        .filter(Boolean)
        .join(",");
  }

  if (typeof val === "object") {
    if (typeof (val as any).text === "string") return (val as any).text;
    if (typeof (val as any).name === "string") return (val as any).name;
    if (typeof (val as any).url === "string") return (val as any).url;

    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return String(val);
}

/** 表名包含关键字 -> tableId（取第一条） */
function findTableIdByNameIncludes(
    tableMetaList: Array<{ id: string; name: string }>,
    keyword: string
): string | "" {
  const found = tableMetaList.find((t) => (t.name || "").includes(keyword));
  return found?.id || "";
}

/** 取表第一条记录某字段的值 */
async function getFirstRowFieldValueByName(
    tableId: string,
    fieldName: string
): Promise<string> {
  const table = await bitable.base.getTableById(tableId);
  const field = await table.getFieldByName(fieldName);
  const res = await table.getRecords({ pageSize: 1 });

  if (!res.records || res.records.length === 0) return "";

  const first = res.records[0];
  const rawVal = first.fields?.[field.id];

  return cellValueToString(rawVal);
}

/** 调用 Coze workflow/run */
async function runCozeWorkflow(parameters: Record<string, any>) {
  const url = `${COZE_API_BASE}/v1/workflow/run`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COZE_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: COZE_WORKFLOW_ID,
      parameters,
      is_async: false,
    }),
  });

  const text = await resp.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!resp.ok) {
    throw new Error(`Coze API HTTP ${resp.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

$(async function () {
  try {
    setStatus("初始化中…");

    // ✅ 保存最新 debug_url（用于复制）
    let latestDebugUrl = "";

    // ✅ 复制到剪贴板（带降级方案）
    async function copyText(text: string) {
      if (!text) throw new Error("没有可复制的 debug_url");

      // 1) 尝试 Clipboard API（很多 iframe 会被 Permissions Policy 禁掉）
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(text);
          return;
        }
      } catch {
        // 忽略，走降级方案
      }

      // 2) 降级：textarea + execCommand('copy')
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);

        ta.focus();
        ta.select();

        const ok = document.execCommand("copy");
        document.body.removeChild(ta);

        if (ok) return;
      } catch {
        // 继续兜底
      }

      // 3) 最后兜底：让用户手动复制
      window.prompt("复制下面的链接：", text);
    }

    // ✅ 点击复制 icon（在状态“完成”旁边）
    $("#copyDebugUrl").on("click", async () => {
      try {
        await copyText(latestDebugUrl);

        // 不打扰的小反馈：title 短暂变“已复制”
        const $btn = $("#copyDebugUrl");
        const oldTitle = $btn.attr("title") || "";
        $btn.attr("title", "已复制");
        setTimeout(() => $btn.attr("title", oldTitle), 900);
      } catch (e: any) {
        alert(e?.message || String(e));
      }
    });

    // 1) 初始化：拿到所有表 + 当前 selection
    const [tableMetaList, selection] = await Promise.all([
      bitable.base.getTableMetaList(),
      bitable.base.getSelection(),
    ]);

    const appToken = selection.baseId; // app_token
    const activeTableId = selection.tableId;

    print({
      tip: "页面初始化完成",
      app_token: appToken,
      active_table_id: activeTableId,
      hint: "填写 detail_url 后点击「立即采集」",
    });

    setStatus("就绪");

    // 2) 绑定「立即采集」按钮
    $("#collectNow").on("click", async function () {
      const $btn = $("#collectNow");
      try {
        setStatus("采集中…");
        $btn.prop("disabled", true);

        // 每次采集先隐藏复制按钮，避免复用旧的 debug_url
        latestDebugUrl = "";
        $("#copyDebugUrl").hide();

        const detailUrl = String($("#detailUrl").val() || "").trim();
        if (!detailUrl) {
          throw new Error("你还没有填写[笔记链接]");
        }

        // ✅ 链接校验：二选一即可（xhslink 或 explore）
        const mustInclude1 = "http://xhslink.com/";
        const mustInclude2 = "https://www.xiaohongshu.com/explore/";
        if (!detailUrl.includes(mustInclude1) && !detailUrl.includes(mustInclude2)) {
          throw new Error("笔记链接不正确");
        }

        // 找表
        const sysTableId = findTableIdByNameIncludes(tableMetaList, "系统设置");
        const bijiTableId = findTableIdByNameIncludes(tableMetaList, "笔记采集");
        const zuozheTableId = findTableIdByNameIncludes(tableMetaList, "作者库");

        if (!sysTableId) throw new Error('找不到表名包含“系统设置”的表');
        if (!bijiTableId) throw new Error('找不到表名包含“笔记采集”的表');
        if (!zuozheTableId) throw new Error('找不到表名包含“作者库”的表');

        // 读系统设置第一条
        const authorization = await getFirstRowFieldValueByName(sysTableId, "授权码");
        const vip_code = await getFirstRowFieldValueByName(sysTableId, "会员码");

        if (!authorization) {
          throw new Error('请前往⚙️系统设置，配置正确的"授权码"');
        }
        if (!vip_code) {
          throw new Error('请前往⚙️系统设置，配置正确的"会员码"');
        }

        // payload（与你给的 JSON 一致）
        const payload = {
          authorization,
          vip_code,
          detail_url: detailUrl,
          app_token: appToken,
          biji_table_id: bijiTableId,
          zuozhe_table_id: zuozheTableId,
        };

        print({
          step: "payload 组装完成",
          payload,
        });

        // 调用 Coze
        const cozeResult = await runCozeWorkflow(payload);

        print({
          step: "Coze 返回",
          payload,
          cozeResult,
        });

        // ✅ 拿 debug_url：做成“完成”旁边的复制 icon
        const debugUrl = String((cozeResult as any)?.debug_url || "").trim();
        latestDebugUrl = debugUrl;
        if (debugUrl) $("#copyDebugUrl").show();

        // ✅ 新增：如果 API 返回的参数 err == 500，则提示“会员码”问题
        try {
          // cozeResult.data 可能是 JSON 字符串："{\"data\":0,\"err\":\"500\"}"
          const inner =
              typeof (cozeResult as any)?.data === "string"
                  ? JSON.parse((cozeResult as any).data)
                  : (cozeResult as any)?.data;

          if (String(inner?.err) === "500") {
            throw new Error("采集失败，请确认您的「会员码」是否正确");
          }
        } catch (e: any) {
          // 只有当我们明确识别到 err==500 时才抛；JSON 解析失败不影响原逻辑
          if (e?.message === "采集失败，请确认您的「会员码」是否正确") {
            throw e;
          }
        }

        alert("✅已采集完成，请前往「🧲笔记采集」查看");
        setStatus("完成");
      } catch (err: any) {
        console.error(err);
        alert(err?.message || String(err));
        setStatus("失败");
      } finally {
        $btn.prop("disabled", false);
      }
    });
  } catch (err: any) {
    console.error(err);
    alert(err?.message || String(err));
    setStatus("初始化失败");
  }
});
