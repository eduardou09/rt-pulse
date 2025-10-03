import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Power, MessageSquare, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Vaga = {
  id: string;
  titulo: string;
  descricao: string | null;
  perguntas: string[] | null;
  status: string;
  created_at: string;
};

export default function Vaga() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perguntas, setPerguntas] = useState<string[]>([""]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vagas, isLoading } = useQuery({
    queryKey: ["vagas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vagas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Vaga[];
    },
  });

  const createVagaMutation = useMutation({
    mutationFn: async (newVaga: { titulo: string; descricao: string; perguntas: string[] | null; status: string }) => {
      const { data, error } = await supabase
        .from("vagas")
        .insert([newVaga])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      setTitulo("");
      setDescricao("");
      setPerguntas([""]);
      setDialogOpen(false);
      toast({
        title: "Vaga criada!",
        description: "A vaga foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("vagas")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      toast({
        title: "Status atualizado!",
        description: "O status da vaga foi alterado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeVaga = vagas?.find((v) => v.status === "ativa");
  const inactiveVagas = vagas?.filter((v) => v.status === "inativa");

  const handleCreateVaga = (e: React.FormEvent) => {
    e.preventDefault();
    const perguntasLimpas = perguntas.filter(p => p.trim() !== "");
    createVagaMutation.mutate({ 
      titulo, 
      descricao, 
      perguntas: perguntasLimpas.length > 0 ? perguntasLimpas : null,
      status: "inativa" 
    });
  };

  const addPergunta = () => {
    setPerguntas([...perguntas, ""]);
  };

  const removePergunta = (index: number) => {
    if (perguntas.length > 1) {
      setPerguntas(perguntas.filter((_, i) => i !== index));
    }
  };

  const updatePergunta = (index: number, value: string) => {
    const updated = [...perguntas];
    updated[index] = value;
    setPerguntas(updated);
  };

  const handleToggleStatus = (vaga: Vaga) => {
    const newStatus = vaga.status === "ativa" ? "inativa" : "ativa";
    toggleStatusMutation.mutate({ id: vaga.id, newStatus });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gerenciar Vagas</h1>
            <p className="text-muted-foreground">Controle de vagas ativas e inativas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Nova Vaga
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Vaga</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova vaga. Ela será criada como inativa.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVaga} className="space-y-4 mt-4">
                <Input
                  placeholder="Título da vaga"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Descrição da vaga"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Perguntas para o candidato
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {perguntas.filter(p => p.trim() !== "").length} pergunta(s)
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {perguntas.map((pergunta, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Pergunta ${index + 1} (ex: Você tem experiência com vendas?)`}
                          value={pergunta}
                          onChange={(e) => updatePergunta(index, e.target.value)}
                          className="flex-1"
                        />
                        {perguntas.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removePergunta(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPergunta}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Pergunta
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={createVagaMutation.isPending}>
                  {createVagaMutation.isPending ? "Criando..." : "Criar Vaga"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando vagas...</div>
        ) : (
          <div className="space-y-8">
            {/* Active Vaga */}
            {activeVaga && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-secondary" />
                  Vaga Ativa
                </h2>
                <Card className="border-2 border-secondary shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{activeVaga.titulo}</CardTitle>
                        <CardDescription className="text-base">
                          {activeVaga.descricao || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <Badge className="bg-secondary text-secondary-foreground">Ativa</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeVaga.perguntas && activeVaga.perguntas.length > 0 && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Perguntas do Processo ({activeVaga.perguntas.length})
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {activeVaga.perguntas.map((p, i) => (
                            <li key={i} className="text-muted-foreground">{p}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStatus(activeVaga)}
                      disabled={toggleStatusMutation.isPending}
                      className="gap-2"
                    >
                      <Power className="w-4 h-4" />
                      Desativar Vaga
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Inactive Vagas */}
            {inactiveVagas && inactiveVagas.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Vagas Inativas</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {inactiveVagas.map((vaga) => (
                    <Card key={vaga.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{vaga.titulo}</CardTitle>
                            <CardDescription>
                              {vaga.descricao || "Sem descrição"}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">Inativa</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleToggleStatus(vaga)}
                          disabled={toggleStatusMutation.isPending || !!activeVaga}
                          className="w-full gap-2"
                        >
                          <Power className="w-4 h-4" />
                          {activeVaga ? "Desative a vaga ativa primeiro" : "Ativar Vaga"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!activeVaga && (!inactiveVagas || inactiveVagas.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">Nenhuma vaga cadastrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em "Nova Vaga" para começar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
