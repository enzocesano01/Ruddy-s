// Catálogo del menú de Ruddy's.
//
// PRECIOS: PROVISORIOS. Las hamburguesas están escalonadas entre $13.500 y
// $14.500 según cuánto llevan encima. Las triples quedaron arriba de ese rango
// ($16.900 / $17.500) porque son tres medallones. Guarniciones y extras se
// escalaron aparte. Reemplazá cada `price` por el valor real cuando lo tengas.
//
// FOTOS: cada ítem espera su imagen en `public/burgers/<id>.jpg`.
// Si el archivo no existe, la card muestra un placeholder de marca en vez de romperse.

export type MenuCategoryId =
  | "clasicas"
  | "smash"
  | "triples"
  | "veggie"
  | "compartir"
  | "extras";

export type MenuItem = {
  id: string;
  name: string;
  ingredients: string;
  price: number;
  category: MenuCategoryId;
  badge?: string;
};

export const menuCategories: {
  id: MenuCategoryId;
  label: string;
  eyebrow: string;
  note: string;
  compact?: boolean;
}[] = [
  {
    id: "clasicas",
    label: "Hamburguesas",
    eyebrow: "Las de siempre",
    note: "Todas incluyen papas.",
  },
  {
    id: "smash",
    label: "Smash",
    eyebrow: "Nuevo",
    note: "Doble medallón de 90 g aplastado sobre la plancha.",
  },
  {
    id: "triples",
    label: "Triples",
    eyebrow: "Para valientes",
    note: "Tres medallones de 110 g. Sin anestesia.",
  },
  {
    id: "veggie",
    label: "Veggie",
    eyebrow: "Sin carne",
    note: "Medallones de quinoa o lenteja, hechos en casa.",
  },
  {
    id: "compartir",
    label: "Como pa' variar",
    eyebrow: "Para la mesa",
    note: "Lo que pedís cuando una burger no alcanza.",
    compact: true,
  },
  {
    id: "extras",
    label: "Extras",
    eyebrow: "+ placer",
    note: "Sumale lo que quieras a cualquier pedido.",
    compact: true,
  },
];

export const menuItems: MenuItem[] = [
  // ── Hamburguesas clásicas (110 g) ────────────────────────────────────────
  {
    id: "ruddys",
    name: "Ruddy's",
    ingredients: "Hamburguesa de 110 g, cheddar, panceta, cebolla cocida y salsa Ruddy's.",
    price: 14100,
    category: "clasicas",
    badge: "La más pedida",
  },
  {
    id: "crispy-ruddys",
    name: "Crispy Ruddy's",
    ingredients: "Hamburguesa de 110 g, cheddar, panceta, cebolla crispy y salsa Ruddy's.",
    price: 14300,
    category: "clasicas",
  },
  {
    id: "cuarto-de-ruddy",
    name: "Cuarto de Ruddy",
    ingredients: "Hamburguesa de 110 g, kétchup, mostaza, cebolla, cheddar y base con cheddar.",
    price: 13700,
    category: "clasicas",
  },
  {
    id: "california",
    name: "California",
    ingredients: "Hamburguesa de 110 g, cheddar, lechuga, tomate, cebolla morada, panceta y salsa Ruddy's.",
    price: 14300,
    category: "clasicas",
  },
  {
    id: "la-ruddyneta",
    name: "La Ruddyneta",
    ingredients: "Hamburguesa de 110 g, cheddar, kétchup, pepinillos, cebolla morada, panceta y mayonesa.",
    price: 14300,
    category: "clasicas",
  },
  {
    id: "macddys",
    name: "Macddy's",
    ingredients: "Hamburguesa de 110 g, cheddar, lechuga, cebolla, pepinillos y salsa Ruddy's.",
    price: 13900,
    category: "clasicas",
    badge: "Nueva",
  },
  {
    id: "cheeseburger",
    name: "Cheeseburger",
    ingredients: "Hamburguesa de 110 g y cheddar x2.",
    price: 13500,
    category: "clasicas",
  },
  {
    id: "bacon-cheeseburger",
    name: "Bacon Cheeseburger",
    ingredients: "Hamburguesa de 110 g, cheddar y panceta.",
    price: 13700,
    category: "clasicas",
  },
  {
    id: "atlanta",
    name: "Atlanta",
    ingredients: "Hamburguesa de 110 g, cheddar, panceta, aros de cebolla y salsa barbacoa.",
    price: 14300,
    category: "clasicas",
  },
  {
    id: "tulsa",
    name: "Tulsa",
    ingredients: "Hamburguesa de 90 g, smasheada con cebolla, cheddar y salsa Ruddy's.",
    price: 13600,
    category: "clasicas",
  },
  {
    id: "san-diego",
    name: "San Diego",
    ingredients: "Hamburguesa de 110 g, queso tybo, lechuga, tomate, cebolla morada y mayonesa especial.",
    price: 13900,
    category: "clasicas",
  },
  {
    id: "vermont",
    name: "Vermont",
    ingredients: "Hamburguesa de 110 g, queso tybo, pimientos asados, cebolla crispy y mayonesa especial.",
    price: 14100,
    category: "clasicas",
  },
  {
    id: "blueddys",
    name: "Blueddy's",
    ingredients: "Hamburguesa de 110 g, queso tybo, queso azul, champiñones asados, cebolla cocida y mayonesa.",
    price: 14500,
    category: "clasicas",
  },

  // ── Smash (doble de 90 g) ────────────────────────────────────────────────
  {
    id: "tulsa-smash",
    name: "Tulsa Smash",
    ingredients: "Hamburguesa smash doble de 90 g, cheddar, cebolla grillada y salsa Ruddy's.",
    price: 14100,
    category: "smash",
    badge: "Nueva",
  },
  {
    id: "red-smash",
    name: "Red Smash",
    ingredients: "Hamburguesa smash doble de 90 g, queso tybo, panceta y cebolla encurtida.",
    price: 14300,
    category: "smash",
    badge: "Nueva",
  },
  {
    id: "golden-smash",
    name: "Golden Smash",
    ingredients: "Hamburguesa smash doble de 90 g, cheddar, cebolla a la manteca, pepinillos, cebolla crispy y salsa Ruddy's.",
    price: 14500,
    category: "smash",
    badge: "Nueva",
  },

  // ── Triples (110 g) ──────────────────────────────────────────────────────
  {
    id: "big-rudd",
    name: "Big Rudd",
    ingredients: "Hamburguesa triple de 110 g, cheddar, panceta y kétchup.",
    price: 16900,
    category: "triples",
  },
  {
    id: "big-crispy",
    name: "Big Crispy",
    ingredients: "Hamburguesa triple de 110 g, cheddar, panceta, cebolla crispy y salsa Ruddy's.",
    price: 17500,
    category: "triples",
  },

  // ── Veggie ───────────────────────────────────────────────────────────────
  {
    id: "veggie",
    name: "Veggie",
    ingredients: "Medallón de quinoa con puerro, queso tybo, champiñones asados, tomate, lechuga y mayonesa especial.",
    price: 13500,
    category: "veggie",
  },
  {
    id: "veggie-power",
    name: "Veggie Power",
    ingredients: "Medallón de lenteja con zanahorias, queso cheddar, cebolla crispy, cebolla cocida y salsa Ruddy's.",
    price: 13700,
    category: "veggie",
  },

  // ── Como pa' variar ──────────────────────────────────────────────────────
  {
    id: "papas-clasicas",
    name: "Papas fritas clásicas",
    ingredients: "",
    price: 5200,
    category: "compartir",
  },
  {
    id: "papas-ruddys",
    name: "Papas fritas Ruddy's",
    ingredients: "Con cheddar, panceta y verdeo.",
    price: 7900,
    category: "compartir",
  },
  {
    id: "papas-cerveceras",
    name: "Papas fritas cerveceras",
    ingredients: "Con salsa 3 quesos, panceta y verdeo.",
    price: 8400,
    category: "compartir",
  },
  {
    id: "aros-de-cebolla",
    name: "Aros de cebolla",
    ingredients: "",
    price: 6200,
    category: "compartir",
  },
  {
    id: "bastones-mozzarella",
    name: "Bastones de mozzarella",
    ingredients: "",
    price: 6900,
    category: "compartir",
  },
  {
    id: "chicken-fingers",
    name: "Chicken fingers",
    ingredients: "Pollo a la plancha o pollo crispy.",
    price: 8400,
    category: "compartir",
  },
  {
    id: "ensalada-cesar",
    name: "Ensalada César",
    ingredients: "",
    price: 8900,
    category: "compartir",
  },
  {
    id: "nuggets",
    name: "Nuggets x8",
    ingredients: "",
    price: 7400,
    category: "compartir",
  },
  {
    id: "combo-nuggets",
    name: "Combo Nuggets x8 con papas",
    ingredients: "",
    price: 10900,
    category: "compartir",
    badge: "Nuevo",
  },

  // ── Extras ───────────────────────────────────────────────────────────────
  {
    id: "extra-cheddar-panceta",
    name: "Cheddar y panceta",
    ingredients: "Para papas.",
    price: 3200,
    category: "extras",
  },
  {
    id: "extra-carne-queso",
    name: "Carne con queso",
    ingredients: "",
    price: 4200,
    category: "extras",
  },
  {
    id: "extra-panceta",
    name: "Panceta",
    ingredients: "",
    price: 2200,
    category: "extras",
  },
  {
    id: "extra-papas-chicas",
    name: "Papas fritas chicas",
    ingredients: "",
    price: 3400,
    category: "extras",
  },
  {
    id: "extra-verdura",
    name: "Verdura",
    ingredients: "",
    price: 1200,
    category: "extras",
  },
  {
    id: "extra-cheeseburger",
    name: "Cheeseburger",
    ingredients: "Hamburguesa con cheddar.",
    price: 5200,
    category: "extras",
    badge: "Nuevo",
  },
  {
    id: "extra-salsa",
    name: "Salsa",
    ingredients: "",
    price: 900,
    category: "extras",
  },
];

export const burgerPhoto = (id: string) => `/burgers/${id}.jpg`;

// Locales de Ruddy's.
export const locations: { address: string; area: string }[] = [
  { address: "Santa Fe 277", area: "Barrio Norte" },
  { address: "25 de Mayo 515", area: "Centro" },
  { address: "Gral. Paz 554", area: "Barrio Sur" },
  { address: "Av. Aconquija 365", area: "Flip · Yerba Buena" },
  { address: "Av. Perón 1850", area: "Yerba Buena" },
];
