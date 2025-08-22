import { create } from "zustand";

type RestaurantState = {
  name: string;
  setName: (n: string) => void;
};

export const useRestaurant = create<RestaurantState>((set) => ({
  name: "",
  setName: (name) => set({ name }),
}));
