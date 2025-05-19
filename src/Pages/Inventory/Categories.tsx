import { Button, Card, Spinner, Input } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";
import { useEffect, useState } from "react";
import CategoryTable from "../../Components/Inventory/Category/CategoryTable";

interface Attribute {
  attribute_id: number;
  name: string;
  type: string;
}

interface CategoryAttribute {
  category_id: number;
  attribute_id: number;
  category_name: string;
  name: string;
  type: string;
}

interface GroupedCategory {
  category_id: number;
  category_name: string;
  attributes: Attribute[];
}

const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case "text":
      return "solar:document-text-bold-duotone";
    case "number":
      return "solar:calculator-bold-duotone";
    case "boolean":
      return "solar:check-square-bold-duotone";
    case "date":
      return "solar:calendar-bold-duotone";
    default:
      return "solar:document-bold-duotone";
  }
};

export default function Categories() {
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get("/Product/GET/GetAllCategories");
      const rawData: CategoryAttribute[] = res.data;

      console.log("Raw data from API:", rawData);

      const grouped = rawData.reduce((acc: GroupedCategory[], curr) => {
        const existingCategory = acc.find(
          (cat) => cat.category_id === curr.category_id
        );

        if (existingCategory) {
          existingCategory.attributes.push({
            attribute_id: curr.attribute_id,
            name: curr.name,
            type: curr.type,
          });
        } else {
          acc.push({
            category_id: curr.category_id,
            category_name: curr.category_name,
            attributes: [
              {
                attribute_id: curr.attribute_id,
                name: curr.name,
                type: curr.type,
              },
            ],
          });
        }

        return acc;
      }, []);

      setGroupedCategories(grouped);
      console.log("Grouped categories:", grouped);
    } catch (err) {
      setError("Failed to load categories. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await axios.delete(`/Product/DELETE/DeleteCategory/${categoryId}`);

      fetchCategories();
    } catch (err) {}
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = groupedCategories.filter((category) =>
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Icon
            icon="solar:folder-with-files-bold-duotone"
            className="text-xl text-primary"
          />
          <h1 className="text-2xl font-medium text-gray-900">Categorie</h1>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Cerca categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
            startContent={
              <Icon
                icon="solar:magnifer-bold-duotone"
                className="text-gray-400"
              />
            }
          />
          <Button
            color="primary"
            onPress={() => {
              window.location.href = "/inventory/categories/add";
            }}
          >
            <Icon icon="solar:add-circle-bold-duotone" className="text-lg" />
            Nuova Categoria
          </Button>
        </div>
      </div>

      <CategoryTable
        categories={filteredCategories}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}
