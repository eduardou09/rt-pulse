import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/vaga" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl hidden sm:inline">RT Intelligence</span>
              </Link>
              
              <div className="flex gap-1">
                <Link to="/vaga">
                  <Button
                    variant={isActive("/vaga") ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Vagas</span>
                  </Button>
                </Link>
                <Link to="/candidatos">
                  <Button
                    variant={isActive("/candidatos") ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Candidatos</span>
                  </Button>
                </Link>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
