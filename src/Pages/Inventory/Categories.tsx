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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Categories
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and organize your product categories and their attributes
          </p>
        </div>
        <Button
          variant="solid"
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
          onPress={() => {
            window.location.href = "/inventory/categories/add";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedCategories.map((category) => (
          <div
            key={category.category_id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category.category_name}
              </h2>
              <div className="space-y-3">
                {category.attributes.map((attribute) => (
                  <div
                    key={attribute.attribute_id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {attribute.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Type:{" "}
                        <span className="font-medium">{attribute.type}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Button
                variant="light"
                size="sm"
                className="w-full text-gray-700 hover:bg-gray-100"
                onPress={() => {
                  // Add edit functionality here
                  console.log(`Edit category ${category.category_id}`);
                }}
              >
                Edit Category
              </Button>
            </div>
          </div>
        ))}
      </div>

      {groupedCategories.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No categories
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new category.
          </p>
        </div>
      )}
    </div>
  );
}
