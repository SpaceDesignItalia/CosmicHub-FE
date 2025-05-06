import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";

import CircleCharts from "../../Components/Analytics/CircleCharts";

export default function Analytics() {
    return <div className="w-full flex-1 flex-col p-4">
        <AnalyticsChart />
        <CircleCharts />
        
    </div>;
  }
  