import { LinearProgress } from "@mui/material";
import { Layout } from "layout";
import { drawerWidth } from "layout/sidebar/SideBar";
import { Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "react-router-dom";
import { useNotificationState } from "state/NotificationState";
import NotFound from "views/errors/NotFound";
import PrivateRoute from "./PrivateRoute";
import TeacherRouter from "./TeacherRouter";
import DemoScreen from "views/DemoScreen";
import HubScreen from "../views/HubScreen";
import HubManagerRouters from "./HubManagerRouters";
import OrderRouters from "./OrderRouters";
import HumanManagerRouters from "./HumanManagerRouters";
import MiddleMileRouter from "./MiddleMileRouter";
import StationRouter from "./StatisticsRouter";
import StatisticsRouter from "./StatisticsRouter";
import AdminRouter from "./AdminRouter";
const styles = {
  loadingProgress: {
    position: "fixed",
    top: 0,
    left: -drawerWidth,
    width: "calc(100% + 300px)",
    zIndex: 1202,
    "& div": {
      top: "0.5px",
    },
  },
};

function MainAppRouter(props) {
  const location = useLocation();
  const notificationState = useNotificationState();

  useEffect(() => {
    notificationState.open.set(false);
  }, [location.pathname]);

  return (
    <Layout>
      <Suspense fallback={<LinearProgress sx={styles.loadingProgress} />}>
        <Switch>
          <Route component={() => <></>} exact path="/" />
          <PrivateRoute component={DemoScreen} exact path="/demo" />
          <PrivateRoute  component={HubManagerRouters} path="/hubmanager" />
          <PrivateRoute  component={OrderRouters} path="/order" />
          <PrivateRoute  component={HumanManagerRouters} path="/employee" />
          <PrivateRoute component={MiddleMileRouter} path="/middle-mile" />
          <PrivateRoute component={StatisticsRouter} path="/statistics" />
          <PrivateRoute component={AdminRouter} path="/config" />

          {/* <Route component={error} path="*" /> */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

export default MainAppRouter;
