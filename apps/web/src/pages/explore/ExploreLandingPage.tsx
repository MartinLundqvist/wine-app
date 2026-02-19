import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Panel } from "../../components/ui/Panel";

export function ExploreLandingPage() {
  const { data: grapes } = useQuery({
    queryKey: ["grapes"],
    queryFn: () => api.getGrapes(),
  });
  const { data: styleTargets } = useQuery({
    queryKey: ["style-targets"],
    queryFn: () => api.getStyleTargets(),
  });
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
  });
  const { data: aromaTerms } = useQuery({
    queryKey: ["aroma-terms"],
    queryFn: () => api.getAromaTerms(),
  });

  const counts = {
    styles: styleTargets?.length ?? 0,
    grapes: grapes?.length ?? 0,
    regions: regions?.length ?? 0,
    aromas: aromaTerms?.length ?? 0,
  };

  const cards = [
    {
      to: "/explore/styles",
      title: "Wine Styles",
      description: "Browse benchmark wine styles with structure and aroma profiles.",
      count: counts.styles,
    },
    {
      to: "/explore/grapes",
      title: "Grapes",
      description: "Explore grape varieties and their associated styles.",
      count: counts.grapes,
    },
    {
      to: "/explore/regions",
      title: "Regions",
      description: "Hierarchical view of wine regions and geography.",
      count: counts.regions,
    },
    {
      to: "/explore/aromas",
      title: "Aroma Wheel",
      description: "WSET-aligned aroma taxonomy (primary, secondary, tertiary).",
      count: counts.aromas,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-h1 text-linen-100">Explore</h1>
        <p className="text-cork-400 mt-1">
          Browse the wine knowledge database: styles, grapes, regions, and aromas.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {cards.map(({ to, title, description, count }) => (
          <Link key={to} to={to} className="block no-underline">
            <Panel variant="oak" className="h-full transition-colors duration-base hover:border-brass-500/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-h2 text-linen-100">{title}</h2>
                  <p className="text-small text-cork-400 mt-2">{description}</p>
                </div>
                <span className="text-h2 font-ui text-brass-200 shrink-0">{count}</span>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
