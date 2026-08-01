import path from "path";
import { fileURLToPath } from "url";
import { createStaticFromRoutes } from "../src/hashttp.js";

const demoDir = path.dirname(fileURLToPath(import.meta.url));

const news = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras elementum neque quis scelerisque laoreet. Cras sollicitudin elit eu vulputate vehicula.",
  "Fusce pulvinar pulvinar elit vel egestas. Suspendisse potenti. Morbi quis dolor erat. Morbi nec turpis quis justo faucibus fringilla. Maecenas porta ante at orci varius sodales.",
];

const routes = {
  "/": "public/index.html",
  "/articles": {
    target: "public/articles/index.html",
    model: { title: "Articles" },
  },
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    model: ({ params }) => ({
      slug: params.slug,
      title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
  "/composed": [
    {
      target: "public/header.html",
      model: { title: "Hello, World!" },
    },
    "public/greetings.html",
    ...news.map(item => ({
      target: "public/section-item.html",
      model: {
        content: `<p>${item}</p>`
      },
    })),
    {
      target: "public/footer.html",
      model: { year: new Date().getFullYear() },
    },
  ],
  "/composed-stream": {
    stream: true,
    chunks: [
      {
        target: "public/header.html",
        model: { title: "Streaming" },
      },
      {
        target: "public/greetings.html",
        delay: 1000,
      },
      {
        target: "public/footer.html",
        model: { year: new Date().getFullYear() },
        delay: 2000,
      },
    ],
  },
  "/factory/:name": ({ params, query }) => ({
    target: "public/factory.html",
    model: {
      name: params.name,
      lang: query.lang || "en",
    },
  }),
};

const paths = [
  "/",
  "/articles",
  "/articles/hello-world",
  "/composed",
  "/composed-stream",
  "/factory/anything",
];

async function main() {
  const result = await createStaticFromRoutes(routes, paths, {
    baseDir: demoDir,
    outputDir: path.join(demoDir, "dist"),
  });

  console.log("Generated files:");
  for (const file of result.generated) {
    console.log(`  ${file}`);
  }

  if (result.errors.length > 0) {
    console.error("Errors:");
    for (const err of result.errors) {
      console.error(`  ${err}`);
    }
  }
}

main();