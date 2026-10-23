import { cartStore } from "./cart-store.ts";
import { useState, useEffect } from "react";

export interface CartProductInput {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  category?: string;
}

export interface CartConflict {
  currentStoreId: string;
  currentStoreName: string;
  newStoreId: string;
  newStoreName: string;
  newProduct: CartProductInput;
}

let pendingConflict: CartConflict | null = null;
const conflictListeners = new Set<() => void>();

export const cartConflictManager = {
  getPendingConflict(): CartConflict | null {
    return pendingConflict;
  },
  cancelReplace() {
    pendingConflict = null;
    conflictListeners.forEach((l) => l());
  },
  confirmReplace(): boolean {
    if (!pendingConflict) return false;
    const { newStoreId, newStoreName, newProduct } = pendingConflict;
    pendingConflict = null;
    conflictListeners.forEach((l) => l());
    cartStore.clear();
    cartStore.add(newStoreId, newStoreName, newProduct);
    return true;
  },
  addWithConflictCheck(
    storeId: string,
    storeName: string,
    product: CartProductInput,
  ): boolean {
    const snapshot = cartStore.getSnapshot();
    const hasExistingItems = snapshot.lines.length > 0;
    const isDifferentStore = snapshot.storeId && snapshot.storeId !== storeId;

    if (hasExistingItems && isDifferentStore) {
      pendingConflict = {
        currentStoreId: snapshot.storeId as string,
        currentStoreName: snapshot.storeName || "current shop",
        newStoreId: storeId,
        newStoreName: storeName || "new shop",
        newProduct: product,
      };
      conflictListeners.forEach((l) => l());
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("localshore_cart_conflict", { detail: pendingConflict })
        );
      }
      return false;
    }

    pendingConflict = null;
    conflictListeners.forEach((l) => l());
    cartStore.add(storeId, storeName, product);
    return true;
  },
  subscribe(listener: () => void) {
    conflictListeners.add(listener);
    return () => conflictListeners.delete(listener);
  },
};

export function useCartConflict(): CartConflict | null {
  const [conflict, setConflict] = useState<CartConflict | null>(() =>
    cartConflictManager.getPendingConflict(),
  );

  useEffect(() => {
    const handleUpdate = () => setConflict(cartConflictManager.getPendingConflict());
    const handleEvent = (e: Event) => {
      setConflict(
        (e as CustomEvent<CartConflict>).detail ?? cartConflictManager.getPendingConflict(),
      );
    };
    window.addEventListener("localshore_cart_conflict", handleEvent);
    const unsubscribe = cartConflictManager.subscribe(handleUpdate);
    return () => {
      window.removeEventListener("localshore_cart_conflict", handleEvent);
      unsubscribe();
    };
  }, []);

  return conflict;
}
