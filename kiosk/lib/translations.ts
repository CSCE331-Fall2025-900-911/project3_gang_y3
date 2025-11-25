export const translations: Record<string, string> = {
  "Kiosk — Place an order": "Kiosk — Realizar un pedido",
  "Kiosk": "Kiosco",
  "Menu": "Menú",
  "DATABASE_URL is not set. Add a `DATABASE_URL` variable to `kiosk/.env.local` (eg. postgres://user:pass@host:port/db)": 
    "DATABASE_URL no está configurado. Agregue una variable `DATABASE_URL` a `kiosk/.env.local` (ej. postgres://user:pass@host:port/db)",
  "Error querying database:": "Error al consultar la base de datos:",
  
  "Manager View": "Vista de Gerente",
  "Back to Kiosk": "Volver al Kiosco",
  
  "Cashier View": "Vista de Cajero",
  
  "Manager": "Gerente",
  "Cashier": "Cajero",
  "Add": "Agregar",
  "Add to cart": "Agregar al carrito",
  "Cancel": "Cancelar",
  "Clear": "Limpiar",
  "Cart": "Carrito",
  "Total": "Total",
  "Place order": "Realizar pedido",
  "Placing order...": "Realizando pedido...",
  
  "Cart is empty": "El carrito está vacío",
  "Order": "Pedido",
  "placed successfully!": "realizado con éxito!",
  "Failed to place order": "No se pudo realizar el pedido",
  "Failed to connect to server": "No se pudo conectar al servidor",
  
  "Recommendation": "Recomendación",
  "Loading weather...": "Cargando clima...",
  "Weather unavailable": "Clima no disponible",
  
  "Customize:": "Personalizar:",
  "Ice": "Hielo",
  "Sugar": "Azúcar",
  "low": "bajo",
  "medium": "medio",
  "high": "alto",
  
  "Tea": "Té",
  "Milk Tea": "Té con Leche",
  "Fruit Tea": "Té de Frutas",
  "Coffee": "Café",
  "Smoothie": "Batido",
  "Juice": "Jugo",
  "Water": "Agua",
  "Soda": "Refresco",
  
  "Mango": "Mango",
  "Strawberry": "Fresa",
  "Peach": "Durazno",
  "Lychee": "Lychee",
  "Passion Fruit": "Maracuyá",
  "Taro": "Taro",
  "Matcha": "Matcha",
  "Chocolate": "Chocolate",
  "Vanilla": "Vainilla",
  "Classic": "Clásico",
  "Original": "Original",
  "Brown Sugar": "Azúcar Morena",
  "Honey": "Miel",
  "Thai": "Tailandés",
  "Jasmine": "Jazmín",
  "Green Tea": "Té Verde",
  "Black Tea": "Té Negro",
  "Oolong": "Oolong",
  
  "Specialty Drinks": "Bebidas Especiales",
  "Specialty": "Especial",
  "Snacks": "Bocadillos",
  "Desserts": "Postres",
  "Appetizers": "Aperitivos",
};

export function translate(text: string, targetLang: 'en' | 'es'): string {
  if (targetLang === 'en') {
    return text;
  }
  
  return translations[text] || text;
}

export function translateMenuItem(name: string, targetLang: 'en' | 'es'): string {
  if (targetLang === 'en') {
    return name;
  }
  
  if (translations[name]) {
    return translations[name];
  }
  
  const words = name.split(' ');
  const translatedWords = words.map(word => {
    if (translations[word]) {
      return translations[word];
    }
    const lowerWord = word.toLowerCase();
    if (translations[lowerWord]) {
      return translations[lowerWord].charAt(0).toUpperCase() + translations[lowerWord].slice(1);
    }
    return word;
  });
  
  return translatedWords.join(' ');
}
