import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {

  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {

    loadData();

  }, []);

  const loadData = async () => {

    const dashboardResponse =
      await axios.get(
        "http://localhost:8080/api/farm-dashboard"
      );

    const alertResponse =
      await axios.get(
        "http://localhost:8080/api/inventory-alerts"
      );

    setDashboard(
      dashboardResponse.data.data
    );

    setAlerts(
      alertResponse.data.data
    );
  };

  if (!dashboard) {

    return <div>Loading...</div>;
  }

  return (

    <div className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        Samaksh Farm Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4">

        <Card
          title="Spawn Balance"
          value={dashboard.spawnBalance}
        />

        <Card
          title="Pellet Balance"
          value={dashboard.pelletBalance}
        />

        <Card
          title="Bag Balance"
          value={dashboard.bagBalance}
        />

        <Card
          title="Dark Room Bags"
          value={dashboard.darkRoomBags}
        />

        <Card
          title="Light Room Bags"
          value={dashboard.lightRoomBags}
        />

        <Card
          title="Contaminated"
          value={dashboard.contaminatedBags}
        />

        <Card
          title="Discarded"
          value={dashboard.discardedBags}
        />

      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">
        Inventory Alerts
      </h2>

      <table className="w-full border">

        <thead>

        <tr>

          <th>Inventory</th>

          <th>Balance</th>

          <th>Min Required</th>

          <th>Status</th>

        </tr>

        </thead>

        <tbody>

        {alerts.map(
          (alert, index) => (

            <tr key={index}>

              <td>
                {alert.inventoryType}
              </td>

              <td>
                {alert.currentBalance}
              </td>

              <td>
                {alert.minimumRequired}
              </td>

              <td>
                {alert.alertStatus}
              </td>

            </tr>

          )
        )}

        </tbody>

      </table>

    </div>
  );
}

function Card(
  {
    title,
    value
  }: any
) {

  return (

    <div className="border rounded-lg p-4 shadow">

      <h3 className="font-semibold">

        {title}

      </h3>

      <div className="text-3xl mt-2">

        {value}

      </div>

    </div>
  );
}