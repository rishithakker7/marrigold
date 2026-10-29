export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/admin", "/api/admin/*"],
      },
    ],
    sitemap: "https://www.marrigoldevents.com/sitemap.xml",
  };
}

