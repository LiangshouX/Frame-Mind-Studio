
# 1. DeepSeek： 
参考文档：
```html
<div class="row"><div class="col col--12"><h1>模型 &amp; 价格</h1>
<p>下表所列模型价格以“百万 tokens”为单位。Token 是模型用来表示自然语言文本的的最小单位，可以是一个词、一个数字或一个标点符号等。我们将根据模型输入和输出的总 token 数进行计量计费。</p>
<hr>
<h2 class="anchor anchorWithStickyNavbar_YAqC" id="模型细节">模型细节<a href="#模型细节" class="hash-link" aria-label="模型细节的直接链接" title="模型细节的直接链接">​</a></h2>
<div style="font-size: 14px;"><b><table style="text-align: center;"><tr><td colspan="2" style="text-align: center;">模型</td><td>deepseek-v4-flash<sup>(1)</sup></td><td>deepseek-v4-pro</td></tr><tr><td colspan="2">BASE URL (OpenAI 格式)</td><td colspan="2"><a href="https://api.deepseek.com" target="_blank" rel="noopener noreferrer">https://api.deepseek.com</a></td></tr><tr><td colspan="2">BASE URL (Anthropic 格式)</td><td colspan="2"><a href="https://api.deepseek.com/anthropic" target="_blank" rel="noopener noreferrer">https://api.deepseek.com/anthropic</a></td></tr><tr><td colspan="2" style="text-align: center;">模型版本</td><td>DeepSeek-V4-Flash</td><td>DeepSeek-V4-Pro</td></tr><tr><td colspan="2">思考模式</td><td colspan="2">支持非思考与思考模式（默认）<br>切换方式详见<a href="/zh-cn/guides/thinking_mode">思考模式</a></td></tr><tr><td colspan="2">上下文长度</td><td colspan="2">1M</td></tr><tr><td colspan="2">输出长度</td><td colspan="2">最大 384K</td></tr><tr><td rowspan="4">功能</td><td><a href="/zh-cn/guides/json_mode">Json Output</a></td><td>支持</td><td>支持</td></tr><tr><td><a href="/zh-cn/guides/tool_calls">Tool Calls</a></td><td>支持</td><td>支持</td></tr><tr><td><a href="/zh-cn/guides/chat_prefix_completion">对话前缀续写（Beta）</a></td><td>支持</td><td>支持</td></tr><tr><td><a href="/zh-cn/guides/fim_completion">FIM 补全（Beta）</a></td><td>仅非思考模式支持</td><td>仅非思考模式支持</td></tr><tr><td rowspan="3">价格</td><td>百万tokens输入（缓存命中）</td><td>0.02元</td><td>0.025元</td></tr><tr><td>百万tokens输入（缓存未命中）</td><td>1元</td><td>3元</td></tr><tr><td>百万tokens输出</td><td>2元</td><td>6元</td></tr><tr><td colspan="2">并发限制<sup>(2)</sup></td><td>2500</td><td>500</td></tr></table></b></div>
<p>(1) deepseek-chat 与 deepseek-reasoner 两个模型名将于北京时间 2026/07/24 23:59 弃用。出于兼容考虑，二者分别对应 deepseek-v4-flash 的非思考与思考模式。<br>
(2) 更多并发限制细节，请参考<a href="/zh-cn/quick_start/rate_limit">限速与隔离</a></p>
<hr>
<h2 class="anchor anchorWithStickyNavbar_YAqC" id="扣费规则">扣费规则<a href="#扣费规则" class="hash-link" aria-label="扣费规则的直接链接" title="扣费规则的直接链接">​</a></h2>
<p>扣减费用 = token 消耗量 × 模型单价，对应的费用将直接从充值余额或赠送余额中进行扣减。
当充值余额与赠送余额同时存在时，优先扣减赠送余额。</p>
<p>产品价格可能发生变动，DeepSeek 保留修改价格的权利。请您依据实际用量按需充值，定期查看此页面以获知最新价格信息。</p></div></div>

```


# 2. 阿里云百炼：
- 常规API调用：
  环境变量：DASHSCOPE_API_KEY
  base_url： https://llm-ljv5egw90incmdqe.cn-beijing.maas.aliyuncs.com/compatible-mode/v1 ，
  模型（推荐）： qwen3.7-max、qwen3.7-plus、qwen3.6-flash，

- TokenPlan：
  base_url： https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
  模型列表： 
```html
<section id="tp01-supported-models" class="section" data-spm-anchor-id="a2c4g.11186623.0.i3.f86128d0yVMK6L">
        <h2 id="tp01-title-models" data-spm-anchor-id="a2c4g.11186623.0.i4.f86128d0yVMK6L"><b>支持的模型</b><span class="header-copy-icon-container"><span id="header-copy-icon" class="HeaderCopyIcon--copyIcon--KLDBL3w "><span role="img" class="Icon--icon--jErARdR"><svg width="1em" height="1em" viewBox="0 0 32 32" focusable="false" color="currentColor" fill="currentColor" class="" data-icon="link"><g fill-rule="evenodd" stroke-width="1"><polygon fill-rule="nonzero" points="25.6690706 14.9411403 25.6690067 7.62338461 18.1629823 7.62338461 18.1629823 14.9411317 16.1629823 14.9411317 16.1629823 5.62338461 27.6689895 5.62338467 27.6690706 14.9411231" transform="translate(21.916, 10.2823) rotate(45) translate(-21.916, -10.2823)"></polygon><polygon fill-rule="nonzero" points="6.53309278 17.2533954 6.53309278 24.5711615 14.0391171 24.5711615 14.039181 17.2533867 16.039181 17.2534041 16.0391 26.5711615 4.53309278 26.5711615 4.53309278 17.2533954" transform="translate(10.2861, 21.9123) rotate(45) translate(-10.2861, -21.9123)"></polygon><polygon fill-rule="nonzero" points="16.9462311 11.1327774 16.9462311 21.1327774 14.9462311 21.1327774 14.9462311 11.1327774" transform="translate(15.9462, 16.1328) rotate(45) translate(-15.9462, -16.1328)"></polygon></g></svg></span></span></span></h2>
        
    <section class="collapse for-agent-only" id="6b97ec48f5txa">
      <div class="expandable-title-bold">
        <span class="title"><p id="99acc6b34a398" data-tag="expandable-title" class="expandable-title"><b>支持的模型判断说明</b></p></span>
        <i class="icon help-iconfont help-icon-zhankai1 smallFont"></i>
      </div>
      <div class="expandable-content">
        
            <p id="88b63d0aababu">判定规则：</p>
            <p id="77db3ead89byp">1. 本清单为精确字符串白名单</p>
            <p id="fa5a298e6cnp9">2. 必须逐字符完全匹配，版本号/子型号任何差异均视为不支持</p>
            <p id="2392f61a10vcy">3. 禁止做版本兼容推理</p>
            <p id="82f96dffb00a6"></p>
            <p id="8678a69fa3rvu">判定示范：</p>
            <p id="6219b70cceeuw">- ❌ "qwen3-coder-max" → 清单无此项 → 不支持</p>
          
      </div>
    </section>
  
        <p id="9e23223c7egri" data-spm-anchor-id="a2c4g.11186623.0.i2.f86128d0yVMK6L">仅支持以下精确版本：</p>
        <div class="table-wrapper"><table class="fixed-table" style="width: 710.4px; visibility: hidden;"><colgroup colwidth="0.61*" style="width:20.00%"></colgroup><colgroup colwidth="1.06*" style="width:35.00%"></colgroup><colgroup colwidth="1.36*" style="width:45.00%"></colgroup><thead class="fixed-thead"><tr id="tp01-tr-mhdr-cn">
              <td id="tp01-td-mhdr1-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1"><span>
                <p id="tp01-p-mhdr1-cn"><b>品牌</b></p>
              </span></td>
              <td id="tp01-td-mhdr2-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1"><span>
                <p id="tp01-p-mhdr2-cn"><b>模型 ID（Model ID）</b></p>
              </span></td>
              <td id="tp01-td-mhdr3-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1"><span>
                <p id="tp01-p-mhdr3-cn"><b>模型能力</b></p>
              </span></td>
            </tr></thead></table><table id="tp01-tbl-models-cn" props="china" tablewidth="100" tablecolswidth="20 35 45" autofit="true" data-cond-props="china" class="table">
          <colgroup colwidth="0.61*" style="width:20.00%"></colgroup>
          <colgroup colwidth="1.06*" style="width:35.00%"></colgroup>
          <colgroup colwidth="1.36*" style="width:45.00%"></colgroup>
          <tbody class="tbody">
            <tr id="tp01-tr-mhdr-cn">
              <td id="tp01-td-mhdr1-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1">
                <p id="tp01-p-mhdr1-cn"><b>品牌</b></p>
              </td>
              <td id="tp01-td-mhdr2-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1">
                <p id="tp01-p-mhdr2-cn"><b>模型 ID（Model ID）</b></p>
              </td>
              <td id="tp01-td-mhdr3-cn" rowspan="1" style="background-color:#e5e5e5;vertical-align:middle" colspan="1">
                <p id="tp01-p-mhdr3-cn"><b>模型能力</b></p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen0">
              <td id="tp01-td-cn-qwen-brand" rowspan="6" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen-brand">千问</p>
              </td>
              <td id="tp01-td-cn-qwen0-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen0-m">qwen3.7-max<a href="#tp01-promo-section" id="tp01-link-promo-qwen-cn" title="" class=""><b>（限时活动）</b></a></p>
              </td>
              <td id="tp01-td-cn-qwen0-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen0-c">推理模型、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen0p">
              <td id="tp01-td-cn-qwen0p-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen0p-m">qwen3.7-plus</p>
              </td>
              <td id="tp01-td-cn-qwen0p-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen0p-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen1">
              <td id="tp01-td-cn-qwen1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen1-m">qwen3.6-plus</p>
              </td>
              <td id="tp01-td-cn-qwen1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen1-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen2">
              <td id="tp01-td-cn-qwen2-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen2-m">qwen3.6-flash</p>
              </td>
              <td id="tp01-td-cn-qwen2-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen2-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen3">
              <td id="tp01-td-cn-qwen3-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen3-m">qwen-image-2.0</p>
              </td>
              <td id="tp01-td-cn-qwen3-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen3-c">图像生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-qwen4">
              <td id="tp01-td-cn-qwen4-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen4-m">qwen-image-2.0-pro</p>
              </td>
              <td id="tp01-td-cn-qwen4-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-qwen4-c">图像生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-wan1">
              <td id="tp01-td-cn-wan-brand" rowspan="2" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-wan-brand">万相</p>
              </td>
              <td id="tp01-td-cn-wan1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-wan1-m">wan2.7-image</p>
              </td>
              <td id="tp01-td-cn-wan1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-wan1-c">图像生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-wan2">
              <td id="tp01-td-cn-wan2-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-wan2-m">wan2.7-image-pro</p>
              </td>
              <td id="tp01-td-cn-wan2-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-wan2-c">图像生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-ds1">
              <td id="tp01-td-cn-ds-brand" rowspan="3" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds-brand">DeepSeek</p>
              </td>
              <td id="tp01-td-cn-ds1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds1-m">deepseek-v4-pro</p>
              </td>
              <td id="tp01-td-cn-ds1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds1-c">推理模型、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-ds2">
              <td id="tp01-td-cn-ds2-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds2-m">deepseek-v4-flash</p>
              </td>
              <td id="tp01-td-cn-ds2-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds2-c">推理模型、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-ds3">
              <td id="tp01-td-cn-ds3-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds3-m">deepseek-v3.2</p>
              </td>
              <td id="tp01-td-cn-ds3-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-ds3-c">推理模型、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-kimi0">
              <td id="tp01-td-cn-kimi-brand" rowspan="3" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi-brand">月之暗面</p>
              </td>
              <td id="tp01-td-cn-kimi0-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi0-m">kimi-k2.7-code</p>
              </td>
              <td id="tp01-td-cn-kimi0-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi0-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-kimi1">
              <td id="tp01-td-cn-kimi1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi1-m">kimi-k2.6</p>
              </td>
              <td id="tp01-td-cn-kimi1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi1-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-kimi2">
              <td id="tp01-td-cn-kimi2-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi2-m">kimi-k2.5</p>
              </td>
              <td id="tp01-td-cn-kimi2-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-kimi2-c">推理模型、视觉理解、文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-glm0">
              <td id="tp01-td-cn-glm-brand" rowspan="3" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm-brand">智谱 AI</p>
              </td>
              <td id="tp01-td-cn-glm0-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm0-m">glm-5.2</p>
              </td>
              <td id="tp01-td-cn-glm0-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm0-c">文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-glm1">
              <td id="tp01-td-cn-glm1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm1-m">glm-5.1</p>
              </td>
              <td id="tp01-td-cn-glm1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm1-c">文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-glm2">
              <td id="tp01-td-cn-glm2-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm2-m">glm-5</p>
              </td>
              <td id="tp01-td-cn-glm2-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-glm2-c">文本生成</p>
              </td>
            </tr>
            <tr id="tp01-tr-cn-mm1">
              <td id="tp01-td-cn-mm-brand" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-mm-brand">MiniMax</p>
              </td>
              <td id="tp01-td-cn-mm1-m" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-mm1-m">MiniMax-M2.5</p>
              </td>
              <td id="tp01-td-cn-mm1-c" rowspan="1" style="vertical-align:middle" colspan="1">
                <p id="tp01-p-cn-mm1-c">推理模型、文本生成</p>
              </td>
            </tr>
            
            
          </tbody>
        </table></div>
        
      </section>
```


# 3. MiMo：
## Token Plan  
Base URL： https://token-plan-cn.xiaomimimo.com/v1
  支持的模型：
  支持 MiMo-V2 系列及 MiMo-V2.5 系列共 9 款模型，全档位套餐均可使用。

mimo-v2-pro / v2.5-pro：旗舰推理模型

mimo-v2-omni / v2.5：全能多模态模型

mimo-v2.5-asr：语音识别模型

mimo-v2-tts /v2.5-tts/ v2.5-tts-voiceclone / v2.5-tts-voicedesign：语音合成模型（限时免费）

## 常规API调用： 
参考Python代码：
```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("MIMO_API_KEY"),
    base_url="https://api.xiaomimimo.com/v1"
)

completion = client.chat.completions.create(
    model="mimo-v2.5-pro",
    messages=[
        {
            "role": "system",
            "content": "You are MiMo, an AI assistant developed by Xiaomi. Today is date: Tuesday, December 16, 2025. Your knowledge cutoff date is December 2024."
        },
        {
            "role": "user",
            "content": "please introduce yourself"
        }
    ],
    max_completion_tokens=1024,
    temperature=1.0,
    top_p=0.95,
    stream=False,
    stop=None,
    frequency_penalty=0,
    presence_penalty=0
)

print(completion.model_dump_json())
```