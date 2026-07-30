# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Circuito de pedido

1. Elegís una hamburguesa del menú.
2. Se abre el paso de **extras** (los siete de la carta) y **bebida** (Pepsi,
   Mirinda, 7up o agua Villavicencio, una sola).
3. El carrito lleva a un checkout de tres pasos: **sucursal** → **dirección** →
   **pago y datos**.
4. "Finalizar pedido" arma un mensaje estándar con todo el pedido y lo manda al
   chatbot de WhatsApp, que confirma y —si el pago es con tarjeta o
   transferencia— responde con el link o el CBU.

No hay pasarela de pago en el sitio: el cobro lo resuelve el chatbot.

### Lo que falta cargar

- **`WHATSAPP_ORDERS`** en `app/menu-data.ts`: el número del chatbot, en formato
  internacional sin `+` (ej. `5493811234567`). Mientras esté vacío, el checkout
  muestra el mensaje en pantalla para copiarlo a mano en lugar de abrir WhatsApp.
- **`DELIVERY_FEE`** en `app/page.tsx`: hoy es un monto fijo.
- Del lado del chatbot, entender el formato del mensaje (`buildMessage()` en
  `app/page.tsx`) para parsear el pedido y la referencia `RD-XXXXXX`.

### Autocompletado de direcciones

`app/api/direcciones/route.ts` hace de proxy a [Photon](https://photon.komoot.io),
un geocodificador abierto sobre OpenStreetMap: sin API key ni costo. Está
acotado a Tucumán y sólo se puede avanzar eligiendo una opción de la lista, no
con texto libre, para que la dirección del pedido siempre exista.

Dos particularidades de Photon resueltas ahí: no interpola alturas (busca la
calle y le vuelve a pegar el número), y su índice de esta zona falla con
diacríticos (se consulta también la variante sin acentos, por eso "Muñecas 800"
encuentra resultados).

Para pasar a Google Places sólo cambia ese archivo: el contrato con el cliente
(`{ suggestions: [{ id, label, detail, lat, lon }] }`) queda igual.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
