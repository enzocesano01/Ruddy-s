"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  burgerPhoto,
  locations,
  menuCategories,
  menuItems,
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
};
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
  { id: "simple", name: "Simple", detail: "1 medallón smash", price: 2800, category: "carne", image: "/ingredients/medallon.png" },
  { id: "doble", name: "Doble", detail: "2 medallones smash", price: 5000, category: "carne", image: "/ingredients/medallon.png" },
  { id: "triple", name: "Triple", detail: "3 medallones smash", price: 7000, category: "carne", image: "/ingredients/medallon.png" },
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
        <span className="missing-mark">R</span>
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

  const activeMenu = menuCategories.find((category) => category.id === menuCategory)!;
  const visibleItems = menuItems.filter((item) => item.category === menuCategory);

  const addMenuItem = (item: MenuItem) =>
    addItem({
      id: Date.now(),
      name: item.name,
      detail: item.ingredients,
      total: item.price,
      image: activeMenu.compact ? undefined : burgerPhoto(item.id),
    });

  return <main>
    <header className="site-header">
      <a className="brand-lockup" href="#inicio" aria-label="Ruddy's, inicio"><span className="brand-script">Ruddy&apos;s</span><span className="brand-subtitle">SMASH BURGERS</span></a>
      <nav aria-label="Navegación principal"><a href="#menu">Menú</a><a href="#crear">Creá la tuya</a><a href="#local">El local</a></nav>
      <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir pedido, ${cart.length} productos`}>Mi pedido <span>{cart.length}</span></button>
    </header>

    <section className="hero" id="inicio">
      <div className="hero-copy">
        <p className="eyebrow">SMASHED EN TUCUMÁN · DESDE 2020</p>
        <h1>Tu antojo.<br/><em>Tus reglas.</em></h1>
        <p className="hero-description">Pan tostado, carne con costra y todo lo que te haga feliz en el medio. Acá la burger se arma como vos querés.</p>
        <div className="hero-actions"><a className="button button-primary" href="#crear">Armá tu burger <span>↓</span></a><a className="text-link" href="#menu">Ver el menú <span>↗</span></a></div>
        <div className="hero-proof"><div className="proof-faces" aria-hidden="true"><span>R</span><span>R</span><span>R</span></div><p><strong>4,9</strong> en reseñas locales<br/><span>Hechas al momento, siempre.</span></p></div>
      </div>
      <div className="hero-visual" aria-label="Hamburguesa Ruddy's con doble carne, cheddar y panceta">
        <div className="hero-image"/><div className="hero-stamp"><span>100%</span><strong>SMASH</strong><small>HECHO AL MOMENTO</small></div><p className="hero-caption">DOBLE RUDDY · LA FAVORITA</p>
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
      <div className="local-photo"><div className="local-logo">R</div></div>
      <div className="local-copy">
        <p className="eyebrow">RUDDY&apos;S TUCUMÁN</p>
        <h2>Siempre hay Ruddy&apos;s<br/><em>cerca tuyo.</em></h2>
        <p>Buen producto, fuego fuerte y cero poses. Pasá a buscarla por cualquiera de nuestros locales o pedila desde donde estés.</p>
        <ul className="local-branches">{locations.map((place) => <li key={place.address}><strong>{place.address}</strong><span>{place.area}</span></li>)}</ul>
        <div className="local-info"><div><span>CUÁNDO</span><strong>Lun a dom · 19:30 a 00:30</strong></div><div><span>LOCALES</span><strong>{locations.length} en Tucumán y Yerba Buena</strong></div></div>
        <a className="button button-primary" href="https://wa.me/" target="_blank" rel="noreferrer">Hablar por WhatsApp <span>↗</span></a>
      </div>
    </section>
    <footer><div className="footer-brand">Ruddy&apos;s</div><p>SMASH BURGERS · TUCUMÁN</p><div><a href="#menu">Menú</a><a href="#crear">Creá la tuya</a><a href="#inicio">Volver arriba ↑</a></div></footer>

    <div className={`cart-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)}/><aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
      <div className="cart-header"><div><span>TU PEDIDO</span><h2>Lo bueno<br/>está acá.</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar pedido">×</button></div>
      <div className="cart-items">{cart.length === 0 ? <div className="empty-cart"><span>R</span><h3>Todavía no sumaste nada.</h3><p>Elegí una del menú o armá la tuya desde cero.</p><button type="button" onClick={() => setCartOpen(false)}>Seguir mirando</button></div> : cart.map((item) => <article key={item.id}>{item.image ? <img className={`cart-item-image ${item.custom ? "transparent" : ""}`} src={item.image} alt={`Vista de ${item.name}`}/> : <div className="cart-qty">1</div>}<div><h3>{item.name}</h3><p>{item.detail}</p>{item.custom && <span className="custom-badge">Creación personalizada · PNG guardado</span>}<strong>{money(item.total)}</strong></div><button type="button" aria-label={`Quitar ${item.name}`} onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))}>×</button></article>)}</div>
      {cart.length > 0 && <div className="cart-checkout"><div><span>Total</span><strong>{money(cartTotal)}</strong></div><button type="button">Continuar pedido <span>→</span></button><small>Finalizás y coordinás por WhatsApp</small></div>}
    </aside>
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
