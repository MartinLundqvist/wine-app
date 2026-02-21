import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Panel } from "../../components/ui/Panel";
import { Chip } from "../../components/ui/Chip";
import { Button } from "../../components/ui/Button";

export function GrapeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: grapes } = useQuery({
    queryKey: ["grapes"],
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });

  const grape = grapes?.find((g) => g.id === id);
  const linkedStyles = styleTargets?.filter((st) =>
    st.grapes?.some((g) => g.grape.id === id)
  ) ?? [];

  if (!id) return <p className="text-muted-foreground">Loading...</p>;
  if (!grape) return <p className="text-muted-foreground">Grape not found.</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/explore/grapes" className="text-sm text-muted-foreground hover:text-foreground no-underline">
            ← Grapes
          </Link>
          <h1 className="font-serif text-3xl text-foreground mt-2">{grape.displayName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Chip variant={grape.color === "red" ? "selected" : "base"}>
              {grape.color}
            </Chip>
          </div>
          {grape.notes && (
            <p className="text-base text-muted-foreground mt-2">{grape.notes}</p>
          )}
        </div>
        <Link to="/explore/grapes">
          <Button variant="tertiary">Back to list</Button>
        </Link>
      </div>

      <Panel variant="oak">
        <h2 className="font-serif text-2xl text-foreground mb-4">
          Associated styles ({linkedStyles.length})
        </h2>
        {linkedStyles.length === 0 ? (
          <p className="text-muted-foreground">No styles linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {linkedStyles.map((st) => (
              <li key={st.id}>
                <Link
                  to={`/explore/styles/${st.id}`}
                  className="text-foreground hover:text-oak-light no-underline"
                >
                  {st.displayName}
                  {st.region && (
                    <span className="text-muted-foreground text-sm ml-2">
                      — {st.region.displayName}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
