"use client";

import { useMemo, useState } from "react";

type CategoryId = "pan" | "carne" | "queso" | "extras" | "salsas";
type Ingredient = { id: string; name: string; detail: string; price: number; category: CategoryId; visual: string };
type CartItem = { id: number; name: string; detail: string; total: number };

const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const categories: { id: CategoryId; label: string; eyebrow: string }[] = [
  { id: "pan", label: "Pan", eyebrow: "La base" },
  { id: "carne", label: "Carne", eyebrow: "El corazón" },
  { id: "queso", label: "Quesos", eyebrow: "El abrazo" },
  { id: "extras", label: "Extras", eyebrow: "El crunch" },
  { id: "salsas", label: "Salsas", eyebrow: "El final" },
];
const ingredients: Ingredient[] = [
  { id: "brioche", name: "Brioche", detail: "Mantecoso y tostado", price: 1100, category: "pan", visual: "bun" },
  { id: "papa", name: "Pan de papa", detail: "Suave y dorado", price: 1300, category: "pan", visual: "potato" },
  { id: "simple", name: "Simple", detail: "Smash 120 g", price: 2800, category: "carne", visual: "patty" },
  { id: "doble", name: "Doble", detail: "2 smash · 240 g", price: 5000, category: "carne", visual: "double" },
  { id: "triple", name: "Triple", detail: "3 smash · 360 g", price: 7000, category: "carne", visual: "triple" },
  { id: "cheddar", name: "Cheddar", detail: "Doble feta", price: 1100, category: "queso", visual: "cheddar" },
  { id: "provoleta", name: "Provoleta", detail: "Dorada a la plancha", price: 1600, category: "queso", visual: "provoleta" },
  { id: "sin-queso", name: "Sin queso", detail: "Sólo carne", price: 0, category: "queso", visual: "none" },
  { id: "bacon", name: "Panceta", detail: "Crocante y ahumada", price: 1500, category: "extras", visual: "bacon" },
  { id: "onion", name: "Aros de cebolla", detail: "Rebozado extra crisp", price: 1200, category: "extras", visual: "onion" },
  { id: "cebolla", name: "Cebolla caramelizada", detail: "Lenta y dulce", price: 800, category: "extras", visual: "caramel" },
  { id: "tomate", name: "Tomate", detail: "Fresco, corte grueso", price: 500, category: "extras", visual: "tomato" },
  { id: "especial", name: "Ruddy's", detail: "Nuestra salsa secreta", price: 600, category: "salsas", visual: "sauce" },
  { id: "barbacoa", name: "Barbacoa", detail: "Dulce y ahumada", price: 600, category: "salsas", visual: "bbq" },
  { id: "spicy", name: "Spicy mayo", detail: "Picor amable", price: 700, category: "salsas", visual: "spicy" },
];
const menu = [
  { name: "La Ruddy", tag: "La más pedida", description: "Doble smash, cheddar, panceta, aros de cebolla y salsa Ruddy's.", price: 11900, image: "/brand/burger-hero.jpeg", position: "50% 64%" },
  { name: "Bacon Melt", tag: "Bien cargada", description: "Doble smash, cheddar fundido, panceta glaseada y barbacoa.", price: 10900, image: "/brand/burger-close.jpeg", position: "50% 60%" },
  { name: "Crispy Simple", tag: "Un clásico", description: "Smash, cheddar, crispy onion y nuestra salsa especial.", price: 8700, image: "/brand/promo.jpeg", position: "66% 57%" },
];
const defaults: Record<CategoryId, string[]> = { pan: ["brioche"], carne: ["doble"], queso: ["cheddar"], extras: ["bacon", "onion"], salsas: ["especial"] };

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("pan");
  const [selected, setSelected] = useState<Record<CategoryId, string[]>>(defaults);
  const [burgerName, setBurgerName] = useState("La Mía");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const selectedIngredients = useMemo(() => ingredients.filter((item) => selected[item.category].includes(item.id)), [selected]);
  const total = useMemo(() => 900 + selectedIngredients.reduce((sum, item) => sum + item.price, 0), [selectedIngredients]);
  const activeOptions = ingredients.filter((item) => item.category === activeCategory);
  const has = (id: string) => Object.values(selected).some((group) => group.includes(id));

  const toggleIngredient = (ingredient: Ingredient) => {
    const single = ["pan", "carne", "queso"].includes(ingredient.category);
    setSelected((current) => {
      const group = current[ingredient.category];
      if (single) return { ...current, [ingredient.category]: [ingredient.id] };
      if (group.includes(ingredient.id)) return { ...current, [ingredient.category]: group.filter((id) => id !== ingredient.id) };
      if (ingredient.category === "salsas" && group.length >= 2) {
        setNotice("Podés elegir hasta 2 salsas.");
        window.setTimeout(() => setNotice(""), 2200);
        return current;
      }
      return { ...current, [ingredient.category]: [...group, ingredient.id] };
    });
  };
  const addItem = (item: CartItem) => {
    setCart((current) => [...current, item]);
    setNotice(`${item.name} ya está en tu pedido.`);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const addCustom = () => {
    const name = burgerName.trim() || "Mi Ruddy";
    addItem({ id: Date.now(), name, detail: selectedIngredients.map((item) => item.name).join(" · "), total });
    setCartOpen(true);
  };
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

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
      <div className="section-heading"><div><p className="eyebrow">LOS INFALTABLES</p><h2>Si no querés pensar,<br/><em>elegí una leyenda.</em></h2></div><p>Probadas, aprobadas y peligrosamente repetibles. Todas salen con papas.</p></div>
      <div className="menu-grid">{menu.map((item, index) => <article className="menu-card" key={item.name}>
        <div className="menu-image" style={{ backgroundImage: `url("${item.image}")`, backgroundPosition: item.position }}><span className="menu-index">0{index + 1}</span><span className="menu-tag">{item.tag}</span></div>
        <div className="menu-card-body"><div><h3>{item.name}</h3><p>{item.description}</p></div><div className="menu-card-footer"><strong>{money(item.price)}</strong><button type="button" onClick={() => addItem({ id: Date.now(), name: item.name, detail: item.description, total: item.price })}>Sumar <span>+</span></button></div></div>
      </article>)}</div>
    </section>

    <section className="builder-section" id="crear">
      <div className="builder-heading"><p className="eyebrow">AHORA MANDÁS VOS</p><h2>Construí tu <em>obra maestra.</em></h2><p>Elegí cada capa. Nosotros la hacemos real.</p></div>
      <div className="builder-shell">
        <div className="builder-controls">
          <div className="builder-progress" role="tablist" aria-label="Categorías de ingredientes">{categories.map((category, index) => <button key={category.id} type="button" className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)} role="tab" aria-selected={activeCategory === category.id}><span>0{index + 1}</span>{category.label}</button>)}</div>
          <div className="option-heading"><div><span>{categories.find((item) => item.id === activeCategory)?.eyebrow}</span><h3>Elegí {activeCategory === "carne" ? "tu carne" : `tu ${categories.find((item) => item.id === activeCategory)?.label.toLowerCase()}`}</h3></div><small>{["pan", "carne", "queso"].includes(activeCategory) ? "Elegí 1" : activeCategory === "salsas" ? "Hasta 2" : "Combiná libre"}</small></div>
          <div className="ingredient-grid">{activeOptions.map((ingredient) => {
            const isSelected = selected[ingredient.category].includes(ingredient.id);
            return <button className={`ingredient-card ${isSelected ? "selected" : ""}`} key={ingredient.id} type="button" onClick={() => toggleIngredient(ingredient)} aria-pressed={isSelected}>
              <span className={`ingredient-thumb visual-${ingredient.visual}`} aria-hidden="true"/><span className="ingredient-copy"><strong>{ingredient.name}</strong><small>{ingredient.detail}</small><b>{ingredient.price ? `+ ${money(ingredient.price)}` : "Sin cargo"}</b></span><span className="ingredient-check">{isSelected ? "✓" : "+"}</span>
            </button>;
          })}</div>
          <div className="category-nav"><button type="button" disabled={activeCategory === "pan"} onClick={() => { const i = categories.findIndex((item) => item.id === activeCategory); setActiveCategory(categories[i - 1].id); }}>← Anterior</button><button type="button" disabled={activeCategory === "salsas"} onClick={() => { const i = categories.findIndex((item) => item.id === activeCategory); setActiveCategory(categories[i + 1].id); }}>Siguiente →</button></div>
        </div>
        <aside className="burger-preview">
          <div className="preview-topline"><span>VISTA EN VIVO</span><button type="button" onClick={() => setSelected(defaults)}>Reiniciar ↺</button></div>
          <div className="photo-stack" aria-label="Vista previa fotográfica de la hamburguesa">
            <div className="burger-piece piece-bottom-bun"/>
            {(has("simple") || has("doble") || has("triple")) && <div className="burger-piece piece-lower-patty"/>}
            {(has("doble") || has("triple")) && <div className="burger-piece piece-upper-patty"/>}
            {has("triple") && <div className="burger-piece piece-upper-patty piece-third-patty"/>}
            {has("cheddar") && <div className="burger-piece piece-cheese"/>}{has("provoleta") && <div className="synthetic-layer layer-provoleta"/>}{has("tomate") && <div className="synthetic-layer layer-tomato"/>}{has("cebolla") && <div className="synthetic-layer layer-caramel"/>}{has("bacon") && <div className="burger-piece piece-bacon"/>}{has("onion") && <div className="burger-piece piece-onions"/>}{(has("especial") || has("barbacoa") || has("spicy")) && <div className={`sauce-gloss ${has("spicy") ? "spicy" : ""}`}/>}<div className="burger-piece piece-top-bun"/>
          </div>
          <div className="preview-summary">
            <label htmlFor="burger-name">Bautizá tu creación</label><div className="name-field"><input id="burger-name" value={burgerName} maxLength={30} onChange={(event) => setBurgerName(event.target.value)} placeholder="Ej: La Explosiva"/><span>{burgerName.length}/30</span></div>
            <div className="selected-list">{selectedIngredients.map((item) => <span key={item.id}>{item.name}</span>)}</div>
            <div className="total-row"><div><small>TOTAL</small><strong>{money(total)}</strong></div><button type="button" onClick={addCustom}>Sumar al pedido <span>+</span></button></div><p className="price-note">Precio estimado. Confirmamos disponibilidad antes de preparar.</p>
          </div>
        </aside>
      </div>
    </section>

    <section className="local-section" id="local"><div className="local-photo"><div className="local-logo">R</div></div><div className="local-copy"><p className="eyebrow">RUDDY&apos;S BARRIO NORTE</p><h2>Una burger sin<br/><em>hacerse la difícil.</em></h2><p>Buen producto, fuego fuerte y cero poses. Pasá a buscarla o pedila desde donde estés.</p><div className="local-info"><div><span>DÓNDE</span><strong>Tucumán · Barrio Norte</strong></div><div><span>CUÁNDO</span><strong>Lun a dom · 19:30 a 00:30</strong></div></div><a className="button button-primary" href="https://wa.me/" target="_blank" rel="noreferrer">Hablar por WhatsApp <span>↗</span></a></div></section>
    <footer><div className="footer-brand">Ruddy&apos;s</div><p>SMASH BURGERS · TUCUMÁN</p><div><a href="#menu">Menú</a><a href="#crear">Creá la tuya</a><a href="#inicio">Volver arriba ↑</a></div></footer>

    <div className={`cart-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)}/><aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
      <div className="cart-header"><div><span>TU PEDIDO</span><h2>Lo bueno<br/>está acá.</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar pedido">×</button></div>
      <div className="cart-items">{cart.length === 0 ? <div className="empty-cart"><span>R</span><h3>Todavía no sumaste nada.</h3><p>Elegí una del menú o armá la tuya desde cero.</p><button type="button" onClick={() => setCartOpen(false)}>Seguir mirando</button></div> : cart.map((item) => <article key={item.id}><div className="cart-qty">1</div><div><h3>{item.name}</h3><p>{item.detail}</p><strong>{money(item.total)}</strong></div><button type="button" aria-label={`Quitar ${item.name}`} onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))}>×</button></article>)}</div>
      {cart.length > 0 && <div className="cart-checkout"><div><span>Total</span><strong>{money(cartTotal)}</strong></div><button type="button">Continuar pedido <span>→</span></button><small>Finalizás y coordinás por WhatsApp</small></div>}
    </aside>
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
