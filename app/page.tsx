"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  burgerPhoto,
  drinks,
  extras,
  locations,
  menuCategories,
  menuItems,
  WHATSAPP_ORDERS,
  type MenuCategoryId,
  type MenuItem,
} from "./menu-data";

type CategoryId = "pan" | "carne" | "queso" | "extras";
type Ingredient = {
  id: string;
  name: string;
  detail: string;
  price: number;
  category: CategoryId;
  image?: string;
};
type CartItem = {
  id: number;
  name: string;
  detail: string;
  total: number;
  image?: string;
  custom?: boolean;
  extras?: string[];
  drink?: string;
};

type Delivery = "retiro" | "envio";
type Payment = "efectivo" | "transferencia" | "tarjeta";

type OrderForm = {
  branch: string;
  delivery: Delivery;
  address: AddressSuggestion | null;
  name: string;
  phone: string;
  notes: string;
  payment: Payment;
};

type PlacedOrder = { reference: string; message: string; link: string };

const DELIVERY_FEE = 1800;

// Referencia corta para que el chatbot y el local hablen del mismo pedido.
const makeReference = () => `RD-${Date.now().toString(36).slice(-6).toUpperCase()}`;

const paymentMethods: { id: Payment; label: string; detail: string }[] = [
  { id: "efectivo", label: "Efectivo", detail: "Pagás al recibirlo o al retirar" },
  { id: "transferencia", label: "Transferencia", detail: "El bot te pasa CBU y alias" },
  { id: "tarjeta", label: "Tarjeta de crédito", detail: "El bot te manda un link de pago" },
];
type Selection = Record<CategoryId, string[]>;
type Crop = [number, number, number, number];

type LayerAsset = { src: string; crop: Crop };

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const categories: { id: CategoryId; label: string; eyebrow: string }[] = [
  { id: "pan", label: "Pan", eyebrow: "La base" },
  { id: "carne", label: "Carne", eyebrow: "El corazón" },
  { id: "queso", label: "Queso", eyebrow: "El abrazo" },
  { id: "extras", label: "Extras", eyebrow: "El toque final" },
];

const ingredients: Ingredient[] = [
  { id: "brioche", name: "Brioche", detail: "Mantecoso y tostado", price: 1100, category: "pan", image: "/ingredients/pan-arriba.png" },
  { id: "simple", name: "Simple", detail: "1 medallón de 110 g", price: 2800, category: "carne", image: "/ingredients/medallon.png" },
  { id: "doble", name: "Doble", detail: "2 medallones de 110 g", price: 5000, category: "carne", image: "/ingredients/medallon.png" },
  { id: "triple", name: "Triple", detail: "3 medallones de 110 g", price: 7000, category: "carne", image: "/ingredients/medallon.png" },
  { id: "cheddar", name: "Cheddar", detail: "Una capa por medallón", price: 1100, category: "queso", image: "/ingredients/cheddar.png" },
  { id: "sin-queso", name: "Sin queso", detail: "Sólo carne", price: 0, category: "queso" },
  { id: "bacon", name: "Panceta", detail: "Crocante y ahumada", price: 1500, category: "extras", image: "/ingredients/panceta.png" },
  { id: "cebolla", name: "Cebolla caramelizada", detail: "Lenta y dulce", price: 800, category: "extras", image: "/ingredients/cebolla-caramelizada.png" },
  { id: "tomate", name: "Tomate", detail: "Fresco, corte grueso", price: 500, category: "extras", image: "/ingredients/tomates.png" },
  { id: "huevo", name: "Huevo frito", detail: "Yema cremosa", price: 900, category: "extras", image: "/ingredients/huevo-frito.png" },
];

const defaults: Selection = {
  pan: ["brioche"],
  carne: ["doble"],
  queso: ["cheddar"],
  extras: ["bacon"],
};

const emptyOrder: OrderForm = {
  branch: locations[0].address,
  delivery: "envio",
  address: null,
  name: "",
  phone: "",
  notes: "",
  payment: "efectivo",
};

const layerAssets: Record<string, LayerAsset> = {
  bottomBun: { src: "/ingredients/pan-abajo.png", crop: [60, 280, 920, 490] },
  topBun: { src: "/ingredients/pan-arriba.png", crop: [55, 220, 920, 650] },
  patty: { src: "/ingredients/medallon.png", crop: [45, 285, 935, 450] },
  cheddar: { src: "/ingredients/cheddar.png", crop: [45, 275, 935, 475] },
  bacon: { src: "/ingredients/panceta.png", crop: [40, 335, 940, 310] },
  onion: { src: "/ingredients/cebolla-caramelizada.png", crop: [40, 355, 950, 290] },
  tomato: { src: "/ingredients/tomates.png", crop: [80, 245, 900, 470] },
  egg: { src: "/ingredients/huevo-frito.png", crop: [55, 365, 910, 330] },
};

const imageCache = new Map<string, HTMLImageElement>();

function loadLayerImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const image = cached ?? new Image();
    image.onload = () => { imageCache.set(src, image); resolve(image); };
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    if (!cached) image.src = src;
  });
}

function drawAsset(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  asset: LayerAsset,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const [sx, sy, sw, sh] = asset.crop;
  context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

async function composeBurger(canvas: HTMLCanvasElement, selection: Selection) {
  const assets = Object.fromEntries(
    await Promise.all(
      Object.entries(layerAssets).map(async ([key, asset]) => [key, await loadLayerImage(asset.src)]),
    ),
  ) as Record<string, HTMLImageElement>;

  const offscreen = document.createElement("canvas");
  offscreen.width = 1024;
  offscreen.height = 1500;
  const stack = offscreen.getContext("2d");
  if (!stack) return;

  drawAsset(stack, assets.bottomBun, layerAssets.bottomBun, 72, 1215, 880, 225);
  let cursor = 1250;
  const meat = selection.carne[0];
  const patties = meat === "triple" ? 3 : meat === "doble" ? 2 : 1;
  const withCheddar = selection.queso.includes("cheddar");

  for (let index = 0; index < patties; index += 1) {
    cursor -= 150;
    drawAsset(stack, assets.patty, layerAssets.patty, 65, cursor, 894, 190);
    if (withCheddar) {
      cursor -= 45;
      drawAsset(stack, assets.cheddar, layerAssets.cheddar, 72, cursor, 880, 155);
    }
  }

  if (selection.extras.includes("tomate")) {
    cursor -= 90;
    drawAsset(stack, assets.tomato, layerAssets.tomato, 90, cursor, 850, 145);
  }
  if (selection.extras.includes("cebolla")) {
    cursor -= 65;
    drawAsset(stack, assets.onion, layerAssets.onion, 75, cursor, 875, 105);
  }
  if (selection.extras.includes("bacon")) {
    cursor -= 75;
    drawAsset(stack, assets.bacon, layerAssets.bacon, 68, cursor, 890, 110);
  }
  if (selection.extras.includes("huevo")) {
    cursor -= 100;
    drawAsset(stack, assets.egg, layerAssets.egg, 88, cursor, 850, 155);
  }

  cursor -= 260;
  drawAsset(stack, assets.topBun, layerAssets.topBun, 62, cursor, 900, 325);

  canvas.width = 1024;
  canvas.height = 1024;
  const output = canvas.getContext("2d");
  if (!output) return;
  output.clearRect(0, 0, canvas.width, canvas.height);
  const sourceTop = Math.max(0, cursor - 30);
  const sourceBottom = 1470;
  output.drawImage(offscreen, 0, sourceTop, 1024, sourceBottom - sourceTop, 40, 40, 944, 944);
}

// El placeholder de marca va siempre detrás. Si la foto existe, la tapa; si
// falta, queda a la vista sin depender de que dispare ningún evento.
function MenuPhoto({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <div className="menu-photo-missing" aria-hidden="true">
        <img className="missing-mark" src="/brand/logo-mark.png" alt=""/>
        <span className="missing-name">{item.name}</span>
      </div>
      {!failed && (
        <img
          className="menu-photo"
          src={burgerPhoto(item.id)}
          alt={`${item.name}: ${item.ingredients}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

// Contrato con /api/direcciones.
type AddressSuggestion = { id: string; label: string; detail: string; lat: number; lon: number };

// Sólo se puede avanzar con una dirección elegida de la lista, no con texto
// libre: así la que llega al pedido es una dirección que existe.
function AddressField({
  chosen,
  onChoose,
}: {
  chosen: AddressSuggestion | null;
  onChoose: (value: AddressSuggestion | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  // Guardamos junto a la respuesta la consulta que la produjo, así lo que se
  // muestra se deriva del input actual en vez de limpiarse a mano.
  const [answer, setAnswer] = useState<{
    query: string;
    items: AddressSuggestion[];
    failed: boolean;
  } | null>(null);

  const text = query.trim();
  const searchable = !chosen && text.length >= 3;
  const fresh = answer && answer.query === text ? answer : null;
  const loading = searchable && !fresh;
  const results = fresh && !fresh.failed ? fresh.items : [];

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/direcciones?q=${encodeURIComponent(text)}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as { suggestions?: AddressSuggestion[] };
        setAnswer({ query: text, items: body.suggestions ?? [], failed: !response.ok });
        setHighlight(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAnswer({ query: text, items: [], failed: true });
        }
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [text, searchable]);

  if (chosen) {
    return (
      <div className="address-chosen">
        <span className="address-pin" aria-hidden="true">📍</span>
        <span className="address-text"><strong>{chosen.label}</strong><small>{chosen.detail}</small></span>
        <button type="button" onClick={() => { onChoose(null); setQuery(""); }}>Cambiar</button>
      </div>
    );
  }

  return (
    <div className="address-search">
      <label className="field">
        <span>Dirección de entrega</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej: Paraguay 2086"
          autoComplete="off"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="address-results"
          onKeyDown={(event) => {
            if (!results.length) return;
            if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((h) => (h + 1) % results.length); }
            if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((h) => (h - 1 + results.length) % results.length); }
            if (event.key === "Enter") { event.preventDefault(); onChoose(results[highlight]); }
          }}
        />
      </label>
      {loading && <p className="address-status">Buscando…</p>}
      {fresh && !fresh.failed && fresh.items.length === 0 && <p className="address-status">No encontramos esa dirección. Probá con calle y altura.</p>}
      {fresh?.failed && <p className="address-status address-error">No pudimos buscar direcciones ahora. Reintentá en un momento.</p>}
      {results.length > 0 && <ul className="address-results" id="address-results" role="listbox">
        {results.map((result, index) => <li key={result.id} role="option" aria-selected={index === highlight}>
          <button type="button" className={index === highlight ? "on" : ""} onMouseEnter={() => setHighlight(index)} onClick={() => onChoose(result)}>
            <strong>{result.label}</strong><small>{result.detail}</small>
          </button>
        </li>)}
      </ul>}
      <p className="address-hint">Elegí una opción de la lista para confirmar el punto exacto.</p>
    </div>
  );
}

function MenuCard({ item, index, onAdd }: { item: MenuItem; index: number; onAdd: (item: MenuItem) => void }) {
  return (
    <article className="menu-card">
      <div className="menu-media">
        <MenuPhoto item={item} />
        <span className="menu-index">{String(index + 1).padStart(2, "0")}</span>
        {item.badge && <span className="menu-tag">{item.badge}</span>}
      </div>
      <div className="menu-card-body">
        <div>
          <h3>{item.name}</h3>
          <p>{item.ingredients}</p>
        </div>
        <div className="menu-card-footer">
          <strong>{money(item.price)}</strong>
          <button type="button" onClick={() => onAdd(item)}>
            Sumar <span>+</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuRow({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  return (
    <article className="menu-row">
      <div className="menu-row-copy">
        <h3>
          {item.name}
          {item.badge && <em>{item.badge}</em>}
        </h3>
        {item.ingredients && <p>{item.ingredients}</p>}
      </div>
      <strong>{money(item.price)}</strong>
      <button type="button" onClick={() => onAdd(item)} aria-label={`Sumar ${item.name}`}>
        +
      </button>
    </article>
  );
}

export default function Home() {
  const [menuCategory, setMenuCategory] = useState<MenuCategoryId>("clasicas");
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [pendingExtras, setPendingExtras] = useState<string[]>([]);
  const [pendingDrink, setPendingDrink] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [order, setOrder] = useState<OrderForm>(emptyOrder);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("pan");
  const [selected, setSelected] = useState<Selection>(defaults);
  const [burgerName, setBurgerName] = useState("La Mía");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedIngredients = useMemo(
    () => ingredients.filter((item) => selected[item.category].includes(item.id)),
    [selected],
  );
  const total = useMemo(
    () => 900 + selectedIngredients.reduce((sum, item) => sum + item.price, 0),
    [selectedIngredients],
  );
  const activeOptions = ingredients.filter((item) => item.category === activeCategory);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPreviewReady(false);
    composeBurger(canvas, selected)
      .then(() => { if (active) setPreviewReady(true); })
      .catch(() => { if (active) setNotice("No pudimos cargar una de las capas."); });
    return () => { active = false; };
  }, [selected]);

  const toggleIngredient = (ingredient: Ingredient) => {
    const single = ["pan", "carne", "queso"].includes(ingredient.category);
    setSelected((current) => {
      const group = current[ingredient.category];
      if (single) return { ...current, [ingredient.category]: [ingredient.id] };
      if (group.includes(ingredient.id)) {
        return { ...current, [ingredient.category]: group.filter((id) => id !== ingredient.id) };
      }
      return { ...current, [ingredient.category]: [...group, ingredient.id] };
    });
  };

  const addItem = (item: CartItem) => {
    setCart((current) => [...current, item]);
    setNotice(`${item.name} ya está en tu pedido.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const finalizeBurger = async () => {
    const canvas = canvasRef.current;
    if (!canvas || finalizing) return;
    setFinalizing(true);
    try {
      await composeBurger(canvas, selected);
      const name = burgerName.trim() || "Mi Ruddy";
      const image = canvas.toDataURL("image/png");
      addItem({
        id: Date.now(),
        name,
        detail: selectedIngredients.map((item) => item.name).join(" · "),
        total,
        image,
        custom: true,
      });
      setCartOpen(true);
    } finally {
      setFinalizing(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const orderTotal = cartTotal + (order.delivery === "envio" ? DELIVERY_FEE : 0);
  const branchArea = locations.find((place) => place.address === order.branch)?.area ?? "";

  // Cada paso se habilita solo cuando el anterior está resuelto.
  const stepDone: Record<1 | 2 | 3, boolean> = {
    1: Boolean(order.branch),
    2: order.delivery === "retiro" || order.address !== null,
    3: order.name.trim().length > 1 && order.phone.trim().length > 5,
  };
  const canPlaceOrder = cart.length > 0 && stepDone[1] && stepDone[2] && stepDone[3];

  // Mensaje estándar que se le manda al chatbot. Va en texto plano con el
  // formato de negritas de WhatsApp.
  const buildMessage = (reference: string) => {
    const lines = [
      `*NUEVO PEDIDO ${reference}*`,
      "",
      `*Sucursal:* ${order.branch}${branchArea ? ` (${branchArea})` : ""}`,
      order.delivery === "retiro"
        ? "*Entrega:* Retiro en el local"
        : `*Entrega:* Envío a ${order.address?.label}, ${order.address?.detail}`,
      "",
      "*Pedido*",
    ];
    for (const item of cart) {
      lines.push(`• ${item.name} — ${money(item.total)}`);
      if (item.extras?.length) lines.push(`   Extras: ${item.extras.join(", ")}`);
      if (item.drink) lines.push(`   Bebida: ${item.drink}`);
      if (item.custom) lines.push(`   Armada a pedido: ${item.detail}`);
    }
    lines.push("");
    lines.push(`*Subtotal:* ${money(cartTotal)}`);
    if (order.delivery === "envio") lines.push(`*Envío:* ${money(DELIVERY_FEE)}`);
    lines.push(`*TOTAL:* ${money(orderTotal)}`);
    lines.push("");
    lines.push(`*Pago:* ${paymentMethods.find((m) => m.id === order.payment)?.label}`);
    if (order.payment === "tarjeta") lines.push("_Necesito el link de pago._");
    if (order.payment === "transferencia") lines.push("_Necesito CBU y alias._");
    lines.push("");
    lines.push(`*Nombre:* ${order.name.trim()}`);
    lines.push(`*Teléfono:* ${order.phone.trim()}`);
    if (order.notes.trim()) lines.push(`*Aclaraciones:* ${order.notes.trim()}`);
    return lines.join("\n");
  };

  const placeOrder = () => {
    if (!canPlaceOrder) return;
    const reference = makeReference();
    const message = buildMessage(reference);
    const link = WHATSAPP_ORDERS
      ? `https://wa.me/${WHATSAPP_ORDERS}?text=${encodeURIComponent(message)}`
      : "";
    setPlacedOrder({ reference, message, link });
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  const activeMenu = menuCategories.find((category) => category.id === menuCategory)!;
  const visibleItems = menuItems.filter((item) => item.category === menuCategory);

  // Las guarniciones se suman de una; las hamburguesas abren el paso de extras.
  const addMenuItem = (item: MenuItem) => {
    if (activeMenu.compact) {
      addItem({
        id: Date.now(),
        name: item.name,
        detail: item.ingredients,
        total: item.price,
      });
      return;
    }
    setPendingItem(item);
    setPendingExtras([]);
    setPendingDrink(null);
  };

  const chosenExtras = extras.filter((extra) => pendingExtras.includes(extra.id));
  const chosenDrink = drinks.find((drink) => drink.id === pendingDrink) ?? null;
  const pendingTotal =
    (pendingItem?.price ?? 0) +
    chosenExtras.reduce((sum, extra) => sum + extra.price, 0) +
    (chosenDrink?.price ?? 0);

  const closePending = () => {
    setPendingItem(null);
    setPendingExtras([]);
    setPendingDrink(null);
  };

  const confirmPending = () => {
    if (!pendingItem) return;
    addItem({
      id: Date.now(),
      name: pendingItem.name,
      detail: pendingItem.ingredients,
      total: pendingTotal,
      image: burgerPhoto(pendingItem.id),
      extras: chosenExtras.map((extra) => extra.name),
      drink: chosenDrink ? `${chosenDrink.name} · ${chosenDrink.detail}` : undefined,
    });
    closePending();
  };

  return <main>
    <header className="site-header">
      <a className="brand-lockup" href="#inicio" aria-label="Ruddy's, inicio"><img className="brand-mark" src="/brand/logo-mark.png" alt=""/><img className="brand-word" src="/brand/logo-word.png" alt="Ruddy&apos;s"/><span className="brand-subtitle">HAMBURGUESAS</span></a>
      <nav aria-label="Navegación principal"><a href="#menu">Menú</a><a href="#crear">Creá la tuya</a><a href="#local">El local</a></nav>
      <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir pedido, ${cart.length} productos`}>Mi pedido <span>{cart.length}</span></button>
    </header>

    <section className="hero" id="inicio">
      <div className="hero-copy">
        <p className="eyebrow">HAMBURGUESAS EN TUCUMÁN · DESDE 2020</p>
        <h1>Tu antojo.<br/><em>Tus reglas.</em></h1>
        <p className="hero-description">Pan tostado, carne con costra y todo lo que te haga feliz en el medio. Acá la burger se arma como vos querés.</p>
        <div className="hero-actions"><a className="button button-primary" href="#crear">Armá tu burger <span>↓</span></a><a className="text-link" href="#menu">Ver el menú <span>↗</span></a></div>
        <div className="hero-proof"><div className="proof-faces" aria-hidden="true"><img src="/brand/logo-mark.png" alt=""/><img src="/brand/logo-mark.png" alt=""/><img src="/brand/logo-mark.png" alt=""/></div><p><strong>4,9</strong> en reseñas locales<br/><span>Hechas al momento, siempre.</span></p></div>
      </div>
      <div className="hero-visual" aria-label="Hamburguesa Ruddy's con doble carne, cheddar y panceta">
        <video className="hero-video" autoPlay muted loop playsInline preload="metadata" poster="/brand/burger-hero.jpeg" aria-hidden="true" tabIndex={-1}>
          <source src="/videoportada.mp4" type="video/mp4"/>
        </video>
        <div className="hero-stamp"><span>100%</span><strong>CARNE</strong><small>HECHO AL MOMENTO</small></div><p className="hero-caption">DOBLE RUDDY · LA FAVORITA</p>
      </div>
    </section>

    <div className="ticker" aria-hidden="true"><div><span>CARNE REAL</span><b>✦</b><span>CHEDDAR FUNDIDO</span><b>✦</b><span>PAN BRIOCHE</span><b>✦</b><span>SIN VUELTAS</span><b>✦</b><span>CARNE REAL</span><b>✦</b><span>CHEDDAR FUNDIDO</span></div></div>

    <section className="menu-section" id="menu">
      <div className="section-heading"><div><p className="eyebrow">LOS INFALTABLES</p><h2>Si no querés pensar,<br/><em>elegí una leyenda.</em></h2></div><p>Probadas, aprobadas y peligrosamente repetibles. Todas las hamburguesas salen con papas.</p></div>

      <div className="menu-tabs" role="tablist" aria-label="Categorías del menú">{menuCategories.map((category) => <button key={category.id} type="button" role="tab" aria-selected={menuCategory === category.id} className={menuCategory === category.id ? "active" : ""} onClick={() => setMenuCategory(category.id)}><span>{category.eyebrow}</span>{category.label}</button>)}</div>

      <p className="menu-note">{activeMenu.note}</p>

      {activeMenu.compact
        ? <div className="menu-list">{visibleItems.map((item) => <MenuRow key={item.id} item={item} onAdd={addMenuItem}/>)}</div>
        : <div className="menu-grid">{visibleItems.map((item, index) => <MenuCard key={item.id} item={item} index={index} onAdd={addMenuItem}/>)}</div>}
    </section>

    <section className="builder-section" id="crear">
      <div className="builder-heading"><p className="eyebrow">AHORA MANDÁS VOS</p><h2>Construí tu <em>obra maestra.</em></h2><p>Cada ingrediente es una capa real. Al finalizar, guardamos tu burger como una imagen única.</p></div>
      <div className="builder-shell">
        <div className="builder-controls">
          <div className="builder-progress" role="tablist" aria-label="Categorías de ingredientes">{categories.map((category, index) => <button key={category.id} type="button" className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)} role="tab" aria-selected={activeCategory === category.id}><span>0{index + 1}</span>{category.label}</button>)}</div>
          <div className="option-heading"><div><span>{categories.find((item) => item.id === activeCategory)?.eyebrow}</span><h3>Elegí {activeCategory === "carne" ? "tu carne" : `tu ${categories.find((item) => item.id === activeCategory)?.label.toLowerCase()}`}</h3></div><small>{["pan", "carne", "queso"].includes(activeCategory) ? "Elegí 1" : "Combiná libre"}</small></div>
          <div className="ingredient-grid">{activeOptions.map((ingredient) => {
            const isSelected = selected[ingredient.category].includes(ingredient.id);
            return <button className={`ingredient-card ${isSelected ? "selected" : ""}`} key={ingredient.id} type="button" onClick={() => toggleIngredient(ingredient)} aria-pressed={isSelected}>
              {ingredient.image ? <img className="ingredient-thumb" src={ingredient.image} alt=""/> : <span className="ingredient-thumb ingredient-none" aria-hidden="true">—</span>}
              <span className="ingredient-copy"><strong>{ingredient.name}</strong><small>{ingredient.detail}</small><b>{ingredient.price ? `+ ${money(ingredient.price)}` : "Sin cargo"}</b></span><span className="ingredient-check">{isSelected ? "✓" : "+"}</span>
            </button>;
          })}</div>
          <div className="category-nav"><button type="button" disabled={activeCategory === "pan"} onClick={() => { const i = categories.findIndex((item) => item.id === activeCategory); setActiveCategory(categories[i - 1].id); }}>← Anterior</button><button type="button" disabled={activeCategory === "extras"} onClick={() => { const i = categories.findIndex((item) => item.id === activeCategory); setActiveCategory(categories[i + 1].id); }}>Siguiente →</button></div>
        </div>
        <aside className="burger-preview">
          <div className="preview-topline"><span>VISTA EN VIVO · PNG TRANSPARENTE</span><button type="button" onClick={() => setSelected(defaults)}>Reiniciar ↺</button></div>
          <div className={`photo-stack ${previewReady ? "ready" : "loading"}`} aria-label="Vista previa por capas de la hamburguesa">
            <canvas ref={canvasRef} className="burger-canvas" aria-label="Composición visual de los ingredientes seleccionados"/>
            {!previewReady && <span className="preview-loading">Montando capas…</span>}
          </div>
          <div className="preview-summary">
            <label htmlFor="burger-name">Bautizá tu creación</label><div className="name-field"><input id="burger-name" value={burgerName} maxLength={30} onChange={(event) => setBurgerName(event.target.value)} placeholder="Ej: La Explosiva"/><span>{burgerName.length}/30</span></div>
            <div className="selected-list">{selectedIngredients.map((item) => <span key={item.id}>{item.name}</span>)}</div>
            <div className="total-row"><div><small>TOTAL</small><strong>{money(total)}</strong></div><button type="button" disabled={!previewReady || finalizing} onClick={finalizeBurger}>{finalizing ? "Generando PNG…" : "Finalizar hamburguesa"} <span>→</span></button></div><p className="price-note">La imagen final conserva transparencia y queda asociada a este ítem del carrito.</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="local-section" id="local">
      <div className="local-photo"><img className="local-logo" src="/brand/logo-mark.png" alt=""/></div>
      <div className="local-copy">
        <p className="eyebrow">RUDDY&apos;S TUCUMÁN</p>
        <h2>Siempre hay Ruddy&apos;s<br/><em>cerca tuyo.</em></h2>
        <p>Buen producto, fuego fuerte y cero poses. Pasá a buscarla por cualquiera de nuestros locales o pedila desde donde estés.</p>
        <ul className="local-branches">{locations.map((place) => <li key={place.address}><strong>{place.address}</strong><span>{place.area}</span></li>)}</ul>
        <div className="local-info"><div><span>CUÁNDO</span><strong>Lun a dom · 19:30 a 00:30</strong></div><div><span>LOCALES</span><strong>{locations.length} en Tucumán y Yerba Buena</strong></div></div>
        <a className="button button-primary" href="https://wa.me/" target="_blank" rel="noreferrer">Hablar por WhatsApp <span>↗</span></a>
      </div>
    </section>
    <footer><img className="footer-logo" src="/brand/logo-word.png" alt="Ruddy&apos;s"/><p>HAMBURGUESAS · TUCUMÁN</p><div><a href="#menu">Menú</a><a href="#crear">Creá la tuya</a><a href="#inicio">Volver arriba ↑</a></div></footer>

    <div className={`cart-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)}/><aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
      <div className="cart-header"><div><span>TU PEDIDO</span><h2>Lo bueno<br/>está acá.</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar pedido">×</button></div>
      <div className="cart-items">{cart.length === 0 ? <div className="empty-cart"><img src="/brand/logo-mark.png" alt=""/><h3>Todavía no sumaste nada.</h3><p>Elegí una del menú o armá la tuya desde cero.</p><button type="button" onClick={() => setCartOpen(false)}>Seguir mirando</button></div> : cart.map((item) => <article key={item.id}>{item.image ? <img className={`cart-item-image ${item.custom ? "transparent" : ""}`} src={item.image} alt={`Vista de ${item.name}`}/> : <div className="cart-qty">1</div>}<div><h3>{item.name}</h3><p>{item.detail}</p>{item.custom && <span className="custom-badge">Creación personalizada · PNG guardado</span>}{item.extras && item.extras.length > 0 && <span className="cart-extras">+ {item.extras.join(" · ")}</span>}{item.drink && <span className="cart-extras cart-drink">🥤 {item.drink}</span>}<strong>{money(item.total)}</strong></div><button type="button" aria-label={`Quitar ${item.name}`} onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))}>×</button></article>)}</div>
      {cart.length > 0 && <div className="cart-checkout"><div><span>Total</span><strong>{money(cartTotal)}</strong></div><button type="button" onClick={() => { setCartOpen(false); setStep(1); setCheckoutOpen(true); }}>Finalizar pedido <span>→</span></button><small>Elegís entrega y forma de pago en el próximo paso</small></div>}
    </aside>
    {pendingItem && <div className="extras-backdrop" onClick={closePending}>
      <div className="extras-modal" role="dialog" aria-modal="true" aria-labelledby="extras-title" onClick={(event) => event.stopPropagation()}>
        <div className="extras-head">
          <div><span>Sumaste</span><h2 id="extras-title">{pendingItem.name}</h2><p>{pendingItem.ingredients}</p></div>
          <button type="button" onClick={closePending} aria-label="Cerrar">×</button>
        </div>
        <div className="extras-body">
          <div className="extras-legend"><strong>¿Le sumás algo?</strong><small>Opcional</small></div>
          <div className="extras-list">{extras.map((extra) => {
            const picked = pendingExtras.includes(extra.id);
            return <button key={extra.id} type="button" className={`extra-chip ${picked ? "picked" : ""}`} aria-pressed={picked} onClick={() => setPendingExtras((current) => picked ? current.filter((id) => id !== extra.id) : [...current, extra.id])}>
              <span className="extra-check">{picked ? "✓" : "+"}</span>
              <span className="extra-copy"><strong>{extra.name}</strong>{extra.ingredients && <small>{extra.ingredients}</small>}</span>
              <b>{money(extra.price)}</b>
            </button>;
          })}</div>

          <div className="extras-legend extras-legend-drinks"><strong>¿Con bebida?</strong><small>Elegí 1</small></div>
          <div className="extras-list">{drinks.map((drink) => {
            const picked = pendingDrink === drink.id;
            return <button key={drink.id} type="button" className={`extra-chip ${picked ? "picked" : ""}`} aria-pressed={picked} onClick={() => setPendingDrink(picked ? null : drink.id)}>
              <span className="extra-check">{picked ? "✓" : "+"}</span>
              <span className="extra-copy"><strong>{drink.name}</strong><small>{drink.detail}</small></span>
              <b>{money(drink.price)}</b>
            </button>;
          })}</div>
        </div>
        <div className="extras-foot">
          <div><small>TOTAL</small><strong>{money(pendingTotal)}</strong></div>
          <button type="button" onClick={confirmPending}>{(() => {
            const added = chosenExtras.length + (chosenDrink ? 1 : 0);
            return added ? `Agregar con ${added} sumado${added > 1 ? "s" : ""}` : "Agregar al pedido";
          })()} <span>→</span></button>
        </div>
      </div>
    </div>}

    {checkoutOpen && <div className="checkout-backdrop">
      <div className="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        {placedOrder ? <div className="checkout-done">
          <span className="done-mark">✓</span>
          <h2>Pedido enviado</h2>
          <p className="done-ref">Referencia <strong>{placedOrder.reference}</strong></p>
          {placedOrder.link
            ? <p className="done-note">Le pasamos el pedido al chatbot por WhatsApp. Ahí te confirma{order.payment === "tarjeta" ? " y te manda el link de pago" : order.payment === "transferencia" ? " y te pasa el CBU" : ""}. Si no se abrió la ventana, <a href={placedOrder.link} target="_blank" rel="noreferrer">abrila desde acá</a>.</p>
            : <><p className="done-note">Falta cargar el número de WhatsApp del chatbot en <code>WHATSAPP_ORDERS</code>. Copiá el mensaje y mandalo a mano:</p><pre className="done-message">{placedOrder.message}</pre></>}
          <button type="button" onClick={() => { setCart([]); setPlacedOrder(null); setCheckoutOpen(false); setOrder(emptyOrder); setStep(1); }}>Listo</button>
        </div> : <>
          <div className="checkout-head">
            <div><span>PASO {step} DE 3</span><h2 id="checkout-title">{step === 1 ? "Elegí la sucursal" : step === 2 ? "¿Dónde te lo llevamos?" : "Pago y datos"}</h2></div>
            <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Cerrar">×</button>
          </div>

          <ol className="checkout-steps" aria-label="Progreso del pedido">
            {["Sucursal", "Dirección", "Pago"].map((label, index) => {
              const number = (index + 1) as 1 | 2 | 3;
              const reachable = number === 1 || [1, 2].slice(0, number - 1).every((n) => stepDone[n as 1 | 2]);
              return <li key={label} className={`${step === number ? "on" : ""} ${step > number ? "past" : ""}`}>
                <button type="button" disabled={!reachable} onClick={() => setStep(number)}><span>{step > number ? "✓" : number}</span>{label}</button>
              </li>;
            })}
          </ol>

          <div className="checkout-body">
            {step === 1 && <section className="checkout-block">
              <p className="step-lead">Desde qué local sale tu pedido.</p>
              <div className="branch-list">{locations.map((place) => <button key={place.address} type="button" className={`branch-option ${order.branch === place.address ? "on" : ""}`} aria-pressed={order.branch === place.address} onClick={() => setOrder((o) => ({ ...o, branch: place.address }))}>
                <span className="pay-radio" aria-hidden="true"/>
                <span><strong>{place.address}</strong><small>{place.area}</small></span>
              </button>)}</div>
            </section>}

            {step === 2 && <section className="checkout-block">
              <div className="checkout-toggle">
                <button type="button" className={order.delivery === "envio" ? "on" : ""} onClick={() => setOrder((o) => ({ ...o, delivery: "envio" }))}>Envío a domicilio<small>+ {money(DELIVERY_FEE)}</small></button>
                <button type="button" className={order.delivery === "retiro" ? "on" : ""} onClick={() => setOrder((o) => ({ ...o, delivery: "retiro" }))}>Retiro en el local<small>Sin cargo</small></button>
              </div>
              {order.delivery === "envio"
                ? <AddressField chosen={order.address} onChoose={(value) => setOrder((o) => ({ ...o, address: value }))}/>
                : <p className="step-lead">Lo retirás en <strong>{order.branch}</strong>{branchArea ? ` — ${branchArea}` : ""}.</p>}
            </section>}

            {step === 3 && <>
              <section className="checkout-block">
                <h3>Forma de pago</h3>
                <div className="pay-list">{paymentMethods.map((method) => <button key={method.id} type="button" className={`pay-option ${order.payment === method.id ? "on" : ""}`} aria-pressed={order.payment === method.id} onClick={() => setOrder((o) => ({ ...o, payment: method.id }))}>
                  <span className="pay-radio" aria-hidden="true"/>
                  <span><strong>{method.label}</strong><small>{method.detail}</small></span>
                </button>)}</div>
              </section>
              <section className="checkout-block">
                <h3>Tus datos</h3>
                <div className="field-row">
                  <label className="field"><span>Nombre</span><input value={order.name} onChange={(event) => setOrder((o) => ({ ...o, name: event.target.value }))} placeholder="Cómo te llamamos"/></label>
                  <label className="field"><span>Teléfono</span><input value={order.phone} onChange={(event) => setOrder((o) => ({ ...o, phone: event.target.value }))} placeholder="381 ..." inputMode="tel"/></label>
                </div>
                <label className="field"><span>Aclaraciones <em>(opcional)</em></span><input value={order.notes} onChange={(event) => setOrder((o) => ({ ...o, notes: event.target.value }))} placeholder="Sin pepinillos, timbre roto, etc."/></label>
              </section>
              <section className="checkout-block">
                <h3>Tu pedido</h3>
                <ul className="checkout-lines">{cart.map((item) => <li key={item.id}>
                  <span>{item.name}{item.extras && item.extras.length > 0 && <small>+ {item.extras.join(" · ")}</small>}{item.drink && <small>{item.drink}</small>}</span>
                  <b>{money(item.total)}</b>
                </li>)}</ul>
              </section>
            </>}
          </div>

          <div className="checkout-foot">
            <div className="checkout-totals">
              <div><span>Subtotal</span><b>{money(cartTotal)}</b></div>
              {order.delivery === "envio" && <div><span>Envío</span><b>{money(DELIVERY_FEE)}</b></div>}
              <div className="grand"><span>Total</span><b>{money(orderTotal)}</b></div>
            </div>
            {step < 3
              ? <button type="button" disabled={!stepDone[step]} onClick={() => setStep((s) => (s === 1 ? 2 : 3))}>Continuar <span>→</span></button>
              : <button type="button" disabled={!canPlaceOrder} onClick={placeOrder}>Finalizar pedido <span>→</span></button>}
            {step === 2 && !stepDone[2] && <small className="checkout-hint">Elegí una dirección de la lista para continuar.</small>}
            {step === 3 && !stepDone[3] && <small className="checkout-hint">Completá nombre y teléfono para finalizar.</small>}
          </div>
        </>}
      </div>
    </div>}

    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
