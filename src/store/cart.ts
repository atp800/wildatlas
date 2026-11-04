import { persistentMap } from '@nanostores/persistent';

// A map of Product ID to Quantity
export type CartItem = {
  id: string;
  name: string;
  priceId: string;
  price: number;
  image: string;
  quantity: number;
  physical: boolean;
};

// localStorage key prefix. Bump the version when Stripe price IDs change so
// returning visitors don't check out with stale (deleted) price IDs.
export const cart = persistentMap<Record<string, CartItem>>(
  'cart:v2:',
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const currentCart = cart.get();
  const existing = currentCart[item.id];
  
  cart.setKey(item.id, {
    ...item,
    quantity: existing ? existing.quantity + 1 : 1,
  });
}

export function removeFromCart(id: string) {
  const currentCart = cart.get();
  const newCart = { ...currentCart }; // Create a fresh copy
  delete newCart[id];                 // Remove the item
  cart.set(newCart);                  // Tell store to update UI
}

export function clearCart() {
  cart.set({});
}