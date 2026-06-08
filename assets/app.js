const documents = {
  overview: {
    label: "9 个月总计划",
    path: "总计划/ielts-9-month-plan-revised.md"
  },
  "month-1-2": {
    label: "第 1–2 月计划",
    path: "月度计划/ielts-month-1-2-detailed.md"
  },
  "month-3-4": {
    label: "第 3–4 月计划",
    path: "月度计划/ielts-month-3-4-detailed.md"
  },
  template: {
    label: "学习成果模版",
    path: "学习模版/ielts-study-outcome-example.md"
  },
  "polar-bears": {
    label: "成果示范 · 北极熊",
    path: "学习模版/ielts-study-outcome-polar-bears.md"
  }
};

const content = document.querySelector("#doc-content");
const toc = document.querySelector("#doc-toc");
const tabs = [...document.querySelectorAll(".doc-tab")];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function documentKeyForLink(href) {
  const filename = decodeURIComponent(href.split("/").pop());
  return Object.entries(documents).find(([, doc]) => doc.path.endsWith(filename))?.[0];
}

function renderInline(source) {
  const codeTokens = [];
  let value = source.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  value = escapeHtml(value);
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const key = documentKeyForLink(href);
    if (key) {
      return `<a href="#reader" data-doc-link="${key}">${text}</a>`;
    }
    const external = /^https?:\/\//.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${text}</a>`;
  });
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  value = value.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  value = value.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  codeTokens.forEach((code, index) => {
    value = value.replace(`@@CODE${index}@@`, code);
  });
  return value;
}

function slugify(text, index) {
  const clean = text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${clean || "section"}-${index}`;
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
}

function isSpecial(line, nextLine = "") {
  return /^(#{1,6})\s+/.test(line)
    || /^\s*```/.test(line)
    || /^\s*>/.test(line)
    || /^\s*([-*+]\s+|\d+\.\s+)/.test(line)
    || /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)
    || (line.includes("|") && isTableDivider(nextLine));
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let headingIndex = 0;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      output.push(`<pre><button class="copy-code" type="button">复制</button><code${language ? ` data-language="${escapeHtml(language)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const rendered = renderInline(heading[2]);
      const id = slugify(rendered, headingIndex++);
      output.push(`<h${level} id="${id}">${rendered}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      output.push("<hr>");
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      output.push(`<blockquote><p>${renderInline(quote.join("<br>"))}</p></blockquote>`);
      continue;
    }

    if (line.includes("|") && isTableDivider(nextLine)) {
      const headers = tableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      output.push(`<div class="table-wrap"><table><thead><tr>${headers.map(cell => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const tag = ordered ? "ol" : "ul";
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
        if (!match || /\d+\./.test(match[1]) !== ordered) break;
        items.push(`<li>${renderInline(match[2])}</li>`);
        index += 1;
      }
      output.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isSpecial(lines[index], lines[index + 1] || "")) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return output.join("\n");
}

function buildToc() {
  const headings = [...content.querySelectorAll("h2, h3")];
  if (!headings.length) {
    toc.innerHTML = '<span class="toc-loading">此文档没有可用目录。</span>';
    return;
  }
  toc.innerHTML = headings.map(heading => (
    `<a class="toc-${heading.tagName.toLowerCase()}" href="#${heading.id}">${heading.textContent}</a>`
  )).join("");
}

function bindRenderedContent() {
  content.querySelectorAll("[data-doc-link]").forEach(link => {
    link.addEventListener("click", () => loadDocument(link.dataset.docLink));
  });

  content.querySelectorAll(".copy-code").forEach(button => {
    button.addEventListener("click", async () => {
      const code = button.nextElementSibling.textContent;
      await navigator.clipboard.writeText(code);
      button.textContent = "已复制";
      window.setTimeout(() => { button.textContent = "复制"; }, 1200);
    });
  });
}

async function loadDocument(key) {
  const doc = documents[key] || documents.overview;
  tabs.forEach(tab => {
    const active = tab.dataset.doc === key;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  content.innerHTML = '<div class="loading-card"><span></span><p>正在读取学习计划…</p></div>';
  toc.innerHTML = '<span class="toc-loading">正在整理目录…</span>';

  try {
    const response = await fetch(encodeURI(doc.path));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    content.innerHTML = renderMarkdown(markdown);
    buildToc();
    bindRenderedContent();
    document.title = `${doc.label} · IELTS Study Lab`;
  } catch (error) {
    content.innerHTML = `<div class="error-card"><strong>文档读取失败</strong><p>请刷新页面重试，或前往 <a href="https://github.com/liyongzheng666/ielts-study-plan" target="_blank" rel="noreferrer">GitHub 仓库</a>查看原文。</p><code>${escapeHtml(error.message)}</code></div>`;
    toc.innerHTML = '<span class="toc-loading">目录暂不可用。</span>';
  }
}

function setupTracker() {
  const checkboxes = [...document.querySelectorAll("[data-month]")];
  const count = document.querySelector("#progress-count");
  const bar = document.querySelector("#progress-bar");

  function update() {
    const complete = checkboxes.filter(box => box.checked).length;
    count.textContent = String(complete);
    bar.style.width = `${(complete / checkboxes.length) * 100}%`;
  }

  checkboxes.forEach(box => {
    const key = `ielts-study-month-${box.dataset.month}`;
    box.checked = localStorage.getItem(key) === "true";
    box.addEventListener("change", () => {
      localStorage.setItem(key, String(box.checked));
      update();
    });
  });
  update();
}

tabs.forEach(tab => tab.addEventListener("click", () => loadDocument(tab.dataset.doc)));
document.querySelector("#print-page").addEventListener("click", () => window.print());
setupTracker();
loadDocument("overview");
