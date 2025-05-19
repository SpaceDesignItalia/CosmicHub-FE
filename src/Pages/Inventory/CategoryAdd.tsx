import { useState } from "react";
import {
  Button,
  TextField,
  IconButton,
  MenuItem,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

interface Attribute {
  id: string;
  name: string;
  type: string;
}

export default function CategoryAdd() {
  const [categoryName, setCategoryName] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  const attributeTypes = ["text", "number", "date", "boolean"];

  const addAttribute = () => {
    const newAttribute: Attribute = {
      id: Date.now().toString(),
      name: "",
      type: "text",
    };
    setAttributes([...attributes, newAttribute]);
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const updateAttribute = (
    id: string,
    field: "name" | "type",
    value: string
  ) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    );
  };

  const handleSave = async () => {
    // Placeholder for axios call
    const categoryData = {
      name: categoryName,
      attributes: attributes.map(({ name, type }) => ({ name, type })),
    };
    await axios
      .post("/Product/POST/CreateNewCategory", categoryData)
      .then((res) => {
        if (res.status === 200) {
          window.location.href = "/inventory/categories";
        }
      });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Aggiungi Categoria
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Nome Categoria"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          margin="normal"
        />

        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Attributi
          </Typography>
          <Button variant="contained" onClick={addAttribute} sx={{ mb: 2 }}>
            Aggiungi Attributo
          </Button>
        </Box>

        {attributes.map((attr) => (
          <Box
            key={attr.id}
            sx={{
              display: "flex",
              gap: 2,
              mb: 2,
              alignItems: "center",
            }}
          >
            <TextField
              label="Nome Attributo"
              value={attr.name}
              onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
              sx={{ flex: 2 }}
            />
            <TextField
              select
              label="Tipo"
              value={attr.type}
              onChange={(e) => updateAttribute(attr.id, "type", e.target.value)}
              sx={{ flex: 1 }}
            >
              {attributeTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <IconButton onClick={() => removeAttribute(attr.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            size="large"
          >
            Salva Categoria
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
