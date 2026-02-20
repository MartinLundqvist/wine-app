import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Panel } from "../../components/ui/Panel";
import { AromaFlowTree } from "../../components/aroma/AromaFlowTree";

export function ExploreAromasPage() {
  const { data: aromaTerms, isLoading } = useQuery({
    queryKey: ["aroma-terms"],
    queryFn: () => api.getAromaTerms(),
  });

  if (isLoading) return <p className="text-cork-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-linen-100">Aroma Explorer</h1>
        <p className="text-cork-400 mt-1">
          WSET-aligned aroma taxonomy: trace from source (primary, secondary, tertiary) to clusters and descriptors.
        </p>
      </div>
      <Panel variant="oak" className="overflow-visible">
        {aromaTerms && aromaTerms.length > 0 ? (
          <AromaFlowTree terms={aromaTerms} />
        ) : (
          <p className="text-cork-400 font-ui">No aroma terms loaded.</p>
        )}
      </Panel>
    </div>
  );
}
