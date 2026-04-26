# Deployment

## GitHub Pages

The app remains GitHub Pages compatible.

- canonical entrypoint: `index.html`
- compatibility redirect: `roses-indoor-designs.html`

## Local preview

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:8123/
```

## Runtime dependency note

The app still depends on CDN-hosted runtime libraries for Three.js, jsPDF, and pdf.js. That is a known hardening debt, not a solved problem.
