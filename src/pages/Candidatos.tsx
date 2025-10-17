import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, UserCheck, UserX } from "lucide-react";
import Layout from "@/components/Layout";
import { format } from "date-fns";

type Candidato = {
  id: string;
  created_at: string;
  vaga_id: string | null;
  vaga_titulo: string;
  nome: string;
  resumo_experiencia: string | null;
  interesse_remoto: string | null;
  feedback_final: string | null;
  fit_cultural: {
    adaptabilidade?: string;
    trabalho_em_equipe?: string;
    mudanca_rotina?: string;
    etica?: string;
    valores_pessoais?: string;
  } | null;
  respostas_personalizadas: Record<string, string> | null;
  dados_completos: any | null;
  status: string;
};

export default function Candidatos() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [vagaFilter, setVagaFilter] = useState<string>("todas");

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

  const { data: vagas } = useQuery({
    queryKey: ["vagas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vagas")
        .select("id, titulo, status")
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredCandidatos = candidatos?.filter((c) => {
    const passaStatus = statusFilter === "todos" || c.status === statusFilter;
    const passaVaga = vagaFilter === "todas" || c.vaga_id === vagaFilter;
    return passaStatus && passaVaga;
  });

  const qualificados = filteredCandidatos?.filter((c) => c.status === "qualificado").length || 0;
  const naoQualificados = filteredCandidatos?.filter((c) => c.status === "não qualificado").length || 0;

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

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="qualificado">Qualificados</SelectItem>
              <SelectItem value="não qualificado">Não Qualificados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vagaFilter} onValueChange={setVagaFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por vaga" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="todas">Todas as Vagas</SelectItem>
              {vagas?.map((vaga) => (
                <SelectItem key={vaga.id} value={vaga.id}>
                  {vaga.titulo}
                  {vaga.status === 'inativa' && ' (inativa)'}
                </SelectItem>
              ))}
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
                    <div className="flex flex-col gap-2 items-end">
                      {candidato.interesse_remoto && (
                        <Badge variant="outline" className="whitespace-nowrap">
                          {candidato.interesse_remoto === "sim" ? "🌍 Remoto" : "📍 Presencial"}
                        </Badge>
                      )}
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
                  </div>
                  <CardDescription>
                    {candidato.vaga_titulo && `Vaga: ${candidato.vaga_titulo} • `}
                    Recebido em {format(new Date(candidato.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </CardDescription>
                </CardHeader>
                
                {(candidato.resumo_experiencia || candidato.fit_cultural || candidato.respostas_personalizadas) && (
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {candidato.resumo_experiencia && (
                        <AccordionItem value="resumo">
                          <AccordionTrigger>📝 Resumo de Experiência</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {candidato.resumo_experiencia}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {candidato.fit_cultural && Object.keys(candidato.fit_cultural).length > 0 && (
                        <AccordionItem value="fit">
                          <AccordionTrigger>🎯 Fit Cultural</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {Object.entries(candidato.fit_cultural).map(([key, value]) => (
                                <div key={key} className="border-l-2 border-primary/20 pl-3">
                                  <p className="text-sm font-medium capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {candidato.respostas_personalizadas && Object.keys(candidato.respostas_personalizadas).length > 0 && (
                        <AccordionItem value="respostas">
                          <AccordionTrigger>💬 Respostas Personalizadas</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {Object.entries(candidato.respostas_personalizadas).map(([pergunta, resposta]) => (
                                <div key={pergunta} className="border-l-2 border-secondary/20 pl-3">
                                  <p className="text-sm font-medium">
                                    {pergunta}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {resposta}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Nenhum candidato encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {statusFilter !== "todos" || vagaFilter !== "todas"
                  ? "Tente alterar os filtros para ver mais candidatos"
                  : "Candidatos aparecerão aqui quando chegarem via automação"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
