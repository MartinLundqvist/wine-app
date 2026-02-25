import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, adminApi } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../contexts/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Button } from "../../components/ui/Button";
import { Wine, Plus, Pencil, Trash2 } from "lucide-react";

export function WineStylesListPage() {
  useDocumentTitle("Admin – Wine Styles");
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const accessToken = state.accessToken ?? "";

  const { data: styles, isLoading } = useQuery({
    queryKey: queryKeys.wineStyles,
    queryFn: () => api.getWineStyles(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteWineStyle(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wineStyles });
    },
  });

  const handleDelete = async (id: string, displayName: string) => {
    if (!window.confirm(`Delete "${displayName}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate("/admin/wine-styles");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isLoading || !styles) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl text-foreground flex items-center gap-2">
          <Wine className="w-6 h-6 text-primary" />
          Wine Styles (Admin)
        </h1>
        <Link to="/admin/wine-styles/new">
          <Button variant="hero" size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New style
          </Button>
        </Link>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-foreground">ID</th>
              <th className="px-4 py-3 text-sm font-medium text-foreground">Display name</th>
              <th className="px-4 py-3 text-sm font-medium text-foreground">Color</th>
              <th className="px-4 py-3 text-sm font-medium text-foreground">Type</th>
              <th className="px-4 py-3 w-28 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {styles.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{s.id}</td>
                <td className="px-4 py-3 text-sm text-foreground">{s.displayName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{s.producedColor}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{s.styleType}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/wine-styles/${encodeURIComponent(s.id)}/edit`}>
                    <Button variant="ghost" size="sm" className="mr-1">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(s.id, s.displayName)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
