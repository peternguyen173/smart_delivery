import { Route, Switch, useRouteMatch } from "react-router-dom";
import CreateHub from "../screens/hub/createHub";
import ListHub from "../screens/hub/ListHub";
import UpdateHub from "../screens/hub/UpdateHub";
import createOrder from "../screens/order/createOrder";
import OrderList from "../screens/order/OrderList";
import UpdateOrder from "../screens/order/UpdateOrder";
export default function OrderRouters() {
    let { path } = useRouteMatch();
    console.log("Base path:", path); // Add this line for debugging

    return (
        <div>
            <Switch>
                <Route
                    component={OrderList}
                    exact
                    path={`${path}/orderlist`}
                />
                <Route
                    component={createOrder}
                    exact
                    path={`${path}/createorder`}
                />
                <Route
                    component={UpdateOrder}
                    exact
                    path={`${path}/update/:id`}
                />
            </Switch>
        </div>
    );
}
