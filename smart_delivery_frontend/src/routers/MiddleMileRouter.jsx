import {Route, Switch, useRouteMatch} from "react-router-dom";
import RoutesList from "../screens/middle-mile/RoutesList";
import RouteDetail from "../screens/middle-mile/RouteDetail";
import CreateRoute from "../screens/middle-mile/CreateRoute";
import TripManagement from "../screens/middle-mile/TripManagement";
import OrderAssignment from "../screens/middle-mile/OrderAssignment";
import VehicleDetail from "../screens/middle-mile/VehicleDetail";
import VehicleAssignmentsDetail from "../screens/middle-mile/VehicleAssignmentsDetail";
import DriverManagement from "../screens/middle-mile/DriverManagement";
import VehicleManagement from "../screens/middle-mile/VehicleManagement";
import DriverVehicleAssignmentManagement from "../screens/middle-mile/DriverVehicleAssignmentManagement";
import DriverDashboard from "../screens/middle-mile/DriverDashboard";
import DriverOrderManagement from "../screens/middle-mile/DriverOrderManagement";
import DriverRouteMap from "../screens/middle-mile/DriverRouteMap";
import DriverHubOperations from "../screens/middle-mile/DriverHubOperations";
import VehicleScheduler from "../screens/middle-mile/VehicleScheduler";
import DriverSchedule from "../screens/middle-mile/DriverSchedule";
import TripCreator from "../screens/middle-mile/TripCreator";

export default function MiddleMileRouter() {
    let {path} = useRouteMatch();

    return (
        <div>
            <Switch>
                <Route exact path={`${path}/routes`} component={RoutesList}/>
                <Route exact path={`${path}/routes/create`} component={CreateRoute}/>
                <Route exact path={`${path}/routes/edit/:routeId`} component={CreateRoute}/>
                <Route exact path={`${path}/routes/:routeId`} component={RouteDetail}/>
                <Route exact path={`${path}/vehicle-assignments/:assignmentId`} component={VehicleAssignmentsDetail}/>

                <Route
                    exact path={`${path}/vehicles/:id`} component={VehicleDetail}
                />
                <Route exact path={`${path}/trips`} component={TripManagement}/>
                <Route exact path={`${path}/trip/manage`} component={TripCreator}/>
                <Route exact path={`${path}/trips/:routeVehicleId/orders`} component={OrderAssignment}/>
                <Route exact path={`${path}/driver/manage`} component={DriverManagement}/>
                <Route exact path={`${path}/vehicle/manage`} component={VehicleManagement}/>
                <Route exact path={`${path}/driver-vehicle/manage`} component={DriverVehicleAssignmentManagement}/>
                <Route exact path={`${path}/driver/dashboard`} component={DriverDashboard}/>
                <Route exact path={`${path}/driver/orders/:tripId`} component={DriverOrderManagement}/>
                <Route exact path={`${path}/driver/route/:routeVehicleId`} component={DriverRouteMap}/>
                <Route exact path={`${path}/driver/hub/:hubId/:operationType`} component={DriverHubOperations}/>
                <Route exact path={`${path}/schedule`} component={VehicleScheduler}/>
                <Route exact path={`${path}/driver/schedule`} component={DriverSchedule}/>
            </Switch>
        </div>
    );
}