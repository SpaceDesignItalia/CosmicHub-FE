import { Button } from "@heroui/react";
import axios from "axios";
import { useEffect, useState } from "react";

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

export default function Categories() {
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>(
    []
  );

  useEffect(() => {
    axios.get("/Product/GET/GetAllCategories").then((res) => {
      const rawData: CategoryAttribute[] = res.data;

      // Group attributes by category
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
    });
  }, []);

  console.log(groupedCategories);

  return (
    <div className="space-y-4">
      {groupedCategories.map((category) => (
        <div key={category.category_id} className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">{category.category_name}</h2>
          <div className="space-y-2">
            {category.attributes.map((attribute) => (
              <div key={attribute.attribute_id} className="pl-4">
                <p>
                  <span className="font-medium">{attribute.name}</span> -{" "}
                  {attribute.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        variant="solid"
        size="lg"
        className="w-full"
        onPress={() => {
          window.location.href = "/inventory/categories/add";
        }}
      >
        Add Category
      </Button>
    </div>
  );
}
