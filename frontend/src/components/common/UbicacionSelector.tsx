import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ubicaciones } from "@/data/ubicaciones";

interface UbicacionSelectorProps {
  provincia: string;
  canton: string;
  distrito: string;
  onProvinciaChange: (value: string) => void;
  onCantonChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
}

export default function UbicacionSelector({
  provincia,
  canton,
  distrito,
  onProvinciaChange,
  onCantonChange,
  onDistritoChange,
}: UbicacionSelectorProps) {
  const cantones = useMemo(() => {
    const prov = ubicaciones.find((u) => u.provincia === provincia);
    return prov?.cantones || [];
  }, [provincia]);

  const distritos = useMemo(() => {
    const cant = cantones.find((c) => c.nombre === canton);
    return cant?.distritos || [];
  }, [cantones, canton]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label>Provincia</Label>
        <Select
          value={provincia}
          onValueChange={(val) => {
            onProvinciaChange(val);
            onCantonChange("");
            onDistritoChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {ubicaciones.map((u) => (
              <SelectItem key={u.provincia} value={u.provincia}>
                {u.provincia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cantón</Label>
        <Select
          value={canton}
          onValueChange={(val) => {
            onCantonChange(val);
            onDistritoChange("");
          }}
          disabled={!provincia}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {cantones.map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Distrito</Label>
        <Select value={distrito} onValueChange={onDistritoChange} disabled={!canton}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {distritos.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
