import { User } from "@/app/type";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface allStates {
  userData: User | null;
  updateUserData: (item: User | null) => void;

}

export const UseStore = create<allStates>()(
  persist(
    (set, get) => ({
      userData: {
        branchCode: 0,
        personelCode: 0,
        roles: [''],
        userId: "",
      },
      updateUserData: (item: User | null) =>
        set({
          userData: item ? { ...item } : null,
        }),
    }),
    {
      name: "zustand-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
