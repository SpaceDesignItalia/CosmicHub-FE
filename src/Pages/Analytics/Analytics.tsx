import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";

import CircleCharts from "../../Components/Analytics/CircleCharts";

export default function Analytics() {
    return <div className="w-full flex-1 flex-col p-4">
        <h1>Analytics</h1>
        <AnalyticsChart />
        <CircleCharts />
        
    </div>;
  }
  