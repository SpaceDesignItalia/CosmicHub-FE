import { Icon } from "@iconify/react";
import AddProduct from "../../Components/Inventory/Product/AddProduct";

export default function ProductAdd() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:add-square-bold-duotone"
              className="text-primary text-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold">Aggiungi Prodotto</h1>
        </div>
      </div>

      <AddProduct />
    </div>
  );
}
