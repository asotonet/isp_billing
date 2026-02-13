import { useState, useEffect, useRef } from "react";
import { Building2, Image as ImageIcon, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";

export default function PersonalizacionPage() {
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const updateMutation = useUpdateSettings();

  const [companyName, setCompanyName] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cedulaJuridica, setCedulaJuridica] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name);
      setRazonSocial(settings.razon_social || "");
      setCedulaJuridica(settings.cedula_juridica || "");
      setTelefono(settings.telefono || "");
      setEmail(settings.email || "");
      setDireccion(settings.direccion || "");
      setLogoPreview(settings.company_logo);
    }
  }, [settings]);

  if (isLoadingSettings) return <LoadingSpinner />;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("El archivo debe ser una imagen");
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const settingsData = {
      company_name: companyName,
      company_logo: logoPreview,
      razon_social: razonSocial || null,
      cedula_juridica: cedulaJuridica || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
    };

    updateMutation.mutate(settingsData, {
      onSuccess: () => {
        toast.success("Configuración guardada exitosamente");
        // Disparar evento para actualizar el Sidebar
        window.dispatchEvent(new Event("settingsUpdated"));
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || "Error al guardar configuración");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Name Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Nombre de la Empresa
            </CardTitle>
            <CardDescription>
              Este nombre aparecerá en el sistema y en los documentos generados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Mi ISP S.A."
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Nombre actual: <span className="font-medium">{companyName}</span>
            </div>
          </CardContent>
        </Card>

        {/* Logo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo de la Empresa
            </CardTitle>
            <CardDescription>
              Logo que aparecerá en el sistema (máx. 2MB, formato PNG/JPG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subir Logo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Imagen
              </Button>
              {logo && (
                <p className="text-xs text-muted-foreground">
                  Archivo seleccionado: {logo.name}
                </p>
              )}
            </div>
            {logoPreview && (
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/30">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 object-contain"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>
            Datos que aparecerán en facturas y documentos oficiales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="razon-social">Razón Social</Label>
            <Input
              id="razon-social"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Razón Social de la Empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cedula-juridica">Cédula Jurídica</Label>
            <Input
              id="cedula-juridica"
              value={cedulaJuridica}
              onChange={(e) => setCedulaJuridica(e.target.value)}
              placeholder="3-101-XXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="2XXX-XXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email de Contacto</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección completa de la empresa"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
