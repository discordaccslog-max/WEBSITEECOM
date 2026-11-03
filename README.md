# EcomCla

Marketing site for EcomCla — pre-built ecommerce businesses. Static HTML/CSS/vanilla JS, no build step.

## Files

| File | Purpose |
|---|---|
| `index.html` | Homepage — hero + live stat card, award banner, marquee, how it works, revenue counter, CTA |
| `whats-included.html` | Feature grid + EcomCla vs. starting from scratch comparison table |
| `buy.html` | Product card, pricing, checkout button, "what you get" strip, live stat reminder |
| `faq.html` | FAQ accordion + contact CTA |
| `styles.css` | Shared design system (tokens on `:root`), all page styles, guarantee popup styles |
| `nav.js` | Injects announcement bar, navbar, footer and guarantee popup on every page; scroll navbar, hamburger menu, fade-up animations, `animateCounter()`, FAQ accordion |

## Configuration

Edit the `CONFIG` object at the top of `nav.js`:

- `checkoutUrl` — your Stripe / Shopify / PayPal checkout link. Until it is set, the **Buy Now** button on `buy.html` opens an order email to `supportEmail`.
- `supportEmail`, `price`, `popupDelayMs` (default 4000), `popupStorageKey`.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
npx http-server . -p 5173
```

## Deploy

Works as-is on GitHub Pages (Settings → Pages → deploy from `main`, root folder), Netlify or Vercel.
