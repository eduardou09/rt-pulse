import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Power, MessageSquare, X, Pencil, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PerguntaComCriterio = {
  pergunta: string;
  criterio: string;
};

type Vaga = {
  id: string;
  titulo: string;
  descricao: string | null;
  perguntas: PerguntaComCriterio[] | null;
  status: string;
  created_at: string;
};

export default function Vaga() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perguntas, setPerguntas] = useState<PerguntaComCriterio[]>([
    { pergunta: "", criterio: "" }
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingVaga, setDeletingVaga] = useState<Vaga | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    mutationFn: async (newVaga: { titulo: string; descricao: string; perguntas: PerguntaComCriterio[] | null; status: string }) => {
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
      resetForm();
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
        title: "Status atualizado",
        description: "O status da vaga foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const updateVagaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Vaga> }) => {
      const { error } = await supabase
        .from("vagas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      toast({
        title: "Vaga atualizada",
        description: "A vaga foi atualizada com sucesso.",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar vaga",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const deleteVagaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vagas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      toast({
        title: "Vaga excluída",
        description: "A vaga foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingVaga(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir vaga",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const activeVaga = vagas?.find((v) => v.status === "ativa");
  const inactiveVagas = vagas?.filter((v) => v.status === "inativa");

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPerguntas([{ pergunta: "", criterio: "" }]);
    setEditingVaga(null);
    setIsEditMode(false);
  };

  const normalizePerguntas = (perguntas: any): PerguntaComCriterio[] | null => {
    if (!perguntas || perguntas.length === 0) return null;
    
    // Se já é array de objetos com pergunta e criterio, retornar direto
    if (typeof perguntas[0] === 'object' && 'pergunta' in perguntas[0]) {
      return perguntas;
    }
    
    // Se é array de strings (formato antigo), converter
    return perguntas.map((p: string) => ({
      pergunta: p,
      criterio: "" // Critério vazio para vagas antigas
    }));
  };

  const handleCreateVaga = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtrar perguntas com pergunta E critério preenchidos
    const perguntasLimpas = perguntas.filter(
      p => p.pergunta.trim() !== "" && p.criterio.trim() !== ""
    );
    
    if (perguntasLimpas.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos uma pergunta com critério de aprovação.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && editingVaga) {
      updateVagaMutation.mutate({
        id: editingVaga.id,
        updates: {
          titulo,
          descricao,
          perguntas: perguntasLimpas.length > 0 ? perguntasLimpas : null,
        },
      });
    } else {
      createVagaMutation.mutate({ 
        titulo, 
        descricao, 
        perguntas: perguntasLimpas.length > 0 ? perguntasLimpas : null,
        status: "inativa" 
      });
    }
  };

  const handleEditVaga = (vaga: Vaga) => {
    setEditingVaga(vaga);
    setTitulo(vaga.titulo);
    setDescricao(vaga.descricao || "");
    const normalized = normalizePerguntas(vaga.perguntas);
    setPerguntas(normalized || [{ pergunta: "", criterio: "" }]);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const handleDeleteVaga = (vaga: Vaga) => {
    setDeletingVaga(vaga);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingVaga) {
      deleteVagaMutation.mutate(deletingVaga.id);
    }
  };

  const addPergunta = () => {
    setPerguntas([...perguntas, { pergunta: "", criterio: "" }]);
  };

  const removePergunta = (index: number) => {
    if (perguntas.length > 1) {
      setPerguntas(perguntas.filter((_, i) => i !== index));
    }
  };

  const updatePergunta = (
    index: number,
    field: 'pergunta' | 'criterio',
    value: string
  ) => {
    const updated = [...perguntas];
    updated[index][field] = value;
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
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}>
                <Plus className="w-5 h-5" />
                Nova Vaga
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Vaga" : "Criar Nova Vaga"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Modifique os dados da vaga." : "Preencha os dados da nova vaga. Ela será criada como inativa."}
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
                      Perguntas e Critérios
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {perguntas.filter(p => p.pergunta.trim() !== "" && p.criterio.trim() !== "").length} completa(s)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Os critérios serão usados para avaliar automaticamente os candidatos
                  </p>
                  
                  <div className="space-y-3">
                    {perguntas.map((item, index) => (
                      <Card key={index} className="p-4 space-y-3 border-2">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Pergunta {index + 1}
                          </span>
                          {perguntas.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePergunta(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Pergunta para o candidato</label>
                          <Textarea
                            placeholder="Ex: Quantos anos de experiência você tem com vendas?"
                            value={item.pergunta}
                            onChange={(e) => updatePergunta(index, 'pergunta', e.target.value)}
                            rows={2}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-orange-600">
                            Critério de Aprovação
                          </label>
                          <Input
                            placeholder="Ex: + 10 anos de experiência"
                            value={item.criterio}
                            onChange={(e) => updatePergunta(index, 'criterio', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Este critério será usado para qualificar o candidato automaticamente
                          </p>
                        </div>
                      </Card>
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={(createVagaMutation.isPending || updateVagaMutation.isPending) || !titulo.trim()}
                >
                  {(createVagaMutation.isPending || updateVagaMutation.isPending)
                    ? (isEditMode ? "Salvando..." : "Criando...")
                    : (isEditMode ? "Salvar Alterações" : "Criar Vaga")
                  }
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
                      <div className="p-4 bg-muted rounded-lg space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Perguntas e Critérios de Qualificação ({activeVaga.perguntas.length})
                        </h3>
                        
                        <div className="space-y-3">
                          {normalizePerguntas(activeVaga.perguntas)?.map((item, i) => (
                            <div key={i} className="p-3 bg-background rounded border space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-sm text-muted-foreground">
                                  {i + 1}.
                                </span>
                                <p className="font-medium flex-1">{item.pergunta}</p>
                              </div>
                              {item.criterio && (
                                <div className="flex items-start gap-2 ml-5">
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 shrink-0">
                                    Critério
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">{item.criterio}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEditVaga(activeVaga)}
                        className="flex-1 gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleToggleStatus(activeVaga)}
                        disabled={toggleStatusMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <Power className="w-4 h-4" />
                        Desativar
                      </Button>
                    </div>
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
                      <CardContent className="space-y-3">
                        {vaga.perguntas && vaga.perguntas.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>{vaga.perguntas.length} {vaga.perguntas.length === 1 ? 'pergunta configurada' : 'perguntas configuradas'}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEditVaga(vaga)}
                            className="flex-1 gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteVaga(vaga)}
                            className="flex-1 gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </Button>
                        </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a vaga "{deletingVaga?.titulo}". 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingVaga(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
