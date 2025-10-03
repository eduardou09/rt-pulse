import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, UserX } from "lucide-react";
import Layout from "@/components/Layout";
import { format } from "date-fns";

type Candidato = {
  id: string;
  nome: string;
  status: string;
  vaga_id: string | null;
  created_at: string;
};

export default function Candidatos() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const { data: candidatos, isLoading } = useQuery({
    queryKey: ["candidatos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Candidato[];
    },
  });

  const filteredCandidatos = candidatos?.filter((c) => {
    if (statusFilter === "todos") return true;
    return c.status === statusFilter;
  });

  const qualificados = candidatos?.filter((c) => c.status === "qualificado").length || 0;
  const naoQualificados = candidatos?.filter((c) => c.status === "não qualificado").length || 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Candidatos</h1>
          <p className="text-muted-foreground">
            Visualize candidatos recebidos via automação
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{candidatos?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <UserCheck className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{qualificados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Não Qualificados</CardTitle>
              <UserX className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{naoQualificados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="qualificado">Qualificados</SelectItem>
              <SelectItem value="não qualificado">Não Qualificados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Candidatos List */}
        {isLoading ? (
          <div className="text-center py-12">Carregando candidatos...</div>
        ) : filteredCandidatos && filteredCandidatos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCandidatos.map((candidato) => (
              <Card key={candidato.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{candidato.nome}</CardTitle>
                    <Badge
                      className={
                        candidato.status === "qualificado"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {candidato.status === "qualificado" ? "Qualificado" : "Não Qualificado"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Recebido em {format(new Date(candidato.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Nenhum candidato encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {statusFilter !== "todos"
                  ? "Tente alterar o filtro"
                  : "Candidatos aparecerão aqui quando chegarem via automação"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
