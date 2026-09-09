(() => {
  const isArticle = Boolean(window.NOMAD_BLOG_POST);

  const articleRoot = document.querySelector("#post");
  const listRoot = document.querySelector("#post-list");

  const BLOG_BASE = "/blog/";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));

  const RAW_BASE =
    "https://raw.githubusercontent.com/nomadanarchy/nomadanarchy.github.io/master/blog/";

  const asset = (file) =>
    `${RAW_BASE}${String(file).replace(/^\/+/, "")}`;

  const postUrl = (slug) =>
    `${BLOG_BASE}posts/${encodeURIComponent(slug)}/`;

  function parseFrontMatter(source) {
    const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

    if (!match) {
      return {
        data: {},
        body: source
      };
    }

    const data = {};

    for (const line of match[1].split(/\r?\n/)) {
      const i = line.indexOf(":");

      if (i < 0) continue;

      const key = line.slice(0, i).trim();
      let value = line.slice(i + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Handle simple YAML arrays such as:
      // tags: [news, community]
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      data[key] = value;
    }

    return {
      data,
      body: source.slice(match[0].length)
    };
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function renderCallouts(html) {
    return html.replace(
      /<p>:::(note|tip|warning|danger)\s*([\s\S]*?):::<\/p>/gi,
      (_, type, content) => `
        <aside class="callout ${type.toLowerCase()}">
          <div class="callout-title">${escapeHtml(type)}</div>
          ${content}
        </aside>
      `
    );
  }

  function setMeta(name, content) {
    if (!content) return;

    let node = document.querySelector(`meta[name="${name}"]`);

    if (!node) {
      node = document.createElement("meta");
      node.name = name;
      document.head.appendChild(node);
    }

    node.content = content;
  }

  async function renderArticle() {
    if (!articleRoot) return;

    const slug = window.NOMAD_BLOG_POST;

    if (!slug) {
      throw new Error("No blog post slug was provided.");
    }

    const markdownUrl = asset(
      `posts/${encodeURIComponent(slug)}.md`
    );

    console.log("[Nomad Blog] Loading:", markdownUrl);

    const response = await fetch(
      markdownAsset(`posts/${encodeURIComponent(slug)}.md`),
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        `Markdown returned ${response.status}: ${markdownUrl}`
      );
    }

    const source = await response.text();

    const {
      data,
      body
    } = parseFrontMatter(source);

    const title =
      data.title ||
      slug.replace(/-/g, " ");

    const description =
      data.description || "";

    document.title =
      `${title} — Nomad Anarchy`;

    setMeta("description", description);

    if (typeof marked === "undefined") {
      throw new Error("Marked.js failed to load.");
    }

    if (typeof DOMPurify === "undefined") {
      throw new Error("DOMPurify failed to load.");
    }

    const rawHtml = marked.parse(body, {
      gfm: true,
      breaks: false
    });

    let html = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: [
        "style",
        "script",
        "iframe",
        "object",
        "embed"
      ]
    });

    // Process generated HTML.
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    // Remove a duplicate H1 when the Markdown itself
    // starts with the same title as the front matter.
    const firstH1 = wrapper.querySelector(":scope > h1");

    if (
      firstH1 &&
      slugify(firstH1.textContent) === slugify(title)
    ) {
      firstH1.remove();
    }

    // Add IDs to headings for anchor links.
    wrapper
      .querySelectorAll("h2, h3, h4")
      .forEach((heading) => {
        const id = slugify(heading.textContent);

        if (id) {
          heading.id = id;
        }
      });

    // Make external links open in a new tab.
    wrapper
      .querySelectorAll("a")
      .forEach((a) => {
        if (
          a.hostname &&
          a.hostname !== location.hostname
        ) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
      });

    html = renderCallouts(wrapper.innerHTML);

    // IMPORTANT:
    // Use BLOG_BASE, not the nonexistent "blogBase".
    articleRoot.innerHTML = `
      <nav class="blog-nav">
        <a
          href="${BLOG_BASE}"
          class="blog-brand"
        >
          ← Nomad Anarchy Blog
        </a>
      </nav>

      <header class="post-header">
        ${
          data.category
            ? `
              <div class="post-category">
                ${escapeHtml(data.category)}
              </div>
            `
            : ""
        }

        <h1>${escapeHtml(title)}</h1>

        <div class="post-meta">
          ${
            data.author
              ? `By ${escapeHtml(data.author)}`
              : ""
          }

          ${
            data.author && data.date
              ? " · "
              : ""
          }

          ${
            data.date
              ? escapeHtml(data.date)
              : ""
          }
        </div>

        ${
          description
            ? `
              <p class="post-description">
                ${escapeHtml(description)}
              </p>
            `
            : ""
        }
      </header>

      <div class="post-content">
        ${html}
      </div>

      <footer class="post-footer">
        <a href="${BLOG_BASE}">
          ← Back to blog
        </a>
      </footer>
    `;
  }

  async function renderIndex() {
    if (!listRoot) return;

    try {
      const response = await fetch(
        asset("posts.json"),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `posts.json returned ${response.status}`
        );
      }

      const posts = await response.json();

      const count =
        document.querySelector("#post-count");

      if (count) {
        count.textContent =
          `${posts.length} ${
            posts.length === 1
              ? "post"
              : "posts"
          }`;
      }

      listRoot.innerHTML = posts
        .map((post) => `
          <a
            class="post-card"
            href="${postUrl(post.slug)}"
            data-search="${escapeHtml(
              `${post.title || ""} ${
                post.description || ""
              } ${
                post.category || ""
              } ${
                post.author || ""
              }`
            )}"
          >
            <div class="post-card-top">
              <span class="post-category">
                ${escapeHtml(
                  post.category || "General"
                )}
              </span>

              ${
                post.date
                  ? `
                    <time datetime="${escapeHtml(
                      post.date
                    )}">
                      ${escapeHtml(post.date)}
                    </time>
                  `
                  : ""
              }
            </div>

            <h2>
              ${escapeHtml(post.title || "Untitled")}
            </h2>

            <p>
              ${escapeHtml(
                post.description || ""
              )}
            </p>

            <span class="read-more">
              Read article →
            </span>
          </a>
        `)
        .join("");

      const search =
        document.querySelector("#blog-search");

      const empty =
        document.querySelector("#no-results");

      search?.addEventListener("input", () => {
        const q =
          search.value
            .toLowerCase()
            .trim();

        let visible = 0;

        listRoot
          .querySelectorAll(".post-card")
          .forEach((card) => {
            const matches =
              !q ||
              card.dataset.search
                .toLowerCase()
                .includes(q);

            card.hidden = !matches;

            if (matches) {
              visible++;
            }
          });

        if (empty) {
          empty.hidden = visible !== 0;
        }
      });

    } catch (error) {
      listRoot.innerHTML = `
        <p class="post-error">
          Unable to load blog posts.
        </p>
      `;

      console.error(
        "[Nomad Blog]",
        error
      );
    }
  }

  if (isArticle) {
    renderArticle().catch((error) => {
      console.error(
        "[Nomad Blog] Article error:",
        error
      );

      if (articleRoot) {
        articleRoot.innerHTML = `
          <nav class="blog-nav">
            <a
              href="${BLOG_BASE}"
              class="blog-brand"
            >
              ← Nomad Anarchy Blog
            </a>
          </nav>

          <div class="post-error">
            <strong>Unable to load this article.</strong>
            <p>${escapeHtml(error.message)}</p>
          </div>
        `;
      }
    });
  } else {
    renderIndex();
  }
})();